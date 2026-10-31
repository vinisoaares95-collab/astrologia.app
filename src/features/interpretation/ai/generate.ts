/**
 * Orquestração da geração com IA (Fase 02F).
 *
 * Para cada capítulo, em paralelo: requisição → provedor → JSON → validação.
 * Tentativas limitadas (MAX_ATTEMPTS). Se nenhuma tentativa produzir um
 * texto válido, o capítulo usa a versão determinística da biblioteca,
 * identificada como source: "library". Nunca devolve texto inválido.
 */
import type { ChapterId, InterpretationReport } from "../contract";
import {
  AiProviderError,
  type AiProvider,
  type AttemptMetrics,
  type GeneratedChapter,
  type GeneratedReport,
  type GenerationMetrics,
} from "./contract";
import { libraryDraft, toGeneratedChapter } from "./library-chapter";
import { estimateCostUsd } from "./pricing";
import { buildChapterRequest, PROMPT_VERSION } from "./prompt";
import { repetitionIssues, validateChapterDraft } from "./validate";

export const MAX_ATTEMPTS = 2;

export type GenerateOptions = {
  maxAttempts?: number;
  /** Teto de tokens de saída por capítulo (inclui raciocínio do modelo). */
  maxOutputTokens?: number;
  timeoutMs?: number;
  /** Relógio injetável (testes). */
  now?: () => number;
};

async function generateChapter(
  report: InterpretationReport,
  id: ChapterId,
  provider: AiProvider,
  opts: Required<GenerateOptions>,
  metrics: AttemptMetrics[],
): Promise<GeneratedChapter> {
  const chapter = report.chapters.find((c) => c.id === id)!;
  if (chapter.items.length === 0)
    return toGeneratedChapter(
      report,
      id,
      libraryDraft(report, id),
      "library",
      "Capítulo sem itens selecionados.",
    );

  const request = buildChapterRequest(report, id, {
    maxOutputTokens: opts.maxOutputTokens,
    timeoutMs: opts.timeoutMs,
  });
  let lastReason = "";
  // Após uma reprovação, a nova tentativa recebe os problemas encontrados.
  let feedback = "";

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    const started = opts.now();
    const record = (
      m: Omit<AttemptMetrics, "chapter" | "attempt" | "latencyMs">,
    ) =>
      metrics.push({
        chapter: id,
        attempt,
        latencyMs: Math.round(opts.now() - started),
        ...m,
      });

    let response;
    try {
      response = await provider.generate(
        feedback
          ? { ...request, user: `${request.user}\n\n${feedback}` }
          : request,
      );
    } catch (error) {
      const err =
        error instanceof AiProviderError
          ? error
          : new AiProviderError("unknown", String(error));
      record({
        model: provider.model,
        usage: null,
        costUsd: null,
        outcome: `error:${err.kind}`,
        errors: [err.message],
      });
      lastReason = `Falha do provedor (${err.kind}).`;
      if (!err.retryable) break;
      continue;
    }

    const base = {
      model: response.model,
      usage: response.usage,
      costUsd: estimateCostUsd(response.model, response.usage),
    };
    if (response.stopReason === "refusal") {
      record({ ...base, outcome: "refusal", errors: [] });
      lastReason = "O modelo recusou a solicitação.";
      continue;
    }
    if (response.stopReason === "max_tokens") {
      record({ ...base, outcome: "truncated", errors: [] });
      lastReason = "Resposta incompleta (limite de tokens).";
      continue;
    }

    let draft: unknown;
    try {
      draft = JSON.parse(response.text);
    } catch {
      record({ ...base, outcome: "invalid_json", errors: [] });
      lastReason = "Resposta fora do formato JSON.";
      continue;
    }

    const result = validateChapterDraft(draft, chapter, report);
    if (!result.ok) {
      record({
        ...base,
        outcome: "validation_failed",
        errors: result.errors.map((e) => `${e.code}: ${e.message}`),
      });
      lastReason = `Reprovado na validação (${[...new Set(result.errors.map((e) => e.code))].join(", ")}).`;
      feedback = `A versão anterior foi reprovada pela revisão automática. Corrija estes pontos:\n${result.errors
        .slice(0, 8)
        .map((e) => `- ${e.part ?? "capítulo"}: ${e.message}`)
        .join("\n")}`;
      continue;
    }

    record({ ...base, outcome: "ok", errors: [] });
    return toGeneratedChapter(
      report,
      id,
      draft as Parameters<typeof toGeneratedChapter>[2],
      "ai",
      null,
    );
  }

  return toGeneratedChapter(
    report,
    id,
    libraryDraft(report, id),
    "library",
    lastReason || "Geração não concluída.",
  );
}

