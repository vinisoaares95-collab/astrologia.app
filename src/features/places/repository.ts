import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { buildIndex, searchPlaces, toSummary, type PlaceIndex } from "./search";
import type { PlaceRecord, PlaceSummary } from "./types";

/*
 * Base de localidades carregada apenas no servidor, sob demanda.
 * - principal (~1,5 MB): 5.571 municípios do IBGE + cidades estrangeiras com
 *   100 mil habitantes ou mais e capitais;
 * - estendida (~7,4 MB): demais cidades estrangeiras do GeoNames (≥ 1.000
 *   habitantes), formato compacto. Veja docs/fase-02c1-consolidacao.md.
 */

type ExtendedFile = {
  admin1: string[];
  zones: string[];
  tzCandidates: Record<string, string[]>;
  rows: [
    number,
    string,
    number,
    string,
    number,
    number,
    number,
    number,
    string?,
  ][];
};

/** Converte o formato compacto do catálogo estendido em registros. */
export function decodeExtended(file: ExtendedFile): PlaceRecord[] {
  return file.rows.map(
    ([id, name, admin1, country, lat, lon, tz, pop, altName]) => ({
      id: `geonames:${id}`,
      name,
      admin1: admin1 >= 0 ? file.admin1[admin1] : null,
      country,
      lat,
      lon,
      tz: tz >= 0 ? file.zones[tz] : null,
      ...(tz < 0 && file.tzCandidates[id]
        ? { tzCandidates: file.tzCandidates[id] }
        : {}),
      pop,
      ...(altName ? { alt: [altName] } : {}),
    }),
  );
}

// Leitura com JSON.parse (bem mais rápida que importar 7 MB como módulo JS).
// Os arquivos entram no deploy via outputFileTracingIncludes (next.config.ts);
// o marcador evita que o Turbopack rastreie o projeto inteiro.
const DATA_DIR = path.join(process.cwd(), "src/features/places/data");
const readData = (file: string) =>
  readFile(
    /*turbopackIgnore: true*/ path.join(
      /*turbopackIgnore: true*/ DATA_DIR,
      file,
    ),
    "utf8",
  );

let loading: Promise<PlaceIndex> | null = null;

function getIndex(): Promise<PlaceIndex> {
  loading ??= (async () => {
    const [brazil, world, extended] = await Promise.all([
      readData("places-br.json"),
      readData("places-world.json"),
      readData("places-world-extended.json"),
    ]);
    return buildIndex([
      ...(JSON.parse(brazil) as PlaceRecord[]),
      ...(JSON.parse(world) as PlaceRecord[]),
      ...decodeExtended(JSON.parse(extended) as ExtendedFile),
    ]);
  })();
  return loading;
}

export async function findPlaces(query: string) {
  return searchPlaces(await getIndex(), query);
}

/** Resolve o id escolhido (síncrono após a carga, para a normalização). */
export async function getPlaceLookup(): Promise<
  (id: string) => PlaceRecord | undefined
> {
  const index = await getIndex();
  return (id) => index.byId.get(id);
}

export async function getPlaceSummary(
  id: string,
): Promise<PlaceSummary | undefined> {
  const record = (await getIndex()).byId.get(id);
  return record && toSummary(record);
}

export { PLACES_ATTRIBUTION } from "./attribution";
