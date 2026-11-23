/**
 * Execução da Etapa B (03F.2): cada foto passa pelo fluxo do endpoint
 * comercial, sem atalhos.
 *
 *   recibo (`handleConsent`) → análise (`handleAnalysis`): conferência do
 *   arquivo, limites, teto por relatório (US$ 0,15), visão, capítulos 6 e 7,
 *   biblioteca como reserva → resultado do cliente.
 *
 * Os provedores reais são envolvidos, como no processo do produto, pelo teto
 * do processo; por dentro, um registrador anota cada chamada que de fato
 * aconteceu (modelo, tokens, custo, latência, resultado). A trilha de
 * auditoria (origem do texto) chega pelo gancho `onAudit`, que o produto
 * não usa. Antes de cada relatório, o saldo precisa cobrir o teto por
 * relatório; sem saldo, os relatórios restantes ficam "não executados".
 */
import { randomBytes } from "node:crypto";

import {
  withBudget,
  worstCaseUsd,
  type BudgetController,
} from "../../../interpretation/ai/budget";
import {
  AiProviderError,
  type AiProvider,
  type AiRequest,
  type AiResponse,
} from "../../../interpretation/ai/contract";
import {
  estimateCostUsd,
  MODEL_PRICES,
  type ModelPrice,
} from "../../../interpretation/ai/pricing";
import type { PalmAnalysisResult } from "../../chapters/presentation";
import { CONSENT_VERSION, type PalmHand } from "../../consent";
import {
  PALM_REPORT_BUDGET_USD,
  readPalmAnalysisConfig,
} from "../../server/config";
import {
  CONSENT_HEADER,
  defaultLimits,
  handleAnalysis,
  handleConsent,
  type PalmApiDeps,
  type PalmReadingAudit,
} from "../../server/handlers";
import { createClientKeyer } from "../../server/client-key";
import { visionWorstCaseUsd, withVisionBudget } from "../../vision/budget";
import type { VisionProvider, VisionRequest } from "../../vision/contract";

export type E2EPhoto = {
  id: string;
  hand: PalmHand;
  /** Foto já preparada como no aparelho (JPEG sem metadados). */
  bytes: Uint8Array;
};

export type E2ECall = {
  kind: "vision" | "text";
  chapter: "maos" | "linhas" | null;
  model: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number | null;
  /**
   * Chamada interrompida (tempo, rede, erro desconhecido) que pode ter sido
   * cobrada: o pior caso dela, o mesmo valor que o teto reserva e debita.
   */
  possibleUsd: number | null;
  /** Prazo dado a esta chamada (limitado pelo prazo total da análise). */
  timeoutMs: number;
  outcome: "ok" | `error:${string}`;
};

export type E2EChapter = {
  number: number;
  status: "content" | "unavailable";
  source: string | null;
  fallbackReason: string | null;
  attempts: { attempt: number; outcome: string; errors: string[] }[];
  sections: number;
  unavailableMessage: string | null;
};

export type E2ECase = {
  id: string;
  hand: PalmHand;
  status: "ok" | "error" | "not_run";
  /** Código HTTP e erro genérico, como o aparelho recebe. */
  http: number | null;
  error: string | null;
  notRunReason: string | null;
  result: PalmAnalysisResult | null;
  chapters: E2EChapter[];
  calls: E2ECall[];
  costUsd: number;
  /** Custo possível de chamadas interrompidas (não confirmado). */
  possibleExtraUsd: number;
  /** Do envio da foto à resposta (o que a pessoa espera na tela). */
  latencyMs: number;
  /** Análises restantes que o aparelho mostraria depois deste resultado. */
  remaining: number | null;
};

export type E2ERun = {
  startedAt: string;
  visionModel: string;
  textModel: string;
  reportBudgetUsd: number;
  processBudgetUsd: number;
  spentUsd: number;
  stoppedByBudget: boolean;
  cases: E2ECase[];
};

const ORIGIN = "http://sidera.avaliacao";
const HEADERS = { origin: ORIGIN, host: "sidera.avaliacao" };

