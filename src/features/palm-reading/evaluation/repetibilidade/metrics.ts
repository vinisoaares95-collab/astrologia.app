/**
 * Métricas de repetibilidade (M1–M9 do plano), puras e determinísticas.
 *
 * Compara SÓ o resultado estruturado de cada característica (visibilidade,
 * valor, motivo). O texto livre da evidência nunca entra na comparação: duas
 * análises com redações diferentes e a mesma classificação são iguais.
 *
 * Unidades:
 * - célula = foto × característica, com N análises válidas da MESMA foto
 *   (repetições não são fotos independentes);
 * - agregado = soma das células de um grupo (originais OU novas, nunca
 *   misturados), com intervalo agrupado por foto.
 */
import {
  FEATURE_IDS,
  FEATURE_VALUES,
  type FeatureId,
} from "../../analysis/contract";
import { buildPalmInterpretation } from "../../analysis/engine";
import type { ValidatedObservation } from "../../analysis/validate-observation";
import { retakeRecommendedFor } from "../../chapters/presentation";
import { CONSENSUS, INTERVALS } from "./config";
import type { AnalysisRecord, PhotoOrigin } from "./contract";

/** Leitura "não interpretada" (não visível, ambígua, inclassificável…). */
export const NONE = "∅";

type FeatureObs = ValidatedObservation["features"][FeatureId];

export function readingOf(o: ValidatedObservation, f: FeatureId): string {
  const x = o.features[f];
  return x.visibility === "not_visible" ? NONE : String(x.value);
}

export type PairKind =
  "igual" | "inversao_oposta" | "inversao_gradual" | "oscilacao" | "motivo";

/**
 * Tipo de divergência entre duas análises da mesma característica.
 * - binárias: toda troca de valor é inversão oposta;
 * - 3 níveis: vizinhos = gradual; extremos (curta ↔ longa) = oposta;
 * - classificada × não interpretada = oscilação (de abstenção);
 * - duas não interpretadas com motivos diferentes = só motivo.
 */
export function pairKind(f: FeatureId, a: FeatureObs, b: FeatureObs): PairKind {
  if (a.visibility === "not_visible" && b.visibility === "not_visible")
    return a.reason === b.reason ? "igual" : "motivo";
  if (a.visibility === "not_visible" || b.visibility === "not_visible")
    return "oscilacao";
  if (a.value === b.value) return "igual";
  const values = FEATURE_VALUES[f] as readonly string[];
  if (values.length === 3) {
    const d = Math.abs(
      values.indexOf(String(a.value)) - values.indexOf(String(b.value)),
    );
    return d === 1 ? "inversao_gradual" : "inversao_oposta";
  }
  return "inversao_oposta";
}

const valid = (rs: AnalysisRecord[]) =>
  rs.filter(
    (r): r is AnalysisRecord & { observation: ValidatedObservation } =>
      r.outcome === "ok" && r.observation !== null,
  );

function modal<T>(xs: T[]): { value: T | null; count: number } {
  const counts = new Map<T, number>();
  for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1);
  let best: T | null = null;
  let n = 0;
  for (const [k, v] of counts) if (v > n) [best, n] = [k, v];
  return { value: best, count: n };
}

export type CellMetrics = {
  photoId: string;
  feature: FeatureId;
  n: number;
  modal: string | null;
  /** M1: fração das análises iguais à leitura mais frequente. */
  agreement: number;
  /** M1 estrito (visibilidade + valor + motivo), descritivo. */
  strictAgreement: number;
  classified: number;
  /** M4: fração "não interpretada". */
  indeterminateShare: number;
  pairs: number;
  classifiedPairs: number;
  inversions: number;
  opposite: number;
  gradual: number;
  oscillations: number;
  reasonOnly: number;
  /** M8: pares classificados com as duas análises "claras" / com alguma parcial. */
  clearPairs: number;
  clearInversions: number;
  partialPairs: number;
  partialInversions: number;
};

