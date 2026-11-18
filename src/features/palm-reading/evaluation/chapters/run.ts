/**
 * Execução da Etapa A (03F.2): observação → motor 03C → capítulos 6 e 7
 * (motor 03E, sem mudanças) → verificações automáticas → trilha.
 *
 * Orçamento EXCLUSIVO: antes de cada caso, o saldo precisa cobrir o pior
 * caso dos dois capítulos (todas as tentativas, com o texto de correção da
 * nova tentativa); cada chamada reserva o seu pior caso (`withBudget`). Sem
 * saldo, a avaliação para e os casos restantes ficam "não executados".
 */
import {
  withBudget,
  worstCaseUsd,
  type BudgetController,
} from "../../../interpretation/ai/budget";
import type { AiProvider } from "../../../interpretation/ai/contract";
import {
  MODEL_PRICES,
  type ModelPrice,
} from "../../../interpretation/ai/pricing";
import { languageIssues } from "../../../interpretation/ai/validate";
import {
  buildPalmInterpretation,
  type PalmChapter,
  type PalmReport,
} from "../../analysis/engine";
import { PALM_FORBIDDEN_TEXT_PATTERNS } from "../../analysis/library";
import { generatePalmChapters } from "../../chapters/generate";
import {
  toClientPalmChapter,
  type ClientPalmChapter,
} from "../../chapters/presentation";
import { buildPalmChapterRequest } from "../../chapters/prompt";
import { validatePalmChapterDraft } from "../../chapters/validate";
import type { PalmGeneratedChapter } from "../../chapters/contract";
import type { EvalCase } from "./cases";
import { CHAPTERS_EVAL_CONDITIONS } from "./config";

/** Folga para o texto de correção anexado à nova tentativa (como na 02F.1). */
export const RETRY_FEEDBACK_CHARS = 2_000;

export function chapterWorstUsd(
  chapter: PalmChapter,
  price: ModelPrice,
  attempts = CHAPTERS_EVAL_CONDITIONS.maxAttempts,
): number {
  if (chapter.items.length === 0) return 0;
  const req = buildPalmChapterRequest(chapter, {
    maxOutputTokens: CHAPTERS_EVAL_CONDITIONS.maxOutputTokens,
    timeoutMs: CHAPTERS_EVAL_CONDITIONS.timeoutMs,
  });
  const retry = { ...req, user: req.user + "x".repeat(RETRY_FEEDBACK_CHARS) };
  return worstCaseUsd(req, price) + (attempts - 1) * worstCaseUsd(retry, price);
}

export function caseWorstUsd(c: EvalCase, price: ModelPrice): number {
  return buildPalmInterpretation(c.observation).chapters.reduce(
    (n, ch) => n + chapterWorstUsd(ch, price),
    0,
  );
}

export type ChapterResult = {
  chapter: "maos" | "linhas";
  /** Texto exatamente como o cliente veria. */
  client: ClientPalmChapter;
  /** Itens (observação do sistema + interpretação autoral) usados. */
  items: {
    id: string;
    certainty: string;
    observation: string;
    symbolic: string;
  }[];
  /** Características não usadas (indeterminadas ou não visíveis). */
  unused: { feature: string; reason: string }[];
  source: PalmGeneratedChapter["source"];
  fallbackReason: string | null;
  attempts: {
    attempt: number;
    outcome: string;
    errors: string[];
    model: string;
    inputTokens: number;
    outputTokens: number;
    costUsd: number | null;
    latencyMs: number;
  }[];
  /** Revalidação do texto final pelo validador da quiromancia. */
  recheckCodes: string[];
  /** Linguagem proibida no texto final (deve ser vazio). */
  languageCodes: string[];
  forbiddenMatches: string[];
  words: number;
};

export type CaseResult = {
  id: string;
  kind: EvalCase["kind"];
  person: string | null;
  status: "ok" | "not_run";
  notRunReason: string | null;
  readingStatus: string;
  chapters: ChapterResult[];
  costUsd: number;
};

export type ChaptersRun = {
  startedAt: string;
  model: string;
  budgetUsd: number;
  spentUsd: number;
  stoppedByBudget: boolean;
  cases: CaseResult[];
};

const textOf = (c: ClientPalmChapter) =>
  [
    c.introduction,
    ...c.sections.map((s) => s.text),
    c.synthesis,
    ...c.reflectionQuestions,
  ].join(" ");