const chapterOf = (r: AiRequest) =>
  /"id":\s*"maos"/u.test(r.user) ? "maos" : "linhas";

const MAY_HAVE_BEEN_BILLED = new Set(["timeout", "network", "unknown"]);

function record<T>(
  calls: E2ECall[],
  base: Pick<E2ECall, "kind" | "chapter" | "model" | "timeoutMs">,
  prices: Record<string, ModelPrice>,
  now: () => number,
  worstUsd: () => number,
  run: () => Promise<AiResponse & T>,
) {
  const t0 = now();
  return run().then(
    (res) => {
      calls.push({
        ...base,
        model: res.model,
        latencyMs: Math.round(now() - t0),
        inputTokens: res.usage.inputTokens,
        outputTokens: res.usage.outputTokens,
        costUsd: estimateCostUsd(res.model, res.usage, prices),
        possibleUsd: null,
        outcome: "ok",
      });
      return res;
    },
    (error: unknown) => {
      const kind = error instanceof AiProviderError ? error.kind : "unknown";
      calls.push({
        ...base,
        latencyMs: Math.round(now() - t0),
        inputTokens: 0,
        outputTokens: 0,
        costUsd: null,
        possibleUsd: MAY_HAVE_BEEN_BILLED.has(kind) ? worstUsd() : null,
        outcome: `error:${kind}`,
      });
      throw error;
    },
  );
}

/** Registra cada chamada que chegou ao provedor (o teto fica por fora). */
function recordingVision(
  inner: VisionProvider,
  calls: E2ECall[],
  prices: Record<string, ModelPrice>,
  now: () => number,
): VisionProvider {
  return {
    id: inner.id,
    model: inner.model,
    analyze: (req: VisionRequest) =>
      record(
        calls,
        {
          kind: "vision",
          chapter: null,
          model: inner.model,
          timeoutMs: req.timeoutMs,
        },
        prices,
        now,
        () => visionWorstCaseUsd(req, prices[inner.model]),
        () => inner.analyze(req),
      ),
  };
}

function recordingText(
  inner: AiProvider,
  calls: E2ECall[],
  prices: Record<string, ModelPrice>,
  now: () => number,
): AiProvider {
  return {
    id: inner.id,
    model: inner.model,
    generate: (req: AiRequest) =>
      record(
        calls,
        {
          kind: "text",
          chapter: chapterOf(req),
          model: inner.model,
          timeoutMs: req.timeoutMs,
        },
        prices,
        now,
        () => worstCaseUsd(req, prices[inner.model]),
        () => inner.generate(req),
      ),
  };
}

