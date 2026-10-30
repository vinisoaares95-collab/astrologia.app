import "server-only";

import brazil from "./data/places-br.json";
import meta from "./data/places-meta.json";
import world from "./data/places-world.json";
import { buildIndex, searchPlaces, toSummary, type PlaceIndex } from "./search";
import type { PlaceRecord, PlaceSummary } from "./types";

/*
 * Base de localidades carregada apenas no servidor (~1,5 MB de JSON).
 * Volume proporcional ao MVP: 5.571 municípios do IBGE + cidades
 * estrangeiras com 100 mil habitantes ou mais e capitais nacionais.
 */

let index: PlaceIndex | null = null;

function getIndex(): PlaceIndex {
  index ??= buildIndex([
    ...(brazil as PlaceRecord[]),
    ...(world as PlaceRecord[]),
  ]);
  return index;
}

export function findPlaces(query: string) {
  return searchPlaces(getIndex(), query);
}

export function getPlaceRecord(id: string): PlaceRecord | undefined {
  return getIndex().byId.get(id);
}

export function getPlaceSummary(id: string): PlaceSummary | undefined {
  const record = getPlaceRecord(id);
  return record && toSummary(record);
}

export const placesDatasetInfo = meta;

export { PLACES_ATTRIBUTION } from "./attribution";
