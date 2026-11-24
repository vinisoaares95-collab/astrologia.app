/**
 * Experimento de repetibilidade visual: parâmetros PRÉ-REGISTRADOS.
 *
 * Fonte: `docs/experimento-repetibilidade-visual.md` (seções 2, 3, 4 e 6).
 * Qualquer mudança aqui depois do início da coleta é um desvio de protocolo
 * e precisa ser registrada no documento ANTES de ver novos resultados.
 *
 * A ferramenta não chama nenhum provedor real por conta própria: o provedor
 * é sempre injetado. Nesta etapa, só provedores simulados são usados.
 */

/** Modelo avaliado: o do produto, sem alteração. */
export const REP_MODEL = "claude-sonnet-5-5";

/** 1 tentativa por análise: mede a resposta crua (inválida é registrada). */
export const REP_ATTEMPTS = 1;

/** Análises por foto. A meta é CUMULATIVA (inclui as do piloto). */
export const REP_TARGET_PER_PHOTO = 10;
export const REP_PILOT_PER_PHOTO = 5;
/** Teto de envios por foto ao provedor, coberto pelo termo (10 + margem). */
export const REP_MAX_SENDS_PER_PHOTO = 12;

export type RepStage = "piloto" | "A" | "B";

/** Limites por etapa: chamadas e teto de gasto (USD), conforme o plano. */
export const REP_STAGES: Record<
  RepStage,
  { maxCalls: number; budgetUsd: number; origin: "original" | "nova" }
> = {
  piloto: { maxCalls: 10, budgetUsd: 0.7, origin: "original" },
  A: { maxCalls: 70, budgetUsd: 2.0, origin: "original" },
  B: { maxCalls: 80, budgetUsd: 2.5, origin: "nova" },
};
export const REP_TOTAL_BUDGET_USD = 5.2;

/** Piloto: só critérios operacionais (seção 3.1). */
export const PILOT_GATE = {
  /** No máximo 1 em 10 análises inválida ou com erro do provedor. */
  maxInvalidOrErrorShare: 0.1,
  /** Custo médio por análise com cache lido. */
  maxMeanWarmCostUsd: 0.02,
  maxLatencyMs: 55_000,
} as const;

/** Veredito por característica (seção 3.2). */
export const VERDICT = {
  /** Avaliável: ≥ 3 fotos com ≥ 5 análises classificadas cada. */
  minPhotos: 3,
  minClassifiedPerCell: 5,
  stableMaxInversion: 0.05,
  stableMinCellAgreement: 0.9,
  /** Fração mínima de células avaliáveis com concordância ≥ 90%. */
  stableCellShare: 0.85,
  unstableMaxInversion: 0.15,
  unstableCellInversion: 0.3,
  /** Instável se houver inversão OPOSTA em mais de 1 foto. */
  unstableOppositePhotos: 1,
} as const;

/** Estabilidade do produto (seção 3.2). */
export const PRODUCT = {
  chapterAgreement: 0.9,
  photoShare: 0.85,
  retakeShare: 0.85,
} as const;

/** Regras de decisão (seção 6). */
export const DECISION = {
  restrictMaxFeatures: 3,
  restrictMinAvailability: 0.75,
  captureClearMaxInversion: 0.05,
  capturePartialMinInversion: 0.15,
  consensusMinFeatures: 2,
  consensusClearMinInversion: 0.05,
  consensusMaxInversion: 0.02,
  consensusMaxChapterLossPhotos: 1,
  scopeConsensusInversion: 0.05,
  scopeMinFeatures: 2,
  scopeChapter7LossShare: 0.5,
  scopeClearInversion: 0.1,
} as const;

/**
 * Uso comercial depois das exclusões (opção 2, decidida em 24/11/2026):
 * - só características ESTÁVEIS ficam liberadas; inconclusiva (falta de
 *   dado), intermediária e instável ficam fora do uso comercial;
 * - um capítulo só é aprovado se, sem as excluídas, continuar disponível na
 *   maior parte das fotos em que estava, continuar estável e tiver pelo menos
 *   2 características liberadas (utilidade mínima);
 * - a leitura completa só é "aprovada" sem nenhuma exclusão.
 */
export const COMMERCIAL = {
  minApprovedFeaturesPerChapter: 2,
  minChapterAvailability: 0.75,
  chapterAgreement: 0.9,
  photoShare: 0.85,
} as const;

/** Consenso simulado (M9), offline e determinístico. */
export const CONSENSUS = { size: 3, draws: 1000, seed: 20261124 } as const;

/** Intervalos: bootstrap por foto (agrupamento) e mínimo de fotos. */
export const INTERVALS = {
  bootstrap: 2000,
  seed: 4242,
  /** Abaixo disso, o intervalo agrupado é marcado como não informativo. */
  minPhotosForClusterCi: 5,
} as const;
