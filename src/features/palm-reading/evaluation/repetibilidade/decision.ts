/**
 * Vereditos e decisões PRÉ-REGISTRADOS (seções 3 e 6 do plano).
 *
 * As regras vêm de `config.ts` e não dependem dos dados. Cada grupo
 * (originais reenviados × fotos novas) é analisado separadamente; o
 * veredito final de uma característica é o pior entre os grupos avaliáveis.
 */
import {
  FEATURE_GROUP,
  FEATURE_IDS,
  type FeatureId,
} from "../../analysis/contract";
import { FEATURE_LABELS } from "./labels";
import { COMMERCIAL, DECISION, PILOT_GATE, PRODUCT, VERDICT } from "./config";
import type { AnalysisRecord, PhotoOrigin } from "./contract";
import {
  clusterBootstrap,
  modalObservation,
  okObservations,
  photoMetrics,
  readingEffect,
  simulateConsensus,
  wilson,
  withoutFeatures,
  type CellMetrics,
  type ConsensusPhoto,
  type PhotoMetrics,
} from "./metrics";

export type Verdict = "estavel" | "intermediaria" | "instavel" | "inconclusiva";

export type FeatureSummary = {
  feature: FeatureId;
  /** Diversidade: fotos e pessoas com alguma classificação. */
  photosWithData: number;
  participantsWithData: number;
  evaluableCells: number;
  evaluable: boolean;
  classifiedPairs: number;
  inversions: number;
  inversionRate: number | null;
  /** Wilson nominal: trata pares como independentes (otimista). */
  inversionWilson: [number, number] | null;
  /** Bootstrap por foto: respeita o agrupamento por imagem. */
  inversionCluster: [number, number] | null;
  clusterInformative: boolean;
  oppositePhotos: number;
  maxCellInversion: number;
  agreementCellShare: number;
  meanAgreement: number;
  indeterminateShare: number;
  oscillationRate: number;
  reasonOnlyRate: number;
  clearInversionRate: number | null;
  partialInversionRate: number | null;
  consensusInversionRate: number | null;
  verdict: Verdict;
};

export type GroupSummary = {
  origin: PhotoOrigin;
  photos: PhotoMetrics[];
  participants: number;
  features: FeatureSummary[];
  consensus: ConsensusPhoto[];
  product: {
    ch6Stable: boolean | null;
    ch7Stable: boolean | null;
    retakeStable: boolean;
    statusStable: boolean;
  };
  clearInversionRate: number | null;
  partialInversionRate: number | null;
};

const rate = (k: number, n: number) => (n ? k / n : null);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function verdictOf(
  cells: CellMetrics[],
): Pick<
  FeatureSummary,
  | "evaluable"
  | "evaluableCells"
  | "inversionRate"
  | "oppositePhotos"
  | "maxCellInversion"
  | "agreementCellShare"
  | "verdict"
> {
  const evaluableCells = cells.filter(
    (c) => c.classified >= VERDICT.minClassifiedPerCell,
  );
  const evaluable = evaluableCells.length >= VERDICT.minPhotos;
  const inversionRate = rate(
    sum(cells.map((c) => c.inversions)),
    sum(cells.map((c) => c.classifiedPairs)),
  );
  const oppositePhotos = cells.filter((c) => c.opposite > 0).length;
  const maxCellInversion = Math.max(
    0,
    ...evaluableCells.map((c) => rate(c.inversions, c.classifiedPairs) ?? 0),
  );
  const agreementCellShare = evaluableCells.length
    ? evaluableCells.filter(
        (c) => c.agreement >= VERDICT.stableMinCellAgreement,
      ).length / evaluableCells.length
    : 0;
  let verdict: Verdict;
  if (!evaluable) verdict = "inconclusiva";
  else if (
    (inversionRate ?? 0) > VERDICT.unstableMaxInversion ||
    maxCellInversion >= VERDICT.unstableCellInversion ||
    oppositePhotos > VERDICT.unstableOppositePhotos
  )
    verdict = "instavel";
  else if (
    (inversionRate ?? 0) <= VERDICT.stableMaxInversion &&
    oppositePhotos === 0 &&
    agreementCellShare >= VERDICT.stableCellShare
  )
    verdict = "estavel";
  else verdict = "intermediaria";
  return {
    evaluable,
    evaluableCells: evaluableCells.length,
    inversionRate,
    oppositePhotos,
    maxCellInversion,
    agreementCellShare,
    verdict,
  };
}

