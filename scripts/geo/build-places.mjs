// Gera a base de localidades usada pela busca de cidades (Fase 02C).
//
// Fontes (todas abertas):
//  - Municípios do IBGE com coordenadas: kelvins/municipios-brasileiros (MIT),
//    revisão fixada em KELVINS_COMMIT. A coluna `fuso_horario` desse dataset
//    NÃO é usada: ela agrupa por deslocamento atual e erra o histórico.
//  - Cidades estrangeiras: GeoNames (CC BY 4.0) via npm `all-the-cities`
//    (população) e `cities.json` (nomes das regiões admin1).
//  - Fuso IANA: polígonos do timezone-boundary-builder via `geo-tz/all`
//    (conjunto completo, válido inclusive antes de 1970), conferidos contra
//    a tabela oficial zone1970.tab da tzdb para os estados brasileiros.
//
// Ferramentas instaladas fora do projeto (não são dependências do app):
//   mkdir -p .geo-tools && cd .geo-tools && npm init -y && \
//   npm pkg set overrides.tslib=2.8.1 && \
//   npm i --save-exact geo-tz@8.1.10 all-the-cities@3.1.0 cities.json@1.1.65
// Uso: GEO_TOOLS_DIR=.geo-tools node scripts/geo/build-places.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const KELVINS_COMMIT = "503e2f70bbf1b4b7ec0b1f68b09086ccc38fe861";
const KELVINS_BASE = `https://raw.githubusercontent.com/kelvins/municipios-brasileiros/${KELVINS_COMMIT}/csv/`;
const WORLD_MIN_POPULATION = 100_000;

const toolsDir = path.resolve(process.env.GEO_TOOLS_DIR ?? ".geo-tools");
const require = createRequire(path.join(toolsDir, "package.json"));
const { find } = require("geo-tz/all");
const allTheCities = require("all-the-cities");
const admin1Names = require("cities.json/admin1.json");
const toolVersions = Object.fromEntries(
  ["geo-tz", "all-the-cities", "cities.json"].map((p) => [
    p,
    JSON.parse(
      readFileSync(
        path.join(toolsDir, "node_modules", p, "package.json"),
        "utf8",
      ),
    ).version,
  ]),
);

const OUT = "src/features/places/data";

// zone1970.tab (tzdb): zona IANA por UF. PA e AM são divididos por
// fronteiras internas e são decididos pelos polígonos.
const ZONE_BY_UF = {
  AC: "America/Rio_Branco",
  AL: "America/Maceio",
  AP: "America/Belem",
  BA: "America/Bahia",
  CE: "America/Fortaleza",
  DF: "America/Sao_Paulo",
  ES: "America/Sao_Paulo",
  GO: "America/Sao_Paulo",
  MA: "America/Fortaleza",
  MG: "America/Sao_Paulo",
  MS: "America/Campo_Grande",
  MT: "America/Cuiaba",
  PB: "America/Fortaleza",
  PE: "America/Recife",
  PI: "America/Fortaleza",
  PR: "America/Sao_Paulo",
  RJ: "America/Sao_Paulo",
  RN: "America/Fortaleza",
  RO: "America/Porto_Velho",
  RR: "America/Boa_Vista",
  RS: "America/Sao_Paulo",
  SC: "America/Sao_Paulo",
  SE: "America/Maceio",
  SP: "America/Sao_Paulo",
  TO: "America/Araguaina",
};
const POLYGON_DECIDED_UF = new Set(["PA", "AM"]);
const FERNANDO_DE_NORONHA_IBGE = 2605459;

const fold = (s) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function parseCsv(text) {
  const [header, ...lines] = text.replace(/^﻿/, "").trim().split(/\r?\n/);
  const cols = header.split(",");
  return lines.map((line) =>
    Object.fromEntries(line.split(",").map((v, i) => [cols[i], v])),
  );
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const r = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * r) / 2) ** 2 +
    Math.cos(lat1 * r) *
      Math.cos(lat2 * r) *
      Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
}

/** Zonas IANA no ponto. Mais de uma = prática local disputada. */
const zonesAt = (lat, lon) => find(lat, lon);

function tzAt(lat, lon) {
  const zones = zonesAt(lat, lon);
  if (zones.length !== 1)
    throw new Error(`Fuso ambíguo em ${lat},${lon}: ${zones}`);
  return zones[0];
}

