/**
 * Contrato do mapa natal entregue à interface (Fase 02D).
 * Monta-se a partir do nascimento normalizado (Fase 02C) e do motor (02B);
 * contém apenas dados calculados — nenhuma interpretação.
 */
import type {
  Aspect,
  Body,
  BodyPosition,
  NatalChart,
  ZodiacPosition,
} from "../astrology/domain/types";
import type { NormalizedBirth } from "../birth-data/contract";

/** Arco percorrido dentro da janela de incerteza (sentido do movimento). */
export type LongitudeRange = {
  /** Longitude no início da janela. */
  start: number;
  /** Longitude no fim da janela. */
  end: number;
  /** Largura do arco, em graus (sempre ≥ 0). */
  width: number;
  /** O arco cruza um limite de signo. */
  crossesSign: boolean;
};

export type ChartBody = BodyPosition & {
  /** Presente quando o horário é aproximado ou desconhecido. */
  range: LongitudeRange | null;
  /** Casas nos extremos da janela, quando diferem (horário aproximado). */
  houseVaries: [number, number] | null;
};

export type ChartAngle = ZodiacPosition & { range: LongitudeRange | null };

export type ChartAspect = Aspect & {
  /** O aspecto não está presente em toda a janela de incerteza. */
  uncertain: boolean;
};

export type ChartView = {
  precision: NormalizedBirth["time"]["precision"];
  /**
   * O que fica às 9 h (lado esquerdo) da mandala:
   * - "ascendant": o Ascendente calculado (horário exato ou centro da janela);
   * - "aries": 0° de Áries (sem horário — nenhum ângulo é afirmado).
   */
  orientation: { kind: "ascendant" | "aries"; longitude: number };
  bodies: ChartBody[];
  angles: { asc: ChartAngle; mc: ChartAngle } | null;
  /** Cúspides só quando determinadas (horário exato e Placidus definido). */
  houses: { cusps: ZodiacPosition[] } | null;
  aspects: ChartAspect[];
  unavailable: NatalChart["unavailable"];
  warnings: { code: string; message: string }[];
  parameters: NatalChart["meta"] & {
    tzdbVersion: string;
    /** Instante usado no cálculo (UTC ISO); para janelas, o centro ou meio-dia. */
    instantUtc: string;
    window: { startUtc: string; endUtc: string } | null;
    julianDayUt: number;
  };
  birth: NormalizedBirth;
};

export type ChartResult =
  | { status: "ok"; chart: ChartView }
  /** Motor desligado neste ambiente (padrão fora do desenvolvimento interno). */
  | { status: "engine-disabled" }
  | { status: "engine-error"; code: string; message: string };

export type { Body };