export async function runE2EEvaluation(input: {
  photos: E2EPhoto[];
  vision: VisionProvider;
  text: AiProvider;
  /** Teto do processo para a avaliação inteira (US$). */
  budget: BudgetController;
  prices?: Record<string, ModelPrice>;
  now?: () => number;
}): Promise<E2ERun> {
  const prices = input.prices ?? MODEL_PRICES;
  const now = input.now ?? (() => performance.now());
  for (const m of [input.vision.model, input.text.model])
    if (!prices[m])
      throw new Error(`Sem preço para ${m}: gasto não controlável.`);
  // Configuração do produto (modelos padrão), em modo real: assim o
  // endpoint aplica o teto por relatório como em produção.
  const config = {
    ...readPalmAnalysisConfig({ SIDERA_PALM_ANALYSIS_ENABLED: "1" }),
    mode: "anthropic" as const,
    realDisabledReason: null,
    budgetUsd: input.budget.limitUsd,
  };
  if (
    config.model !== input.vision.model ||
    config.textModel !== input.text.model
  )
    throw new Error("A avaliação usa só os modelos padrão do produto.");

  // Um só vetor, lido pelos registradores; copiado e esvaziado por caso.
  const calls: E2ECall[] = [];
  let audit: PalmReadingAudit | null = null;
  const vision = withVisionBudget(
    recordingVision(input.vision, calls, prices, now),
    input.budget,
    prices,
  );
  const text = withBudget(
    recordingText(input.text, calls, prices, now),
    input.budget,
    prices,
  );
  const deps: PalmApiDeps = {
    config,
    secret: randomBytes(32),
    clientKey: createClientKeyer({
      secret: randomBytes(32),
      source: { kind: "untrusted-dev" },
    }),
    now: () => Date.now(),
    provider: () => vision,
    textProvider: () => text,
    limits: defaultLimits(),
    cache: new Map(),
    onAudit: (a) => {
      audit = a;
    },
  };

  const run: E2ERun = {
    startedAt: new Date().toISOString(),
    visionModel: config.model,
    textModel: config.textModel,
    reportBudgetUsd: config.reportBudgetUsd,
    processBudgetUsd: input.budget.limitUsd,
    spentUsd: 0,
    stoppedByBudget: false,
    cases: [],
  };

  for (const photo of input.photos) {
    const empty = {
      id: photo.id,
      hand: photo.hand,
      http: null,
      error: null,
      result: null,
      chapters: [],
      calls: [],
      costUsd: 0,
      possibleExtraUsd: 0,
      latencyMs: 0,
      remaining: null,
    };
    const free =
      input.budget.limitUsd -
      input.budget.spentUsd() -
      input.budget.reservedUsd();
    if (run.stoppedByBudget || free < config.reportBudgetUsd) {
      run.stoppedByBudget = true;
      run.cases.push({
        ...empty,
        status: "not_run",
        notRunReason: "Saldo insuficiente para o teto de um relatório.",
      });
      photo.bytes.fill(0);
      continue;
    }
    calls.length = 0;
    audit = null;

    const consent = await handleConsent(
      new Request(`${ORIGIN}/api/leitura-das-maos/consentimento`, {
        method: "POST",
        headers: { ...HEADERS, "content-type": "application/json" },
        body: JSON.stringify({
          version: CONSENT_VERSION,
          adult: true,
          analysis: true,
          hand: photo.hand,
        }),
      }),
      deps,
    );
    const { token } = (await consent.json()) as { token?: string };
    const t0 = now();
    const response = await handleAnalysis(
      new Request(`${ORIGIN}/api/leitura-das-maos/analise`, {
        method: "POST",
        headers: {
          ...HEADERS,
          "content-type": "image/jpeg",
          [CONSENT_HEADER]: token ?? "",
        },
        body: photo.bytes as BodyInit,
      }),
      deps,
    );
    const latencyMs = Math.round(now() - t0);
    photo.bytes.fill(0);
    const body = (await response.json()) as {
      result?: PalmAnalysisResult;
      error?: string;
      remaining?: number;
    };
    const recorded = [...calls];
    const trail = audit as PalmReadingAudit | null;
    const chapters: E2EChapter[] = (body.result?.chapters ?? []).map((c) => {
      const t = trail?.chapters.find(
        (x) => (x.id === "maos" ? 6 : 7) === c.number,
      );
      return {
        number: c.number,
        status: c.status,
        source: t?.source ?? null,
        fallbackReason: t?.fallbackReason ?? null,
        attempts: (t?.attempts ?? []).map((a) => ({
          attempt: a.attempt,
          outcome: a.outcome,
          errors: a.errors.map((e) => e.split(":")[0]),
        })),
        sections: c.sections.length,
        unavailableMessage: c.unavailableMessage,
      };
    });
    if (recorded.some((c) => c.outcome === "error:budget"))
      run.stoppedByBudget = true;
    run.cases.push({
      ...empty,
      status: response.ok ? "ok" : "error",
      http: response.status,
      error: body.error ?? null,
      notRunReason: null,
      result: body.result ?? null,
      chapters,
      calls: recorded,
      costUsd: recorded.reduce((n, c) => n + (c.costUsd ?? 0), 0),
      possibleExtraUsd: recorded.reduce((n, c) => n + (c.possibleUsd ?? 0), 0),
      latencyMs,
      remaining: body.remaining ?? null,
    });
  }
  run.spentUsd = input.budget.spentUsd();
  return run;
}

/** Pior caso garantido pelo código: o teto por relatório do produto. */
export function e2eWorstUsd(reports: number): number {
  return reports * PALM_REPORT_BUDGET_USD;
}
