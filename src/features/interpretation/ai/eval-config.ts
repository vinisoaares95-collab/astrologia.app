/**
 * Configuração da avaliação comparativa paga (Fase 02F.1).
 *
 * Condições idênticas para os dois modelos; teto de R$ 15 no total,
 * conferido ANTES (pior caso de todas as chamadas) e DURANTE (reserva por
 * chamada em budget.ts). Sem autorização explícita, nada é chamado.
 */
import type { ChapterId, InterpretationReport } from "../contract";
import { anthropicApiKey } from "./api-key";
import { worstCaseUsd } from "./budget";
import { MODEL_PRICES } from "./pricing";
import { buildChapterRequest } from "./prompt";

export const EVAL_MODELS = ["claude-sonnet-5-5", "claude-haiku-5-5"] as const;

/** Mesmas condições para os dois modelos. */
export const EVAL_CONDITIONS = {
  effort: "medium",
  refusalFallback: false,
  maxAttempts: 2,
  maxOutputTokens: 6000,
  timeoutMs: 120_000,
} as const;

/** Teto total da avaliação, incluindo novas tentativas. */
export const EVAL_BUDGET_BRL = 15;
/**
 * Câmbio usado para converter o teto (BRL → USD). Propositalmente acima da
 * PTAX de venda de 28/10/2026 (R$ 5,3420) para dar folga; ajuste com
 * SIDERA_AI_USD_BRL para o valor do dia.
 */
export const DEFAULT_USD_BRL = 5.5;

/** Folga para o texto de correção anexado numa nova tentativa. */
const RETRY_FEEDBACK_CHARS = 2_000;

export function usdBrlFrom(env: Record<string, string | undefined>): number {
  const v = Number(env.SIDERA_AI_USD_BRL);
  return Number.isFinite(v) && v > 0 ? v : DEFAULT_USD_BRL;
}

export function budgetBrlFrom(env: Record<string, string | undefined>): number {
  const v = Number(env.SIDERA_AI_EVAL_BUDGET_BRL);
  // Nunca acima do teto aprovado; valores menores são aceitos.
  return Number.isFinite(v) && v > 0
    ? Math.min(v, EVAL_BUDGET_BRL)
    : EVAL_BUDGET_BRL;
}

/** Pior custo possível da avaliação inteira, antes de qualquer chamada. */
export function preflight(
  reports: InterpretationReport[],
  models: readonly string[],
  usdBrl: number,
  budgetBrl: number,
) {
  const perModel = models.map((model) => {
    const price = MODEL_PRICES[model];
    if (!price) return { model, worstUsd: Number.POSITIVE_INFINITY, calls: 0 };
    let worstUsd = 0;
    let calls = 0;
    for (const report of reports)
      for (const ch of report.chapters) {
        if (ch.items.length === 0) continue;
        const req = buildChapterRequest(report, ch.id as ChapterId, {
          maxOutputTokens: EVAL_CONDITIONS.maxOutputTokens,
          timeoutMs: EVAL_CONDITIONS.timeoutMs,
        });
        const retry = {
          ...req,
          user: req.user + "x".repeat(RETRY_FEEDBACK_CHARS),
        };
        worstUsd += worstCaseUsd(req, price);
        worstUsd +=
          (EVAL_CONDITIONS.maxAttempts - 1) * worstCaseUsd(retry, price);
        calls += EVAL_CONDITIONS.maxAttempts;
      }
    return { model, worstUsd, calls };
  });
  const worstUsd = perModel.reduce((n, m) => n + m.worstUsd, 0);
  return {
    perModel,
    worstUsd,
    worstBrl: worstUsd * usdBrl,
    budgetBrl,
    budgetUsd: budgetBrl / usdBrl,
    withinBudget: worstUsd * usdBrl <= budgetBrl,
  };
}

/**
 * Condições para gastar: autorização explícita do proprietário e
 * credencial no servidor (variável de ambiente ou segredo injetado pelo
 * proxy da sessão). Nunca lê nem devolve o valor da chave.
 */
export function paidRunGate(env: Record<string, string | undefined>) {
  const reasons: string[] = [];
  if (env.SIDERA_AI_PAID_TESTS !== "1")
    reasons.push(
      "Sem autorização explícita para chamadas pagas (SIDERA_AI_PAID_TESTS=1).",
    );
  const keyInEnv = Boolean(anthropicApiKey(env));
  const keyViaProxy = env.SIDERA_AI_KEY_VIA_PROXY === "1";
  if (!keyInEnv && !keyViaProxy)
    reasons.push(
      "Credencial ausente (SIDERA_ANTHROPIC_API_KEY no servidor ou SIDERA_AI_KEY_VIA_PROXY=1).",
    );
  return { allowed: reasons.length === 0, reasons, keyViaProxy };
}
