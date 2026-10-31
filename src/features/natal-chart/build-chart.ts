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

/** Intervalo entre amostras da janela de incerteza. */
export const SAMPLE_STEP_MINUTES = 30;

/**
 * Menor arco que contém todas as longitudes amostradas, medido em torno da
 * longitude de referência (que fica sempre dentro do intervalo). Funciona
 * mesmo quando o planeta muda de direção (estação) dentro da janela.
 */
export function longitudeRangeFromSamples(
  reference: number,
  samples: readonly number[],
): LongitudeRange {
  let min = 0;
  let max = 0;
  for (const lon of samples) {
    const delta = ((normalizeDegrees(lon - reference) + 180) % 360) - 180;
    min = Math.min(min, delta);
    max = Math.max(max, delta);
  }
  const start = normalizeDegrees(reference + min);
  const width = max - min;
  const crossesSign =
    Math.floor(start / 30) !== Math.floor((start + width) / 30);
  return { start, end: normalizeDegrees(reference + max), width, crossesSign };
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

const atEpoch = (base: ResolvedInstant, epochMs: number): ResolvedInstant => ({
  ...base,
  epochMs,
  utc: new Date(epochMs).toISOString().replace(".000Z", "Z"),
});

/** Um segundo antes do fim exclusivo do dia (último instante do dia local). */
function lastInstantOf(end: ResolvedInstant): ResolvedInstant {
  return atEpoch(end, end.epochMs - 1000);
}

/** Instantes da janela a cada SAMPLE_STEP_MINUTES, incluindo os extremos. */
function sampleWindow(
  start: ResolvedInstant,
  end: ResolvedInstant,
): ResolvedInstant[] {
  const step = SAMPLE_STEP_MINUTES * 60_000;
  const out: ResolvedInstant[] = [];
  for (let t = start.epochMs; t < end.epochMs; t += step)
    out.push(atEpoch(start, t));
  out.push(end);
  return out;
}

/**
 * Monta o mapa a partir do nascimento normalizado.
 * - exato: um cálculo, com ângulos e casas;
 * - aproximado: instante informado + amostras da janela (a cada 30 min);
 *   ângulos como intervalos e casas NÃO determinadas (as cúspides variam
 *   com o Ascendente);
 * - desconhecido: meio-dia local de referência + amostras do dia inteiro;
 *   sem ângulos nem casas.
 * A amostragem densa (e não só os extremos) capta estações planetárias e
 * todas as casas por onde um corpo passa dentro da janela.
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
  const samples = window
    ? sampleWindow(window.start, window.end).map((i) =>
        chartAt(i, birth, enginePrecision, provider),
      )
    : null;

  const bodies: ChartBody[] = center.bodies.map((body, i) => {
    if (!samples)
      return { ...body, range: null, houseVaries: null, motionVaries: false };
    const range = longitudeRangeFromSamples(
      body.longitude,
      samples.map((c) => c.bodies[i].longitude),
    );
    // Com horário aproximado, a casa só é afirmada se for a mesma em todas as
    // amostras da janela; sem horário, nunca há casa.
    const visited = [...new Set(samples.map((c) => c.bodies[i].house))];
    const stable = visited.length === 1 && visited[0] !== null;
    const house =
      time.precision === "approximate" && stable ? visited[0] : null;
    const houseVaries =
      time.precision === "approximate" && !stable
        ? visited.filter((h): h is number => h !== null).sort((a, b) => a - b)
        : null;
    const motionVaries =
      new Set(samples.map((c) => c.bodies[i].retrograde)).size > 1;
    return { ...body, house, range, houseVaries, motionVaries };
  });

  let angles: ChartView["angles"] = null;
  if (center.angles) {
    const angleRange = (key: "asc" | "mc") =>
      samples && samples.every((c) => c.angles)
        ? longitudeRangeFromSamples(
            center.angles![key].longitude,
            samples.map((c) => c.angles![key].longitude),
          )
        : null;
    angles = {
      asc: { ...center.angles.asc, range: angleRange("asc") },
      mc: { ...center.angles.mc, range: angleRange("mc") },
    };
  }

  // Aspectos: com janela, considera todas as amostras. Os que não aparecem
  // em todas são marcados como incertos. Com horário aproximado, aspectos
  // com ASC/MC são omitidos (os ângulos não estão determinados).
  const involvesAngle = (a: Aspect) =>
    ["asc", "mc"].includes(a.a) || ["asc", "mc"].includes(a.b);
  const allowed = (list: Aspect[]) =>
    time.precision === "approximate"
      ? list.filter((a) => !involvesAngle(a))
      : list;
  let aspects: ChartAspect[];
  if (!samples) {
    aspects = center.aspects.map((a) => ({ ...a, uncertain: false }));
  } else {
    const all = [center, ...samples];
    const sets = all.map((c) => new Set(allowed(c.aspects).map(aspectKey)));
    const union = new Map<string, Aspect>();
    for (const c of all)
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
