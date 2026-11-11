/**
 * Contratos da geração com IA (Fase 02F).
 *
 * Fluxo: InterpretationReport (02E) → requisição por capítulo → provedor →
 * ChapterDraft (JSON estruturado) → validação → GeneratedChapter.
 * Um capítulo que não passa na validação é substituído pela versão
 * determinística da biblioteca e marcado com source: "library".
 */
import type { ChapterId, InterpretationReport } from "../contract";

/** O que o modelo devolve para UM capítulo (validado antes de qualquer uso). */
export type ChapterDraft = {
  introduction: string;
  sections: { text: string; itemIds: string[] }[];
  synthesis: string;
  reflectionQuestions: string[];
};

export type GeneratedSection = {
  text: string;
  /** Itens selecionados pelo motor (02E) que sustentam o texto. */
  itemIds: string[];
  /** Fatos calculados por trás desses itens (rastreabilidade até o ChartView). */
  factIds: string[];
};

export type GeneratedChapter = {
  id: ChapterId;
  number: number;
  /** Título fixo do capítulo (não vem do modelo). */
  title: string;
  introduction: string;
  sections: GeneratedSection[];
  synthesis: string;
  reflectionQuestions: string[];
  /** Limitações calculadas pelo motor, copiadas literalmente. */
  limitations: string[];
  /** "ai": texto do modelo, validado; "library": texto determinístico. */
  source: "ai" | "library";
  /** Por que a biblioteca foi usada (null quando source = "ai"). */
  fallbackReason: string | null;
};

export type GeneratedReport = {
  version: string;
  disclaimer: string;
  basis: InterpretationReport["basis"];
  chapters: GeneratedChapter[];
  metrics: GenerationMetrics;
};

// ── Provedor ─────────────────────────────────────────────────────────────

export type AiRequest = {
  /** Instruções estáveis (iguais em todas as chamadas, cacheáveis). */
  system: string;
  /** Dados do capítulo (JSON), sem dados pessoais. */
  user: string;
  /** JSON Schema da saída esperada. */
  schema: Record<string, unknown>;
  maxOutputTokens: number;
  timeoutMs: number;
};

export type AiUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
};

export type AiResponse = {
  /** Modelo que efetivamente respondeu (pode diferir em caso de fallback). */
  model: string;
  /** Texto JSON devolvido pelo modelo. */
  text: string;
  stopReason: "end" | "max_tokens" | "refusal" | "other";
  usage: AiUsage;
};

export type AiErrorKind =
  | "timeout"
  | "rate_limit"
  | "unavailable"
  | "auth"
  | "bad_request"
  | "network"
  | "budget"
  | "unknown";

export class AiProviderError extends Error {
  constructor(
    readonly kind: AiErrorKind,
    message: string,
    /**
     * Custo (USD) atribuído a uma chamada que falhou sem informar consumo.
     * O controle de orçamento assume o pior caso quando não dá para saber
     * se houve cobrança (timeout, rede).
     */
    readonly chargedUsd: number | null = null,
  ) {
    super(message);
    this.name = "AiProviderError";
  }

  /** Erros transitórios valem uma nova tentativa; os demais, não. */
  get retryable() {
    return ["timeout", "rate_limit", "unavailable", "network"].includes(
      this.kind,
    );
  }
}

export interface AiProvider {
  readonly id: string;
  readonly model: string;
  generate(request: AiRequest): Promise<AiResponse>;
}

// ── Instrumentação ───────────────────────────────────────────────────────

export type AttemptMetrics = {
  chapter: ChapterId;
  attempt: number;
  /** Modelo pedido na requisição. */
  requestedModel: string;
  /** Modelo que efetivamente respondeu (response.model). */
  model: string;
  latencyMs: number;
  usage: AiUsage | null;
  /** Custo estimado com a tabela de preços oficial (USD). */
  costUsd: number | null;
  outcome:
    | "ok"
    | "invalid_json"
    | "validation_failed"
    | "truncated"
    | "refusal"
    | `error:${AiErrorKind}`;
  errors: string[];
};

export type GenerationMetrics = {
  provider: string;
  model: string;
  attempts: AttemptMetrics[];
  totals: {
    calls: number;
    retries: number;
    failures: number;
    inputTokens: number;
    outputTokens: number;
    cacheReadInputTokens: number;
    cacheCreationInputTokens: number;
    costUsd: number;
    /** Tentativas sem preço conhecido (custo não somado — revisar). */
    unpricedCalls: number;
    /** Tentativas respondidas por um modelo diferente do pedido. */
    modelMismatches: number;
    /** Tempo total de parede (capítulos rodam em paralelo). */
    wallTimeMs: number;
    chaptersFromAi: number;
    chaptersFromLibrary: number;
  };
};