export async function generateReport(
  report: InterpretationReport,
  provider: AiProvider,
  options: GenerateOptions = {},
): Promise<GeneratedReport> {
  const opts: Required<GenerateOptions> = {
    maxAttempts: Math.max(1, Math.min(options.maxAttempts ?? MAX_ATTEMPTS, 3)),
    maxOutputTokens: options.maxOutputTokens ?? 4000,
    timeoutMs: options.timeoutMs ?? 60_000,
    now: options.now ?? (() => performance.now()),
  };
  const attempts: AttemptMetrics[] = [];
  const started = opts.now();
  const chapters = await Promise.all(
    report.chapters.map((c) =>
      generateChapter(report, c.id, provider, opts, attempts),
    ),
  );
  attempts.sort(
    (a, b) =>
      report.chapters.findIndex((c) => c.id === a.chapter) -
        report.chapters.findIndex((c) => c.id === b.chapter) ||
      a.attempt - b.attempt,
  );

  const sum = (f: (a: AttemptMetrics) => number) =>
    attempts.reduce((acc, a) => acc + f(a), 0);
  const metrics: GenerationMetrics = {
    provider: provider.id,
    model: provider.model,
    attempts,
    totals: {
      calls: attempts.length,
      retries: attempts.filter((a) => a.attempt > 1).length,
      failures: attempts.filter((a) => a.outcome !== "ok").length,
      inputTokens: sum((a) => a.usage?.inputTokens ?? 0),
      outputTokens: sum((a) => a.usage?.outputTokens ?? 0),
      cacheReadInputTokens: sum((a) => a.usage?.cacheReadInputTokens ?? 0),
      cacheCreationInputTokens: sum(
        (a) => a.usage?.cacheCreationInputTokens ?? 0,
      ),
      costUsd: sum((a) => a.costUsd ?? 0),
      wallTimeMs: Math.round(opts.now() - started),
      chaptersFromAi: chapters.filter((c) => c.source === "ai").length,
      chaptersFromLibrary: chapters.filter((c) => c.source === "library")
        .length,
    },
  };

  return {
    version: `${report.version}+${PROMPT_VERSION}`,
    disclaimer: report.disclaimer,
    basis: report.basis,
    chapters,
    metrics,
  };
}

/**
 * Relatório inteiro pela biblioteca, sem chamar provedor (IA desligada ou
 * indisponível). Mesmo formato, todos os capítulos com source: "library".
 */
export function libraryReport(
  report: InterpretationReport,
  reason: string,
): GeneratedReport {
  const chapters = report.chapters.map((c) =>
    toGeneratedChapter(
      report,
      c.id,
      libraryDraft(report, c.id),
      "library",
      reason,
    ),
  );
  return {
    version: `${report.version}+${PROMPT_VERSION}`,
    disclaimer: report.disclaimer,
    basis: report.basis,
    chapters,
    metrics: {
      provider: "none",
      model: "none",
      attempts: [],
      totals: {
        calls: 0,
        retries: 0,
        failures: 0,
        inputTokens: 0,
        outputTokens: 0,
        cacheReadInputTokens: 0,
        cacheCreationInputTokens: 0,
        costUsd: 0,
        wallTimeMs: 0,
        chaptersFromAi: 0,
        chaptersFromLibrary: chapters.length,
      },
    },
  };
}

/**
 * Repetição ENTRE capítulos gerados pela IA (cada capítulo é gerado
 * isoladamente). Usado na avaliação de qualidade; não bloqueia a entrega.
 */
export function crossChapterRepetition(generated: GeneratedReport): string[] {
  const texts = generated.chapters
    .filter((c) => c.source === "ai")
    .flatMap((c) => [
      c.introduction,
      ...c.sections.map((s) => s.text),
      c.synthesis,
    ]);
  return repetitionIssues(texts).map((i) => i.message);
}