const round = (x) => Math.round(x * 1e4) / 1e4;

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  return res.text();
}

// ---------- Brasil ----------
const states = parseCsv(await fetchText(KELVINS_BASE + "estados.csv"));
const ufByCode = Object.fromEntries(states.map((s) => [s.codigo_uf, s]));
const ufByFoldedName = Object.fromEntries(
  states.map((s) => [fold(s.nome), s.uf]),
);
const municipalities = parseCsv(
  await fetchText(KELVINS_BASE + "municipios.csv"),
);

// População (GeoNames) por nome + UF + proximidade, só para ordenar resultados.
const gnUf = (adminCode) => {
  const entry = admin1Names.find((a) => a.code === `BR.${adminCode}`);
  return entry ? ufByFoldedName[fold(entry.name)] : undefined;
};
const gnBrazil = allTheCities
  .filter((c) => c.country === "BR")
  .map((c) => ({ ...c, uf: gnUf(c.adminCode), key: fold(c.name) }));

const report = {
  brMismatches: [],
  brPolygonDecided: {},
  brPopulationMatched: 0,
  worldAmbiguousTz: [],
};
const brazil = municipalities.map((m) => {
  const state = ufByCode[m.codigo_uf];
  const lat = Number(m.latitude);
  const lon = Number(m.longitude);
  const ibge = Number(m.codigo_ibge);
  const polygonZone = tzAt(lat, lon);
  let tz;
  if (ibge === FERNANDO_DE_NORONHA_IBGE) tz = "America/Noronha";
  else if (POLYGON_DECIDED_UF.has(state.uf)) {
    tz = polygonZone;
    report.brPolygonDecided[tz] = (report.brPolygonDecided[tz] ?? 0) + 1;
  } else {
    tz = ZONE_BY_UF[state.uf];
    if (polygonZone !== tz)
      report.brMismatches.push(
        `${m.nome}/${state.uf}: tabela ${tz}, polígono ${polygonZone}`,
      );
  }
  const key = fold(m.nome);
  const match = gnBrazil.find(
    (c) =>
      c.uf === state.uf &&
      c.key === key &&
      distanceKm(lat, lon, c.loc.coordinates[1], c.loc.coordinates[0]) < 30,
  );
  if (match) report.brPopulationMatched++;
  return {
    id: `ibge:${ibge}`,
    name: m.nome,
    admin1: state.nome,
    admin1Code: state.uf,
    country: "BR",
    lat: round(lat),
    lon: round(lon),
    tz,
    // Campos opcionais omitidos quando vazios, para reduzir o arquivo.
    ...(match ? { pop: match.population } : {}),
    ...(m.capital === "1" ? { capital: true } : {}),
  };
});

// ---------- Exterior ----------
const exonyms = JSON.parse(
  readFileSync("scripts/geo/exonyms-pt.json", "utf8"),
).entries;
const world = allTheCities
  .filter(
    (c) =>
      c.country !== "BR" &&
      (c.population >= WORLD_MIN_POPULATION || c.featureCode === "PPLC"),
  )
  .map((c) => {
    const [lon, lat] = c.loc.coordinates;
    const admin = admin1Names.find(
      (a) => a.code === `${c.country}.${c.adminCode}`,
    );
    // Onde as fronteiras indicam mais de um fuso, não escolhemos: a
    // localidade fica sem `tz` e a normalização a recusa.
    const zones = zonesAt(lat, lon);
    if (zones.length !== 1)
      report.worldAmbiguousTz.push(
        `${c.name}/${c.country}: ${zones.join(" | ")}`,
      );
    return {
      id: `geonames:${c.cityId}`,
      name: c.name,
      admin1: admin ? admin.name : null,
      country: c.country,
      lat: round(lat),
      lon: round(lon),
      tz: zones.length === 1 ? zones[0] : null,
      ...(zones.length !== 1 ? { tzCandidates: zones } : {}),
      pop: c.population,
      ...(c.featureCode === "PPLC" ? { capital: true } : {}),
      ...(c.altName ? { alt: [c.altName] } : {}),
    };
  });

const unmatchedExonyms = [];
for (const [name, country, alt] of exonyms) {
  const target = world
    .filter((c) => c.name === name && c.country === country)
    .sort((a, b) => b.pop - a.pop)[0];
  if (!target) unmatchedExonyms.push(`${name}/${country}`);
  else target.alt = [...new Set([...(target.alt ?? []), ...alt])];
}
if (unmatchedExonyms.length)
  throw new Error(
    `Exônimos sem correspondência: ${unmatchedExonyms.join(", ")}`,
  );
