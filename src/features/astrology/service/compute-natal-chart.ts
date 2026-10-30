import { findAspects, type AspectInput } from "../domain/aspects";
import { ORBS_V1 } from "../domain/orbs";
import {
  BODIES,
  type BodyPosition,
  type ChartRequest,
  type NatalChart,
} from "../domain/types";
import {
  distanceToSignBoundary,
  houseOf,
  toZodiacPosition,
} from "../domain/zodiac";
import type { EphemerisProvider } from "../engine/ephemeris-provider";
import { ChartError } from "../engine/errors";

/** Versão do algoritmo de montagem do mapa (independente do motor). */
export const CHART_ALGORITHM_VERSION = "chart-0.1.0-experimental";

/** Abaixo deste valor (≈ 1′), um posicionamento é marcado como limítrofe. */
const BOUNDARY_WARNING_DEGREES = 1 / 60;

function validateRequest(
  { instant, location }: ChartRequest,
  provider: EphemerisProvider,
) {
  const values = [
    instant.year,
    instant.month,
    instant.day,
    instant.hour,
    instant.minute,
    location.latitude,
    location.longitude,
  ];
  if (values.some((v) => !Number.isFinite(v))) {
    throw new ChartError("INVALID_DATE", "Dados numéricos inválidos.");
  }
  if (
    !Number.isInteger(instant.hour) ||
    !Number.isInteger(instant.minute) ||
    instant.hour < 0 ||
    instant.hour > 23 ||
    instant.minute < 0 ||
    instant.minute > 59
  ) {
    throw new ChartError(
      "INVALID_DATE",
      "Horário fora do intervalo 00:00–23:59.",
    );
  }
  const { from, to } = provider.info.supportedYears;
  if (instant.year < from || instant.year > to) {
    throw new ChartError(
      "DATE_OUT_OF_RANGE",
      `Ano fora da faixa suportada pelas efemérides (${from}–${to}).`,
    );
  }
  if (Math.abs(location.latitude) >= 90 || Math.abs(location.longitude) > 180) {
    throw new ChartError(
      "INVALID_COORDINATES",
      "Latitude deve estar entre −90 e 90 (exclusive) e longitude entre −180 e 180.",
    );
  }
}

/**
 * Monta um mapa natal a partir de um instante UTC e coordenadas.
 * Não interpreta nada: apenas organiza dados calculados e verificáveis.
 *
 * Regras de contrato:
 * - horário desconhecido ⇒ sem Ascendente, Meio do Céu, casas ou aspectos
 *   com ângulos;
 * - Placidus indefinido (latitudes polares) ⇒ sem casas, nunca outro sistema.
 */
export function computeNatalChart(
  request: ChartRequest,
  provider: EphemerisProvider,
): NatalChart {
  validateRequest(request, provider);

  const julianDay = provider.julianDay(request.instant);
  const warnings: NatalChart["warnings"] = [];
  const unavailable: NatalChart["unavailable"] = {};

  let angles: NatalChart["angles"] = null;
  let cusps: number[] | null = null;

  if (request.timePrecision === "exact") {
    const houses = provider.housesPlacidus(julianDay.ut, request.location);
    angles = {
      asc: toZodiacPosition(houses.asc),
      mc: toZodiacPosition(houses.mc),
    };
    cusps = houses.cusps;
    if (!cusps) {
      unavailable.houses = "PLACIDUS_UNDEFINED";
      warnings.push({
        code: "PLACIDUS_UNDEFINED",
        message:
          "Casas Placidus não são definidas nesta latitude. Ascendente e Meio do Céu continuam válidos.",
      });
    }
  } else {
    unavailable.angles = "BIRTH_TIME_UNKNOWN";
    unavailable.houses = "BIRTH_TIME_UNKNOWN";
    warnings.push({
      code: "BIRTH_TIME_UNKNOWN",
      message:
        "Sem horário de nascimento, Ascendente, Meio do Céu e casas não são calculados.",
    });
  }

  const bodies: BodyPosition[] = BODIES.map((body) => {
    const p = provider.bodyPosition(julianDay.ut, body);
    if (distanceToSignBoundary(p.longitude) < BOUNDARY_WARNING_DEGREES) {
      warnings.push({
        code: "NEAR_SIGN_BOUNDARY",
        message: `${body} está a menos de 1′ de um limite de signo.`,
      });
    }
    return {
      body,
      ...toZodiacPosition(p.longitude),
      latitude: p.latitude,
      speed: p.speed,
      retrograde: p.speed < 0,
      house: cusps ? houseOf(p.longitude, cusps) : null,
    };
  });

  const aspectPoints: AspectInput[] = bodies.map((b) => ({
    point: b.body,
    longitude: b.longitude,
    speed: b.speed,
  }));
  if (angles) {
    aspectPoints.push(
      { point: "asc", longitude: angles.asc.longitude, speed: null },
      { point: "mc", longitude: angles.mc.longitude, speed: null },
    );
  }

  const { info } = provider;
  return {
    meta: {
      calcVersion: `${CHART_ALGORITHM_VERSION}+${info.engine}-${info.engineVersion}+${info.ephemeris}+${ORBS_V1.version}`,
      engine: info.engine,
      engineVersion: info.engineVersion,
      ephemeris: info.ephemeris,
      zodiac: "tropical",
      frame: "geocentric-apparent-true-ecliptic-of-date",
      houseSystem: "placidus",
      orbs: ORBS_V1.version,
    },
    julianDay,
    bodies,
    angles,
    houses: cusps ? { cusps: cusps.map(toZodiacPosition) } : null,
    unavailable,
    aspects: findAspects(aspectPoints),
    warnings,
  };
}
