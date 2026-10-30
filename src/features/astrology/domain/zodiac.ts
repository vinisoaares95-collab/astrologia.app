import { SIGNS, type ZodiacPosition } from "./types";

/** Normaliza qualquer ângulo para 0 ≤ x < 360. */
export function normalizeDegrees(value: number): number {
  const x = value % 360;
  return x < 0 ? x + 360 : x;
}

/** Menor distância angular entre duas longitudes (0–180). */
export function angularSeparation(a: number, b: number): number {
  const d = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
  return d > 180 ? 360 - d : d;
}

/**
 * Converte longitude eclíptica em signo, grau e minuto.
 * Grau e minuto são TRUNCADOS (convenção astrológica): 29°59.9′ nunca é
 * exibido como 30°00′ do signo seguinte.
 */
export function toZodiacPosition(longitude: number): ZodiacPosition {
  const lon = normalizeDegrees(longitude);
  const signIndex = Math.floor(lon / 30);
  const within = lon - signIndex * 30;
  const degree = Math.floor(within);
  const minute = Math.floor((within - degree) * 60);
  return { longitude: lon, sign: SIGNS[signIndex], degree, minute };
}

/** Distância (em graus) até o limite de signo mais próximo. */
export function distanceToSignBoundary(longitude: number): number {
  const within = normalizeDegrees(longitude) % 30;
  return Math.min(within, 30 - within);
}

/**
 * Casa (1–12) em que uma longitude cai, dadas as 12 cúspides em ordem
 * (cúspide 1 = Ascendente). Intervalo semiaberto [cúspide n, cúspide n+1).
 */
export function houseOf(longitude: number, cusps: readonly number[]): number {
  if (cusps.length !== 12) throw new Error("São necessárias 12 cúspides.");
  const lon = normalizeDegrees(longitude);
  for (let i = 0; i < 12; i++) {
    const start = normalizeDegrees(cusps[i]);
    const span = normalizeDegrees(cusps[(i + 1) % 12] - start);
    if (normalizeDegrees(lon - start) < span) return i + 1;
  }
  // Inalcançável com cúspides válidas (os intervalos cobrem 360°).
  throw new Error("Cúspides inconsistentes.");
}
