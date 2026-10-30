"use server";

import { getPlaceRecord } from "../places/repository";
import { offsetSecondsAt } from "../birth-time/zoned-time";
import {
  APPROXIMATE_MARGINS,
  type BirthDataInput,
  type NormalizationResult,
} from "./contract";
import { normalizeBirthData } from "./normalize";

/** Valida o formato da entrada vinda do navegador (não confiável). */
function parseInput(raw: unknown): BirthDataInput | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const str = (v: unknown, max: number) =>
    typeof v === "string" && v.length <= max ? v : null;
  const date = str(r.date, 10);
  const placeId = r.placeId === null ? null : str(r.placeId, 40);
  const occurrence =
    r.occurrence === "earlier" || r.occurrence === "later"
      ? r.occurrence
      : undefined;
  const t = r.time as Record<string, unknown> | undefined;
  if (date === null || placeId === undefined || !t || typeof t !== "object")
    return null;

  let time: BirthDataInput["time"];
  if (t.precision === "unknown") time = { precision: "unknown" };
  else if (t.precision === "exact" && str(t.value, 5) !== null) {
    time = { precision: "exact", value: t.value as string };
  } else if (
    t.precision === "approximate" &&
    str(t.value, 5) !== null &&
    (APPROXIMATE_MARGINS as readonly unknown[]).includes(t.marginMinutes)
  ) {
    time = {
      precision: "approximate",
      value: t.value as string,
      marginMinutes: t.marginMinutes as (typeof APPROXIMATE_MARGINS)[number],
    };
  } else return null;

  return { date, time, placeId, occurrence };
}

/** Data de hoje no fuso mais adiantado do mundo (UTC+14), para nunca recusar um nascimento de hoje. */
function latestToday() {
  const now = Date.now();
  const local = new Date(
    now + offsetSecondsAt("Pacific/Kiritimati", now) * 1000,
  );
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth() + 1,
    day: local.getUTCDate(),
  };
}

/**
 * Normaliza os dados de nascimento no servidor. Não persiste nem registra
 * dados pessoais e não chama o motor astrológico.
 */
export async function normalizeBirthAction(
  raw: unknown,
): Promise<NormalizationResult> {
  const input = parseInput(raw);
  if (!input) {
    return {
      status: "invalid",
      issues: [
        {
          field: "date",
          code: "DATE_FORMAT",
          message: "Dados em formato inesperado.",
        },
      ],
    };
  }
  return normalizeBirthData(input, {
    getPlace: getPlaceRecord,
    today: latestToday(),
    tzdbVersion: process.versions.tz ?? "desconhecida",
  });
}
