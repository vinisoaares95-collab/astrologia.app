import type {
  Aspect,
  ChartRequest,
  NatalChart,
} from "../astrology/domain/types";
import { utcInstantFromIso } from "../astrology/domain/utc-instant";
import { normalizeDegrees } from "../astrology/domain/zodiac";
import type { EphemerisProvider } from "../astrology/engine/ephemeris-provider";
import { computeNatalChart } from "../astrology/service/compute-natal-chart";
import type { ResolvedInstant } from "../birth-time/types";
import type { NormalizedBirth } from "../birth-data/contract";
import type {
  ChartAspect,
  ChartBody,
  ChartView,
  LongitudeRange,
} from "./contract";

/** Arco de `a` (início da janela) a `b` (fim), no sentido do movimento. */
export function longitudeRange(a: number, b: number): LongitudeRange {
  const forward = normalizeDegrees(b - a);
  // Movimento retrógrado: o arco mais curto é no sentido inverso.
  const [start, end, width] =
    forward <= 180 ? [a, b, forward] : [b, a, 360 - forward];
  const startSign = Math.floor(normalizeDegrees(start) / 30);
  const crossesSign =
    Math.floor((normalizeDegrees(start) + width) / 30) !== startSign;
  return {
    start: normalizeDegrees(start),
    end: normalizeDegrees(end),
    width,
    crossesSign,
  };
}

const aspectKey = (a: Aspect) => `${a.a}|${a.b}|${a.type}`;

function chartAt(
  instant: ResolvedInstant,
  birth: NormalizedBirth,
  timePrecision: ChartRequest["timePrecision"],
  provider: EphemerisProvider,
): NatalChart {
  return computeNatalChart(
    {
      instant: utcInstantFromIso(instant.utc),
      location: birth.place.coordinates,
      timePrecision,
    },
    provider,
  );
}

/** Um segundo antes do fim exclusivo do dia (último instante do dia local). */
function lastInstantOf(end: ResolvedInstant): ResolvedInstant {
  const epochMs = end.epochMs - 1000;
  return {
    ...end,
    epochMs,
    utc: new Date(epochMs).toISOString().replace(".000Z", "Z"),
  };
}

/**
 * Monta o mapa a partir do nascimento normalizado.
 * - exato: um cálculo, com ângulos e casas;
 * - aproximado: centro + extremos da janela; ângulos como intervalos e
 *   casas NÃO determinadas (as cúspides variam com o Ascendente);
 * - desconhecido: meio-dia local de referência + extremos do dia; sem
 *   ângulos nem casas.
 */
export function buildChartView(
  birth: NormalizedBirth,
  provider: EphemerisProvider,
): ChartView {
  const time = birth.time;
  const reference =
    time.precision === "unknown" ? time.noonReference : time.instant;
  const window =
    time.precision === "approximate"
      ? { start: time.earliest, end: time.latest }
      : time.precision === "unknown"
        ? { start: time.dayStart, end: lastInstantOf(time.dayEndExclusive) }
        : null;

  const enginePrecision = time.precision === "unknown" ? "unknown" : "exact";
  const center = chartAt(reference, birth, enginePrecision, provider);
  const ends = window
    ? [
        chartAt(window.start, birth, enginePrecision, provider),
        chartAt(window.end, birth, enginePrecision, provider),
      ]
    : null;

  const bodies: ChartBody[] = center.bodies.map((body, i) => {
    if (!ends) return { ...body, range: null, houseVaries: null };
    const [first, last] = ends.map((c) => c.bodies[i]);
    const range = longitudeRange(first.longitude, last.longitude);
    const housesDiffer =
      first.house !== null && last.house !== null && first.house !== last.house;
    // Com horário aproximado, a casa só é afirmada se for a mesma nos dois
    // extremos da janela; sem horário, nunca há casa.
    const house =
      time.precision === "approximate" && !housesDiffer ? first.house : null;
    return {
      ...body,
      house,
      range,
      houseVaries: housesDiffer ? [first.house!, last.house!] : null,
    };
  });

  let angles: ChartView["angles"] = null;
  if (center.angles) {
    const angleRange = (key: "asc" | "mc") =>
      ends?.[0].angles && ends[1].angles
        ? longitudeRange(
            ends[0].angles[key].longitude,
            ends[1].angles[key].longitude,
          )
        : null;
    angles = {
      asc: { ...center.angles.asc, range: angleRange("asc") },
      mc: { ...center.angles.mc, range: angleRange("mc") },
    };
  }

  // Aspectos: com janela, considera os três instantes. Os que não aparecem
  // nos três são marcados como incertos. Com horário aproximado, aspectos
  // com ASC/MC são omitidos (os ângulos não estão determinados).
  const involvesAngle = (a: Aspect) =>
    ["asc", "mc"].includes(a.a) || ["asc", "mc"].includes(a.b);
  const allowed = (list: Aspect[]) =>
    time.precision === "approximate"
      ? list.filter((a) => !involvesAngle(a))
      : list;
  let aspects: ChartAspect[];
  if (!ends) {
    aspects = center.aspects.map((a) => ({ ...a, uncertain: false }));
  } else {
    const sets = [center, ...ends].map(
      (c) => new Set(allowed(c.aspects).map(aspectKey)),
    );
    const union = new Map<string, Aspect>();
    for (const c of [center, ...ends])
      for (const a of allowed(c.aspects))
        if (!union.has(aspectKey(a))) union.set(aspectKey(a), a);
    const centerByKey = new Map(
      allowed(center.aspects).map((a) => [aspectKey(a), a]),
    );
    aspects = [...union.entries()].map(([key, a]) => ({
      ...(centerByKey.get(key) ?? a),
      uncertain: !sets.every((s) => s.has(key)),
    }));
  }

  const warnings = [...center.warnings];
  if (time.precision === "approximate") {
    warnings.push({
      code: "APPROXIMATE_TIME_RANGES",
      message: `Horário aproximado (± ${time.marginMinutes} min): Ascendente e Meio do Céu aparecem como intervalos e as casas não são determinadas.`,
    });
  }

  return {
    precision: time.precision,
    orientation: angles
      ? { kind: "ascendant", longitude: angles.asc.longitude }
      : { kind: "aries", longitude: 0 },
    bodies,
    angles,
    houses: time.precision === "exact" ? center.houses : null,
    aspects: aspects.sort((x, y) => x.orb - y.orb),
    unavailable:
      time.precision === "approximate"
        ? {
            ...center.unavailable,
            houses: center.unavailable.houses ?? "BIRTH_TIME_APPROXIMATE",
          }
        : center.unavailable,
    warnings,
    parameters: {
      ...center.meta,
      tzdbVersion: birth.provenance.tzdbVersion,
      instantUtc: reference.utc,
      window: window
        ? { startUtc: window.start.utc, endUtc: window.end.utc }
        : null,
      julianDayUt: center.julianDay.ut,
    },
    birth,
  };
}
