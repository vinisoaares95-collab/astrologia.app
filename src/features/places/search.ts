import type { PlaceRecord, PlaceSummary } from "./types";

/** Remove acentos, pontuação e caixa: "São João d'Aliança" → "sao joao d alianca". */
export function foldText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const countryNames = new Intl.DisplayNames(["pt-BR"], { type: "region" });

const countryNameCache = new Map<string, string>();

export function countryName(code: string): string {
  let name = countryNameCache.get(code);
  if (name === undefined) {
    name = countryNames.of(code) ?? code;
    countryNameCache.set(code, name);
  }
  return name;
}

export function toSummary(record: PlaceRecord): PlaceSummary {
  const countryLabel = countryName(record.country);
  const region = record.admin1Code ?? record.admin1;
  return {
    id: record.id,
    name: record.name,
    region: record.admin1,
    regionCode: record.admin1Code ?? null,
    country: record.country,
    countryName: countryLabel,
    label: region
      ? `${record.name} — ${region}, ${countryLabel}`
      : `${record.name}, ${countryLabel}`,
    coordinates: { latitude: record.lat, longitude: record.lon },
    timeZone: record.tz,
  };
}

type IndexedPlace = {
  record: PlaceRecord;
  keys: string[];
  /** Estado/região, UF, código e nome do país (para "cidade, contexto"). */
  context: string[];
};

export type PlaceIndex = {
  entries: IndexedPlace[];
  byId: Map<string, PlaceRecord>;
};

export function buildIndex(records: readonly PlaceRecord[]): PlaceIndex {
  return {
    entries: records.map((record) => ({
      record,
      keys: [record.name, ...(record.alt ?? [])].map(foldText),
      context: [
        record.admin1,
        record.admin1Code,
        record.country,
        countryName(record.country),
      ]
        .filter((v): v is string => Boolean(v))
        .map(foldText),
    })),
    byId: new Map(records.map((r) => [r.id, r])),
  };
}

export const MIN_QUERY_LENGTH = 2;
const DEFAULT_LIMIT = 12;

/**
 * Busca por nome (ou nome alternativo), ignorando acentos e caixa.
 * Aceita contexto após uma vírgula — "Venice, Itália", "Santa Maria, RS" —
 * comparado com o início do estado/região, da UF ou do país.
 * Ordem: correspondência exata > início do nome > início de uma palavra;
 * depois, população (Brasil com peso maior, pelo público do produto).
 * NUNCA escolhe uma localidade: devolve todas as candidatas para seleção.
 */
export function searchPlaces(
  index: PlaceIndex,
  query: string,
  limit = DEFAULT_LIMIT,
): { results: PlaceSummary[]; total: number } {
  const [namePart, ...rest] = query.split(",");
  const q = foldText(namePart);
  const ctx = foldText(rest.join(" "));
  if (q.length < MIN_QUERY_LENGTH) return { results: [], total: 0 };

  const scored: { record: PlaceRecord; tier: number; weight: number }[] = [];
  for (const { record, keys, context } of index.entries) {
    if (ctx && !context.some((c) => c.startsWith(ctx))) continue;
    let tier = 0;
    for (const key of keys) {
      if (key === q) tier = Math.max(tier, 3);
      else if (key.startsWith(q)) tier = Math.max(tier, 2);
      else if (key.includes(` ${q}`)) tier = Math.max(tier, 1);
    }
    if (tier === 0) continue;
    const weight = (record.pop ?? 0) * (record.country === "BR" ? 5 : 1);
    scored.push({ record, tier, weight });
  }

  scored.sort(
    (a, b) =>
      b.tier - a.tier ||
      b.weight - a.weight ||
      a.record.name.localeCompare(b.record.name, "pt-BR") ||
      (a.record.admin1Code ?? "").localeCompare(b.record.admin1Code ?? ""),
  );
  return {
    results: scored.slice(0, limit).map((s) => toSummary(s.record)),
    total: scored.length,
  };
}