export function summarizeGroup(
  origin: PhotoOrigin,
  records: AnalysisRecord[],
): GroupSummary {
  const ids = [...new Set(records.map((r) => r.photoId))];
  const photos = ids.map((id) =>
    photoMetrics(records.filter((r) => r.photoId === id)),
  );
  const consensus = ids
    .map((id) =>
      simulateConsensus(
        id,
        okObservations(records.filter((r) => r.photoId === id)),
      ),
    )
    .filter((c): c is ConsensusPhoto => c !== null);
  const participantOf = new Map(photos.map((p) => [p.photoId, p.participant]));
  const features = FEATURE_IDS.map((f): FeatureSummary => {
    const cells = photos.map((p) => p.cells.find((c) => c.feature === f)!);
    const withData = cells.filter((c) => c.classified > 0);
    const v = verdictOf(cells);
    const pairs = sum(cells.map((c) => c.classifiedPairs));
    const inv = sum(cells.map((c) => c.inversions));
    const boot = clusterBootstrap(
      cells.map((c) => ({ k: c.inversions, n: c.classifiedPairs })),
    );
    const allPairs = sum(cells.map((c) => c.pairs));
    const cons = consensus.map((c) => c.inversions[f]);
    return {
      feature: f,
      photosWithData: withData.length,
      participantsWithData: new Set(
        withData.map((c) => participantOf.get(c.photoId)),
      ).size,
      classifiedPairs: pairs,
      inversions: inv,
      inversionWilson: wilson(inv, pairs),
      inversionCluster: boot.ci,
      clusterInformative: boot.informative,
      meanAgreement: cells.length
        ? sum(cells.map((c) => c.agreement)) / cells.length
        : 0,
      indeterminateShare: cells.length
        ? sum(cells.map((c) => c.indeterminateShare)) / cells.length
        : 0,
      oscillationRate:
        rate(sum(cells.map((c) => c.oscillations)), allPairs) ?? 0,
      reasonOnlyRate: rate(sum(cells.map((c) => c.reasonOnly)), allPairs) ?? 0,
      clearInversionRate: rate(
        sum(cells.map((c) => c.clearInversions)),
        sum(cells.map((c) => c.clearPairs)),
      ),
      partialInversionRate: rate(
        sum(cells.map((c) => c.partialInversions)),
        sum(cells.map((c) => c.partialPairs)),
      ),
      consensusInversionRate: rate(
        sum(cons.map((c) => c.k)),
        sum(cons.map((c) => c.n)),
      ),
      ...v,
    };
  });
  const allCells = photos.flatMap((p) => p.cells);
  const chapterStable = (k: "ch6" | "ch7") => {
    const avail = photos.filter((p) =>
      k === "ch6" ? p.ch6AvailableModal : p.ch7AvailableModal,
    );
    if (!avail.length) return null;
    const ok = avail.filter(
      (p) =>
        (k === "ch6" ? p.ch6Agreement : p.ch7Agreement) >=
        PRODUCT.chapterAgreement,
    ).length;
    return ok / avail.length >= PRODUCT.photoShare;
  };
  const withValid = photos.filter((p) => p.valid > 0);
  return {
    origin,
    photos,
    participants: new Set(photos.map((p) => p.participant)).size,
    features,
    consensus,
    product: {
      ch6Stable: chapterStable("ch6"),
      ch7Stable: chapterStable("ch7"),
      retakeStable:
        withValid.length > 0 &&
        withValid.filter((p) => p.retakeStable).length / withValid.length >=
          PRODUCT.retakeShare,
      statusStable:
        withValid.length > 0 &&
        withValid.filter((p) => p.statusStable).length / withValid.length >=
          PRODUCT.retakeShare,
    },
    clearInversionRate: rate(
      sum(allCells.map((c) => c.clearInversions)),
      sum(allCells.map((c) => c.clearPairs)),
    ),
    partialInversionRate: rate(
      sum(allCells.map((c) => c.partialInversions)),
      sum(allCells.map((c) => c.partialPairs)),
    ),
  };
}

