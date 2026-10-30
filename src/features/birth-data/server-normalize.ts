import "server-only";

import {
  TZDB_EXPECTED_VERSION,
  isExpectedTzdb,
  runtimeTzdbVersion,
} from "../birth-time/tzdb";
import { offsetSecondsAt } from "../birth-time/zoned-time";
import { getPlaceLookup } from "../places/repository";
import { ISSUE_MESSAGES } from "./messages";
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
 * Normaliza os dados de nascimento no servidor (compartilhado pelas Server
 * Actions de normalização e de cálculo do mapa). Não persiste nem registra
 * dados pessoais.
 */
export async function normalizeOnServer(
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
  // Nunca converter com uma base de fusos diferente da validada: os
  // resultados mudariam sem aviso (ex.: Brasil 1965/1966 entre 2025b e 2026f).
  if (!isExpectedTzdb()) {
    console.error(
      `tzdb ${runtimeTzdbVersion()} em uso; esperada ${TZDB_EXPECTED_VERSION}. Defina ICU_TIMEZONE_FILES_DIR (tzdata/README.md).`,
    );
    return {
      status: "invalid",
      issues: [
        {
          field: "time",
          code: "TZDB_VERSION_MISMATCH",
          message: ISSUE_MESSAGES.TZDB_VERSION_MISMATCH,
        },
      ],
    };
  }
  return normalizeBirthData(input, {
    getPlace: await getPlaceLookup(),
    today: latestToday(),
    tzdbVersion: runtimeTzdbVersion(),
  });
}
