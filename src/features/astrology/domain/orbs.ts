import type { AspectType } from "./types";

/**
 * Tabela de orbes v1 — aprovada provisoriamente (Fase 02A).
 * Configuração versionada: qualquer alteração deve gerar uma nova versão,
 * pois o identificador entra no `calcVersion` de cada mapa.
 */
export const ORBS_V1 = {
  version: "orbs-v1",
  aspects: {
    conjunction: { angle: 0, orb: 8 },
    opposition: { angle: 180, orb: 8 },
    square: { angle: 90, orb: 7 },
    trine: { angle: 120, orb: 7 },
    sextile: { angle: 60, orb: 5 },
  } satisfies Record<AspectType, { angle: number; orb: number }>,
  /** Acréscimo quando o aspecto envolve o Sol ou a Lua. */
  luminaryBonus: 2,
  /** Orbe máximo para aspectos com Ascendente ou Meio do Céu. */
  angleOrb: 5,
} as const;

export type OrbTable = typeof ORBS_V1;