const ORDER: Verdict[] = [
  "inconclusiva",
  "estavel",
  "intermediaria",
  "instavel",
];

/** Veredito final: o pior entre os grupos avaliáveis. */
export function overallVerdict(groups: GroupSummary[], f: FeatureId): Verdict {
  const vs = groups
    .map((g) => g.features.find((x) => x.feature === f)!.verdict)
    .filter((v) => v !== "inconclusiva");
  if (!vs.length) return "inconclusiva";
  return vs.reduce((a, b) => (ORDER.indexOf(b) > ORDER.indexOf(a) ? b : a));
}

export type DecisionKey =
  "manter" | "restringir" | "captura" | "consenso" | "escopo" | "inconclusivo";

export type ChapterCommercial = {
  chapter: 6 | 7;
  approved: boolean;
  /** Características liberadas (estáveis) deste capítulo. */
  approvedFeatures: FeatureId[];
  excludedFeatures: FeatureId[];
  /** Fotos em que o capítulo continua disponível sem as excluídas. */
  availabilityKept: number | null;
  /** Fotos com o capítulo estável (itens liberados) ≥ 90% das análises. */
  stableShare: number | null;
  reasons: string[];
};

export type Commercial = {
  approvedFeatures: FeatureId[];
  /** Fora do uso comercial: inconclusivas, intermediárias e instáveis. */
  excludedFeatures: { feature: FeatureId; verdict: Verdict }[];
  chapters: [ChapterCommercial, ChapterCommercial];
  /** "aprovada" só sem nenhuma exclusão; nunca por haver algumas estáveis. */
  fullReading: "aprovada" | "aprovada com exclusões" | "não aprovada";
};

export type Decision = {
  primary: DecisionKey;
  /** Todas as regras atendidas, com a justificativa citando o critério. */
  triggered: { key: DecisionKey; why: string }[];
  verdicts: Record<FeatureId, Verdict>;
  commercial: Commercial;
};

const chapterOf = (f: FeatureId): 6 | 7 =>
  FEATURE_GROUP[f] === "hand" ? 6 : 7;

/** Capítulo depois das exclusões: disponibilidade e estabilidade. */
export function chapterAfterExclusion(
  records: AnalysisRecord[],
  chapter: 6 | 7,
  excluded: FeatureId[],
): { availabilityKept: number | null; stableShare: number | null } {
  const key = chapter === 6 ? "ch6" : "ch7";
  let before = 0;
  let kept = 0;
  let stable = 0;
  for (const id of new Set(records.map((r) => r.photoId))) {
    const os = okObservations(records.filter((r) => r.photoId === id));
    const m = modalObservation(os);
    if (!m || !readingEffect(m)[key]) continue;
    before++;
    const restricted = os.map(
      (o) => readingEffect(withoutFeatures(o, excluded))[key],
    );
    const modalItems = readingEffect(withoutFeatures(m, excluded))[key];
    if (modalItems) kept++;
    const same = restricted.filter((x) => x === modalItems).length;
    if (os.length && same / os.length >= COMMERCIAL.chapterAgreement) stable++;
  }
  return {
    availabilityKept: before ? kept / before : null,
    stableShare: before ? stable / before : null,
  };
}