function recheck(
  chapter: PalmChapter,
  report: PalmReport,
  g: PalmGeneratedChapter,
) {
  if (g.status !== "content") return [];
  const draft = {
    introduction: g.introduction,
    sections: g.sections.map((s) => ({ text: s.text, itemIds: s.itemIds })),
    synthesis: g.synthesis,
    reflectionQuestions: g.reflectionQuestions,
  };
  return validatePalmChapterDraft(draft, chapter, report).errors.map(
    (e) => e.code,
  );
}

export async function runChaptersEvaluation(input: {
  cases: EvalCase[];
  provider: AiProvider;
  budget: BudgetController;
  prices?: Record<string, ModelPrice>;
  now?: () => number;
}): Promise<ChaptersRun> {
  const prices = input.prices ?? MODEL_PRICES;
  const price = prices[input.provider.model];
  if (!price)
    throw new Error(
      `Sem preço para ${input.provider.model}: gasto não controlável.`,
    );
  const provider = withBudget(input.provider, input.budget, prices);
  const run: ChaptersRun = {
    startedAt: new Date().toISOString(),
    model: input.provider.model,
    budgetUsd: input.budget.limitUsd,
    spentUsd: 0,
    stoppedByBudget: false,
    cases: [],
  };

  for (const c of input.cases) {
    const report = buildPalmInterpretation(c.observation);
    const base = {
      id: c.id,
      kind: c.kind,
      person: c.person,
      readingStatus: report.status,
    };
    const free =
      input.budget.limitUsd -
      input.budget.spentUsd() -
      input.budget.reservedUsd();
    if (run.stoppedByBudget || caseWorstUsd(c, price) > free) {
      run.stoppedByBudget = true;
      run.cases.push({
        ...base,
        status: "not_run",
        notRunReason: "Saldo insuficiente para o pior caso do relatório.",
        chapters: [],
        costUsd: 0,
      });
      continue;
    }
    const generated = await generatePalmChapters(report, provider, {
      maxAttempts: CHAPTERS_EVAL_CONDITIONS.maxAttempts,
      maxOutputTokens: CHAPTERS_EVAL_CONDITIONS.maxOutputTokens,
      timeoutMs: CHAPTERS_EVAL_CONDITIONS.timeoutMs,
      now: input.now,
    });
    const chapters = generated.chapters.map((g, i): ChapterResult => {
      const chapter = report.chapters[i];
      const client = toClientPalmChapter(g);
      const text = textOf(client);
      const attempts = generated.attempts
        .filter((a) => a.chapter === g.id)
        .map((a) => ({
          attempt: a.attempt,
          outcome: a.outcome,
          errors: a.errors,
          model: a.model,
          inputTokens: a.usage?.inputTokens ?? 0,
          outputTokens: a.usage?.outputTokens ?? 0,
          costUsd: a.costUsd,
          latencyMs: a.latencyMs,
        }));
      if (attempts.some((a) => a.outcome === "error:budget"))
        run.stoppedByBudget = true;
      const unused = Object.entries(c.observation.features)
        .filter(
          ([id, f]) =>
            f.visibility === "not_visible" &&
            (g.id === "maos"
              ? id.startsWith("hand.")
              : !id.startsWith("hand.")),
        )
        .map(([feature, f]) => ({
          feature,
          reason: f.visibility === "not_visible" ? f.reason : "",
        }));
      return {
        chapter: g.id,
        client,
        items: chapter.items.map((it) => ({
          id: it.id,
          certainty: it.certainty,
          observation: it.observation,
          symbolic: it.symbolic,
        })),
        unused,
        source: g.source,
        fallbackReason: g.fallbackReason,
        attempts,
        recheckCodes: recheck(chapter, report, g),
        languageCodes:
          g.status === "content" ? languageIssues(text).map((x) => x.code) : [],
        forbiddenMatches: PALM_FORBIDDEN_TEXT_PATTERNS.map(
          (re) => text.match(re)?.[0],
        ).filter((x): x is string => Boolean(x)),
        words: text.split(/\s+/u).filter(Boolean).length,
      };
    });
    run.cases.push({
      ...base,
      status: "ok",
      notRunReason: null,
      chapters,
      costUsd: chapters
        .flatMap((ch) => ch.attempts)
        .reduce((n, a) => n + (a.costUsd ?? 0), 0),
    });
  }
  run.spentUsd = input.budget.spentUsd();
  return run;
}
