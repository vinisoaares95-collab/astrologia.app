"use server";

import { findPlaces, getPlaceSummary } from "./repository";
import { MIN_QUERY_LENGTH } from "./search";

const MAX_QUERY_LENGTH = 80;

/** Busca de cidades para o autocompletar. Nada é registrado. */
export async function searchPlacesAction(query: unknown) {
  if (typeof query !== "string") return { results: [], total: 0 };
  const q = query.slice(0, MAX_QUERY_LENGTH);
  if (q.trim().length < MIN_QUERY_LENGTH) return { results: [], total: 0 };
  return findPlaces(q);
}

/** Resumo de uma localidade pelo id (usado pelos casos demonstrativos). */
export async function getPlaceAction(id: unknown) {
  if (typeof id !== "string" || id.length > 40) return null;
  return getPlaceSummary(id) ?? null;
}