export function commercialEvaluation(
  verdicts: Record<FeatureId, Verdict>,
  groups: GroupSummary[],
  records: AnalysisRecord[],
): Commercial {
  const approvedFeatures = FEATURE_IDS.filter((f) => verdicts[f] === "estavel");
  const excluded = FEATURE_IDS.filter((f) => verdicts[f] !== "estavel");
  const productOk = groups.every(
    (g) => g.product.retakeStable && g.product.statusStable,
  );
  const chapters = ([6, 7] as const).map((chapter): ChapterCommercial => {
    const own = FEATURE_IDS.filter((f) => chapterOf(f) === chapter);
    const ok = own.filter((f) => approvedFeatures.includes(f));
    const after = chapterAfterExclusion(records, chapter, excluded);
    const reasons: string[] = [];
    if (ok.length < COMMERCIAL.minApprovedFeaturesPerChapter)
      reasons.push(
        `só ${ok.length} característica(s) liberada(s); mínimo ${COMMERCIAL.minApprovedFeaturesPerChapter}`,
      );
    if (
      after.availabilityKept === null ||
      after.availabilityKept < COMMERCIAL.minChapterAvailability
    )
      reasons.push(
        `disponível sem as excluídas em ${pct(after.availabilityKept)} das fotos; mínimo 75%`,
      );
    if (after.stableShare === null || after.stableShare < COMMERCIAL.photoShare)
      reasons.push(
        `estável sem as excluídas em ${pct(after.stableShare)} das fotos; mínimo 85%`,
      );
    if (!productOk)
      reasons.push("estado da leitura ou pedido de nova foto instável");
    return {
      chapter,
      approved: reasons.length === 0,
      approvedFeatures: ok,
      excludedFeatures: own.filter((f) => !ok.includes(f)),
      ...after,
      reasons,
    };
  }) as [ChapterCommercial, ChapterCommercial];
  const both = chapters.every((c) => c.approved);
  return {
    approvedFeatures,
    excludedFeatures: excluded.map((feature) => ({
      feature,
      verdict: verdicts[feature],
    })),
    chapters,
    fullReading:
      both && !excluded.length
        ? "aprovada"
        : both
          ? "aprovada com exclusões"
          : "não aprovada",
  };
}

/** Disponibilidade dos capítulos mantida ao retirar características. */
export function availabilityKept(
  records: AnalysisRecord[],
  removed: FeatureId[],
): number | null {
  let before = 0;
  let kept = 0;
  for (const id of new Set(records.map((r) => r.photoId))) {
    const o = modalObservation(
      okObservations(records.filter((r) => r.photoId === id)),
    );
    if (!o) continue;
    const a = readingEffect(o);
    const b = readingEffect(withoutFeatures(o, removed));
    for (const k of ["ch6", "ch7"] as const)
      if (a[k]) {
        before++;
        if (b[k]) kept++;
      }
  }
  return before ? kept / before : null;
}