if (report.brMismatches.length) {
  console.error(
    "Divergências entre zone1970.tab e polígonos (tabela prevalece):",
  );
  for (const m of report.brMismatches) console.error("  " + m);
}

// ---------- Exterior estendido (Fase 02C.1) ----------
// Demais cidades do GeoNames (cities1000: ≥ 1.000 habitantes ou população
// desconhecida), carregadas no servidor só quando a busca precisa delas.
// Formato compacto: tabelas de regiões e fusos + linhas em array.
const mainIds = new Set(world.map((c) => c.id));
const admin1Table = [];
const admin1Index = new Map();
const zoneTable = [];
const zoneIndex = new Map();
const intern = (table, index, value) => {
  if (value == null) return -1;
  if (!index.has(value)) {
    index.set(value, table.length);
    table.push(value);
  }
  return index.get(value);
};
const extendedRows = [];
const extendedTzCandidates = {};
for (const c of allTheCities) {
  if (c.country === "BR" || mainIds.has(`geonames:${c.cityId}`)) continue;
  const [lon, lat] = c.loc.coordinates;
  const admin = admin1Names.find(
    (a) => a.code === `${c.country}.${c.adminCode}`,
  );
  const zones = zonesAt(lat, lon);
  if (zones.length !== 1) extendedTzCandidates[c.cityId] = zones;
  extendedRows.push([
    c.cityId,
    c.name,
    intern(admin1Table, admin1Index, admin ? admin.name : null),
    c.country,
    round(lat),
    round(lon),
    zones.length === 1 ? intern(zoneTable, zoneIndex, zones[0]) : -1,
    c.population,
    ...(c.altName ? [c.altName] : []),
  ]);
}
extendedRows.sort((a, b) => a[0] - b[0]);

const byName = (a, b) =>
  a.name.localeCompare(b.name, "pt-BR") || a.country.localeCompare(b.country);
brazil.sort(byName);
world.sort(byName);

writeFileSync(path.join(OUT, "places-br.json"), JSON.stringify(brazil));
writeFileSync(path.join(OUT, "places-world.json"), JSON.stringify(world));
writeFileSync(
  path.join(OUT, "places-world-extended.json"),
  JSON.stringify({
    columns: [
      "geonameId",
      "name",
      "admin1",
      "country",
      "lat",
      "lon",
      "tz",
      "pop",
      "altName?",
    ],
    admin1: admin1Table,
    zones: zoneTable,
    tzCandidates: extendedTzCandidates,
    rows: extendedRows,
  }),
);
const meta = {
  generatedBy: "scripts/geo/build-places.mjs",
  sources: {
    brazil: {
      dataset: "kelvins/municipios-brasileiros",
      commit: KELVINS_COMMIT,
      license: "MIT",
      origin: "IBGE",
    },
    world: {
      dataset: "GeoNames via all-the-cities + cities.json",
      license: "CC BY 4.0",
      minPopulation: WORLD_MIN_POPULATION,
    },
    worldExtended: {
      dataset: "GeoNames cities1000 via all-the-cities",
      license: "CC BY 4.0",
      note: "demais cidades estrangeiras, carregadas sob demanda",
    },
    timeZones: {
      dataset: "timezone-boundary-builder via geo-tz/all",
      license: "código MIT; dados ODbL (OpenStreetMap)",
    },
    zoneTable: "IANA tzdb zone1970.tab (domínio público)",
  },
  toolVersions,
  counts: {
    brazil: brazil.length,
    world: world.length,
    worldExtended: extendedRows.length,
  },
  report: {
    brazilPopulationMatched: report.brPopulationMatched,
    brazilPolygonDecided: report.brPolygonDecided,
    brazilTableVsPolygonMismatches: report.brMismatches.length,
    worldWithoutSingleTimeZone: report.worldAmbiguousTz,
    worldExtendedWithoutSingleTimeZone:
      Object.keys(extendedTzCandidates).length,
  },
};
writeFileSync(
  path.join(OUT, "places-meta.json"),
  JSON.stringify(meta, null, 2) + "\n",
);
console.log(JSON.stringify(meta.counts), JSON.stringify(meta.report));
