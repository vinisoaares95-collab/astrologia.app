import { ChartError } from "../engine/errors";
import type { UtcInstant } from "./types";

const ISO_UTC = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)Z$/;

/**
 * Converte um instante ISO 8601 em UTC (como o produzido pela normalização,
 * ex.: "1910-01-01T15:06:28Z") no contrato do motor, preservando segundos.
 */
export function utcInstantFromIso(iso: string): UtcInstant {
  const match = ISO_UTC.exec(iso);
  if (!match) {
    throw new ChartError("INVALID_DATE", `Instante UTC inválido: ${iso}`);
  }
  const [year, month, day, hour, minute] = match.slice(1, 6).map(Number);
  return { year, month, day, hour, minute, second: Number(match[6]) };
}