export function decide(
  groups: GroupSummary[],
  records: AnalysisRecord[],
): Decision {
  const verdicts = Object.fromEntries(
    FEATURE_IDS.map((f) => [f, overallVerdict(groups, f)]),
  ) as Record<FeatureId, Verdict>;
  const triggered: Decision["triggered"] = [];
  const unstable = FEATURE_IDS.filter((f) => verdicts[f] === "instavel");
  const inconclusive = FEATURE_IDS.filter(
    (f) => verdicts[f] === "inconclusiva",
  );
  const features = groups.flatMap((g) => g.features);
  const photos = groups.flatMap((g) => g.photos);
  const consensus = groups.flatMap((g) => g.consensus);

  // Escopo.
  const consInv = FEATURE_IDS.filter((f) =>
    features.some(
      (x) =>
        x.feature === f &&
        (x.consensusInversionRate ?? 0) > DECISION.scopeConsensusInversion,
    ),
  );
  const ch7Avail = photos
    .filter((p) => p.ch7AvailableModal)
    .map((p) => p.photoId);
  const ch7Lost = consensus.filter(
    (c) => ch7Avail.includes(c.photoId) && c.ch7Loss > 0.5,
  ).length;
  const clearInv = groups.map((g) => g.clearInversionRate ?? 0);
  if (consInv.length >= DECISION.scopeMinFeatures)
    triggered.push({
      key: "escopo",
      why: `inversão > 5% mesmo com consenso em ${names(consInv)}`,
    });
  else if (
    ch7Avail.length &&
    ch7Lost / ch7Avail.length > DECISION.scopeChapter7LossShare
  )
    triggered.push({
      key: "escopo",
      why: `capítulo 7 perdido no consenso em ${ch7Lost} de ${ch7Avail.length} fotos`,
    });
  else if (clearInv.some((x) => x > DECISION.scopeClearInversion))
    triggered.push({
      key: "escopo",
      why: "inversão > 10% em observações declaradas claras",
    });

  // Consenso.
  const spread = features.filter(
    (x) =>
      (x.verdict === "instavel" || x.verdict === "intermediaria") &&
      (x.clearInversionRate ?? 0) > DECISION.consensusClearMinInversion,
  );
  const spreadFeatures = [...new Set(spread.map((x) => x.feature))];
  const consOk = FEATURE_IDS.every((f) =>
    features
      .filter((x) => x.feature === f)
      .every(
        (x) =>
          (x.consensusInversionRate ?? 0) <= DECISION.consensusMaxInversion,
      ),
  );
  const chapterLossPhotos = consensus.filter((c) => {
    const p = photos.find((x) => x.photoId === c.photoId)!;
    return (
      (p.ch6AvailableModal && c.ch6Loss > 0.5) ||
      (p.ch7AvailableModal && c.ch7Loss > 0.5)
    );
  }).length;
  if (
    spreadFeatures.length >= DECISION.consensusMinFeatures &&
    consOk &&
    chapterLossPhotos <= DECISION.consensusMaxChapterLossPhotos
  )
    triggered.push({
      key: "consenso",
      why: `${spreadFeatures.length} características instáveis também em observações claras; consenso com inversão ≤ 2% e perda de capítulo em ${chapterLossPhotos} foto(s)`,
    });

  // Restrição.
  if (unstable.length >= 1 && unstable.length <= DECISION.restrictMaxFeatures) {
    // Opção 2: inconclusivas já ficam fora do uso comercial e não impedem a
    // restrição; intermediárias impedem (não são estáveis nem instáveis).
    const others = FEATURE_IDS.filter((f) => !unstable.includes(f));
    const kept = availabilityKept(records, [...unstable, ...inconclusive]);
    if (
      others.every(
        (f) => verdicts[f] === "estavel" || verdicts[f] === "inconclusiva",
      ) &&
      kept !== null &&
      kept >= DECISION.restrictMinAvailability
    )
      triggered.push({
        key: "restringir",
        why: `instáveis: ${names(unstable)}; capítulos mantidos em ${(kept * 100).toFixed(0)}% dos casos`,
      });
  }

  // Captura.
  for (const g of groups)
    if (
      (g.clearInversionRate ?? 0) <= DECISION.captureClearMaxInversion &&
      (g.partialInversionRate ?? 0) > DECISION.capturePartialMinInversion
    )
      triggered.push({
        key: "captura",
        why: `grupo ${g.origin}: inversão ${pct(g.clearInversionRate)} nas claras e ${pct(g.partialInversionRate)} nas parciais`,
      });

  // Manter (opção 2): nenhuma característica avaliável instável ou
  // intermediária, ao menos um capítulo aprovado depois das exclusões. As
  // inconclusivas ficam fora do uso comercial e são listadas.
  const commercial = commercialEvaluation(verdicts, groups, records);
  const evaluable = FEATURE_IDS.filter((f) => verdicts[f] !== "inconclusiva");
  const approvedChapters = commercial.chapters.filter((c) => c.approved);
  if (
    evaluable.length > 0 &&
    evaluable.every((f) => verdicts[f] === "estavel") &&
    approvedChapters.length > 0
  )
    triggered.push({
      key: "manter",
      why: `características avaliáveis estáveis; capítulo(s) ${approvedChapters
        .map((c) => c.chapter)
        .join(" e ")} aprovado(s) depois das exclusões${
        inconclusive.length
          ? `; fora do uso comercial por falta de dado: ${names(inconclusive)}`
          : ""
      }`,
    });

  const priority: DecisionKey[] = [
    "escopo",
    "consenso",
    "restringir",
    "captura",
    "manter",
  ];
  const primary =
    priority.find((k) => triggered.some((t) => t.key === k)) ?? "inconclusivo";
  if (primary === "inconclusivo")
    triggered.push({
      key: "inconclusivo",
      why:
        evaluable.length && !approvedChapters.length
          ? "nenhum capítulo continua disponível, estável e útil depois das exclusões"
          : inconclusive.length
            ? `sem dados suficientes: ${names(inconclusive)}`
            : "nenhuma regra atendida",
    });
  return { primary, triggered, verdicts, commercial };
}