export function cellMetrics(
  photoId: string,
  f: FeatureId,
  observations: ValidatedObservation[],
): CellMetrics {
  const obs = observations.map((o) => o.features[f]);
  const readings = observations.map((o) => readingOf(o, f));
  const strict = obs.map((x) =>
    x.visibility === "not_visible"
      ? `nv|${x.reason}`
      : `${x.visibility}|${String(x.value)}`,
  );
  const m = modal(readings);
  const c: CellMetrics = {
    photoId,
    feature: f,
    n: obs.length,
    modal: m.value,
    agreement: obs.length ? m.count / obs.length : 0,
    strictAgreement: obs.length ? modal(strict).count / obs.length : 0,
    classified: readings.filter((r) => r !== NONE).length,
    indeterminateShare: obs.length
      ? readings.filter((r) => r === NONE).length / obs.length
      : 0,
    pairs: 0,
    classifiedPairs: 0,
    inversions: 0,
    opposite: 0,
    gradual: 0,
    oscillations: 0,
    reasonOnly: 0,
    clearPairs: 0,
    clearInversions: 0,
    partialPairs: 0,
    partialInversions: 0,
  };
  for (let i = 0; i < obs.length; i++)
    for (let j = i + 1; j < obs.length; j++) {
      const k = pairKind(f, obs[i], obs[j]);
      c.pairs++;
      if (k === "oscilacao") c.oscillations++;
      if (k === "motivo") c.reasonOnly++;
      const bothClassified =
        obs[i].visibility !== "not_visible" &&
        obs[j].visibility !== "not_visible";
      if (!bothClassified) continue;
      c.classifiedPairs++;
      const inv = k === "inversao_oposta" || k === "inversao_gradual";
      if (inv) c.inversions++;
      if (k === "inversao_oposta") c.opposite++;
      if (k === "inversao_gradual") c.gradual++;
      if (obs[i].visibility === "clear" && obs[j].visibility === "clear") {
        c.clearPairs++;
        if (inv) c.clearInversions++;
      } else {
        c.partialPairs++;
        if (inv) c.partialInversions++;
      }
    }
  return c;
}

// ── Capítulos 6 e 7 e pedido de nova foto ─────────────────────────────────

export type ReadingEffect = {
  status: ValidatedObservation["status"];
  retake: boolean;
  /** Ids dos itens dos capítulos 6 (maos) e 7 (linhas), ordenados. */
  ch6: string;
  ch7: string;
};

export function readingEffect(o: ValidatedObservation): ReadingEffect {
  const report = buildPalmInterpretation(o);
  const ids = (n: 0 | 1) =>
    report.chapters[n].items
      .map((i) => i.id)
      .sort()
      .join(" ");
  return {
    status: o.status,
    retake: retakeRecommendedFor(report),
    ch6: ids(0),
    ch7: ids(1),
  };
}

export type PhotoMetrics = {
  photoId: string;
  origin: PhotoOrigin;
  participant: string;
  executed: number;
  valid: number;
  invalid: number;
  providerErrors: number;
  notRun: number;
  /** M5: estado da leitura e pedido de nova foto. */
  statusModal: string | null;
  statusStable: boolean;
  retakeShare: number;
  retakeStable: boolean;
  /** M2: fração das análises com o mesmo conjunto de itens do mais frequente. */
  ch6Agreement: number;
  ch7Agreement: number;
  ch6AvailableModal: boolean;
  ch7AvailableModal: boolean;
  ch6AvailabilityStable: boolean;
  ch7AvailabilityStable: boolean;
  /** M7: custo, tokens e duração. */
  costUsd: number;
  meanCostUsd: number;
  /** Média só das análises com cache lido (sem gravação de cache). */
  meanWarmCostUsd: number | null;
  inputTokens: number;
  outputTokens: number;
  meanLatencyMs: number;
  maxLatencyMs: number;
  /** M6: concordância modal da leitura por sessão (média das características). */
  bySession: Record<string, { valid: number; agreement: number }>;
  cells: CellMetrics[];
};

const mean = (xs: number[]) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