const pct = (x: number | null) =>
  x === null ? "—" : `${(x * 100).toFixed(1).replace(".", ",")}%`;
const names = (fs: FeatureId[]) =>
  fs.map((f) => FEATURE_LABELS[f].toLowerCase()).join(", ");

// ── Piloto: critérios operacionais (seção 3.1) ─────────────────────────────

export type PilotGate = {
  passed: boolean;
  checks: { name: string; ok: boolean; detail: string }[];
};

export function evaluatePilotGate(
  records: AnalysisRecord[],
  privacy: { imageContentFound: boolean; deletionRecorded: boolean },
): PilotGate {
  const executed = records.filter((r) => r.outcome !== "not_run");
  const bad = executed.filter((r) => r.outcome !== "ok").length;
  const warm = executed.filter(
    (r) => r.usage && r.usage.cacheCreationInputTokens === 0,
  );
  const warmMean = warm.length
    ? warm.reduce((n, r) => n + r.costUsd, 0) / warm.length
    : null;
  const complete = executed.every(
    (r) =>
      /^[0-9a-f]{64}$/.test(r.inputSha256) &&
      (r.outcome === "provider_error" || r.usage !== null) &&
      (r.outcome !== "ok" || r.observation !== null),
  );
  const maxLatency = Math.max(0, ...executed.map((r) => r.latencyMs));
  const checks = [
    {
      name: "registros completos",
      ok: executed.length > 0 && complete,
      detail: `${executed.length} análises`,
    },
    {
      name: "inválidas ou erros ≤ 1 em 10",
      ok:
        executed.length > 0 &&
        bad / executed.length <= PILOT_GATE.maxInvalidOrErrorShare,
      detail: `${bad} de ${executed.length}`,
    },
    {
      name: "custo médio com cache lido ≤ US$ 0,02",
      ok: warmMean !== null && warmMean <= PILOT_GATE.maxMeanWarmCostUsd,
      detail:
        warmMean === null
          ? "sem análise com cache lido"
          : `US$ ${warmMean.toFixed(4)}`,
    },
    {
      name: "nenhuma análise acima de 55 s",
      ok: maxLatency <= PILOT_GATE.maxLatencyMs,
      detail: `${(maxLatency / 1000).toFixed(1)} s`,
    },
    {
      name: "nenhuma imagem nos registros",
      ok: !privacy.imageContentFound,
      detail: privacy.imageContentFound
        ? "conteúdo de imagem encontrado"
        : "ok",
    },
    {
      name: "exclusão feita e registrada",
      ok: privacy.deletionRecorded,
      detail: privacy.deletionRecorded ? "ok" : "pendente",
    },
  ];
  return { passed: checks.every((c) => c.ok), checks };
}