export function photoMetrics(records: AnalysisRecord[]): PhotoMetrics {
  const first = records[0];
  const ok = valid(records);
  const executedRs = records.filter((r) => r.outcome !== "not_run");
  const effects = ok.map((r) => readingEffect(r.observation));
  const share = (xs: string[]) => (xs.length ? modal(xs).count / xs.length : 0);
  const warm = executedRs.filter(
    (r) => r.usage && r.usage.cacheCreationInputTokens === 0,
  );
  const sessions = [...new Set(ok.map((r) => r.session))];
  const ch6Modal = modal(effects.map((e) => e.ch6)).value;
  const ch7Modal = modal(effects.map((e) => e.ch7)).value;
  const avail = (k: "ch6" | "ch7") => effects.map((e) => e[k] !== "");
  return {
    photoId: first.photoId,
    origin: first.origin,
    participant: first.participant,
    executed: executedRs.length,
    valid: ok.length,
    invalid: records.filter(
      (r) => r.outcome === "invalid_output" || r.outcome === "refused",
    ).length,
    providerErrors: records.filter((r) => r.outcome === "provider_error")
      .length,
    notRun: records.filter((r) => r.outcome === "not_run").length,
    statusModal: modal(effects.map((e) => e.status)).value,
    statusStable: new Set(effects.map((e) => e.status)).size <= 1,
    retakeShare: effects.length
      ? effects.filter((e) => e.retake).length / effects.length
      : 0,
    retakeStable: new Set(effects.map((e) => e.retake)).size <= 1,
    ch6Agreement: share(effects.map((e) => e.ch6)),
    ch7Agreement: share(effects.map((e) => e.ch7)),
    ch6AvailableModal: !!ch6Modal,
    ch7AvailableModal: !!ch7Modal,
    ch6AvailabilityStable: new Set(avail("ch6")).size <= 1,
    ch7AvailabilityStable: new Set(avail("ch7")).size <= 1,
    costUsd: executedRs.reduce((n, r) => n + r.costUsd, 0),
    meanCostUsd: mean(executedRs.map((r) => r.costUsd)),
    meanWarmCostUsd: warm.length ? mean(warm.map((r) => r.costUsd)) : null,
    inputTokens: executedRs.reduce(
      (n, r) =>
        n +
        (r.usage
          ? r.usage.inputTokens +
            r.usage.cacheReadInputTokens +
            r.usage.cacheCreationInputTokens
          : 0),
      0,
    ),
    outputTokens: executedRs.reduce(
      (n, r) => n + (r.usage?.outputTokens ?? 0),
      0,
    ),
    meanLatencyMs: mean(executedRs.map((r) => r.latencyMs)),
    maxLatencyMs: Math.max(0, ...executedRs.map((r) => r.latencyMs)),
    bySession: Object.fromEntries(
      sessions.map((s) => {
        const os = ok.filter((r) => r.session === s).map((r) => r.observation);
        return [
          s,
          {
            valid: os.length,
            agreement: mean(
              FEATURE_IDS.map(
                (f) => cellMetrics(first.photoId, f, os).agreement,
              ),
            ),
          },
        ];
      }),
    ),
    cells: FEATURE_IDS.map((f) =>
      cellMetrics(
        first.photoId,
        f,
        ok.map((r) => r.observation),
      ),
    ),
  };
}

// ── Intervalos ─────────────────────────────────────────────────────────────

/** Intervalo de Wilson (95%). Supõe observações independentes. */
export function wilson(k: number, n: number): [number, number] | null {
  if (n <= 0) return null;
  const z = 1.959964;
  const p = k / n;
  const d = 1 + (z * z) / n;
  const c = (p + (z * z) / (2 * n)) / d;
  const h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return [Math.max(0, c - h), Math.min(1, c + h)];
}

/** Gerador determinístico (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const seedOf = (s: string) =>
  [...s].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0, 7);

/**
 * Intervalo agrupado por foto: reamostra FOTOS (não análises), porque as
 * repetições de uma foto não são independentes. Com poucas fotos, o
 * intervalo não é informativo e vem marcado.
 */
export function clusterBootstrap(
  units: { k: number; n: number }[],
  draws: number = INTERVALS.bootstrap,
  seed: number = INTERVALS.seed,
): { ci: [number, number] | null; informative: boolean } {
  const used = units.filter((u) => u.n > 0);
  if (!used.length) return { ci: null, informative: false };
  const r = rng(seed);
  const stats: number[] = [];
  for (let b = 0; b < draws; b++) {
    let k = 0;
    let n = 0;
    for (let i = 0; i < used.length; i++) {
      const u = used[Math.floor(r() * used.length)];
      k += u.k;
      n += u.n;
    }
    stats.push(n ? k / n : 0);
  }
  stats.sort((a, b) => a - b);
  return {
    ci: [stats[Math.floor(0.025 * draws)], stats[Math.ceil(0.975 * draws) - 1]],
    informative: used.length >= INTERVALS.minPhotosForClusterCi,
  };
}

// ── Consenso simulado (M9) ─────────────────────────────────────────────────

export type ConsensusRule = "3de3" | "2de3";

function consensusReading(
  f: FeatureId,
  sample: ValidatedObservation[],
  rule: ConsensusRule,
): FeatureObs | null {
  const readings = sample.map((o) => readingOf(o, f));
  const m = modal(readings);
  const need =
    rule === "3de3" ? sample.length : Math.floor(sample.length / 2) + 1;
  if (m.count < need || m.value === NONE) return null;
  return sample.find((o) => readingOf(o, f) === m.value)!.features[f];
}

/** Observação de consenso: característica divergente vira não interpretada. */
export function consensusObservation(
  sample: ValidatedObservation[],
  rule: ConsensusRule,
): ValidatedObservation {
  const base = sample[0];
  const features = { ...base.features } as Record<FeatureId, FeatureObs>;
  for (const f of FEATURE_IDS)
    features[f] =
      consensusReading(f, sample, rule) ??
      ({ visibility: "not_visible", reason: "ambiguous" } as FeatureObs);
  return {
    ...base,
    status: modal(sample.map((o) => o.status)).value ?? base.status,
    features: features as ValidatedObservation["features"],
  };
}

export type ConsensusPhoto = {
  photoId: string;
  draws: number;
  /** Inversões entre dois consensos independentes (amostras disjuntas). */
  inversions: Record<FeatureId, { k: number; n: number }>;
  /** Fração dos sorteios em que o capítulo, disponível na leitura modal, some. */
  ch6Loss: number;
  ch7Loss: number;
};

export function simulateConsensus(
  photoId: string,
  observations: ValidatedObservation[],
  rule: ConsensusRule = "3de3",
  draws: number = CONSENSUS.draws,
): ConsensusPhoto | null {
  const size = CONSENSUS.size;
  if (observations.length < size) return null;
  const r = rng(CONSENSUS.seed ^ seedOf(photoId));
  const modalEffect = {
    ch6: modal(observations.map((o) => readingEffect(o).ch6)).value,
    ch7: modal(observations.map((o) => readingEffect(o).ch7)).value,
  };
  const inversions = Object.fromEntries(
    FEATURE_IDS.map((f) => [f, { k: 0, n: 0 }]),
  ) as ConsensusPhoto["inversions"];
  let ch6Lost = 0;
  let ch7Lost = 0;
  const disjoint = observations.length >= 2 * size;
  for (let d = 0; d < draws; d++) {
    const idx = observations.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    const a = consensusObservation(
      idx.slice(0, size).map((i) => observations[i]),
      rule,
    );
    const ea = readingEffect(a);
    if (modalEffect.ch6 && !ea.ch6) ch6Lost++;
    if (modalEffect.ch7 && !ea.ch7) ch7Lost++;
    if (!disjoint) continue;
    const b = consensusObservation(
      idx.slice(size, 2 * size).map((i) => observations[i]),
      rule,
    );
    for (const f of FEATURE_IDS) {
      const ra = readingOf(a, f);
      const rb = readingOf(b, f);
      if (ra === NONE || rb === NONE) continue;
      inversions[f].n++;
      if (ra !== rb) inversions[f].k++;
    }
  }
  return {
    photoId,
    draws,
    inversions,
    ch6Loss: ch6Lost / draws,
    ch7Loss: ch7Lost / draws,
  };
}

/** Leitura modal da foto (característica a característica). */
export function modalObservation(
  observations: ValidatedObservation[],
): ValidatedObservation | null {
  if (!observations.length) return null;
  const features = {} as Record<FeatureId, FeatureObs>;
  for (const f of FEATURE_IDS) {
    const m = modal(observations.map((o) => readingOf(o, f))).value;
    features[f] = observations.find((o) => readingOf(o, f) === m)!.features[f];
  }
  return {
    ...observations[0],
    status:
      modal(observations.map((o) => o.status)).value ?? observations[0].status,
    features: features as ValidatedObservation["features"],
  };
}

/** Leitura sem as características retiradas (simulação de restrição). */
export function withoutFeatures(
  o: ValidatedObservation,
  removed: FeatureId[],
): ValidatedObservation {
  const features = { ...o.features } as Record<FeatureId, FeatureObs>;
  for (const f of removed)
    features[f] = {
      visibility: "not_visible",
      reason: "ambiguous",
    } as FeatureObs;
  return { ...o, features: features as ValidatedObservation["features"] };
}

export const okObservations = (rs: AnalysisRecord[]) =>
  valid(rs).map((r) => r.observation);
