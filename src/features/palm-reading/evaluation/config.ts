/**
 * Avaliação visual comparativa (Fase 03F.1): condições, teto e portão.
 *
 * Totalmente separada do fluxo comercial: outras variáveis, outro teto
 * (orçamento exclusivo da avaliação), nenhum texto de capítulo gerado. Os
 * limites comerciais (server/config.ts) não mudam e não são usados aqui.
 *
 * Sem TODAS as condições do portão, nada é chamado.
 */
import path from "node:path";

import { anthropicApiKey } from "../../interpretation/ai/api-key";
import type { AnthropicEffort } from "../../interpretation/ai/anthropic-provider";
import {
  VISION_MAX_ATTEMPTS,
  VISION_MAX_OUTPUT_TOKENS,
  VISION_TIMEOUT_MS,
} from "../vision/analyze";

type Env = Record<string, string | undefined>;

/** Os dois modelos comparados, sempre nas mesmas condições. */
export const EVAL_VISION_MODELS = [
  "claude-haiku-5-5",
  "claude-sonnet-5-5",
] as const;
export type EvalVisionModel = (typeof EVAL_VISION_MODELS)[number];

/** Mesmas instruções, categorias, esforço, tentativas e limites do produto. */
export const EVAL_VISION_CONDITIONS = {
  effort: "medium" as AnthropicEffort,
  maxAttempts: VISION_MAX_ATTEMPTS,
  maxOutputTokens: VISION_MAX_OUTPUT_TOKENS,
  timeoutMs: VISION_TIMEOUT_MS,
} as const;

/** Até 8 fotos autorizadas (decisão da 03D). */
export const EVAL_MAX_PHOTOS = 8;

/** Orçamento de referência da 1ª comparação (ainda não autorizado). */
export const EVAL_BUDGET_BRL = 7;
/** Câmbio com folga (mesmo critério da 02F.1); ajuste com SIDERA_AI_USD_BRL. */
export const EVAL_DEFAULT_USD_BRL = 5.5;

/**
 * Frase exigida em SIDERA_PALM_EVAL_CONFIRM: evita que uma variável
 * esquecida (ou copiada de outra fase) dispare gasto.
 */
export const EVAL_CONFIRM_PHRASE = "autorizo-avaliacao-visual-03f";

export function evalUsdBrl(env: Env): number {
  const v = Number(env.SIDERA_AI_USD_BRL);
  return Number.isFinite(v) && v > 0 ? v : EVAL_DEFAULT_USD_BRL;
}

/** Nunca acima do teto aprovado; valores menores são aceitos. */
export function evalBudgetBrl(env: Env): number {
  const v = Number(env.SIDERA_PALM_EVAL_BUDGET_BRL);
  return Number.isFinite(v) && v > 0
    ? Math.min(v, EVAL_BUDGET_BRL)
    : EVAL_BUDGET_BRL;
}

/** Tentativas por foto e modelo: 1 ou 2 (nunca mais que o produto). */
export function evalMaxAttempts(env: Env): number {
  return env.SIDERA_PALM_EVAL_MAX_ATTEMPTS === "1"
    ? 1
    : EVAL_VISION_CONDITIONS.maxAttempts;
}

/** `dir` está fora do repositório (fotos e relatórios nunca entram no Git). */
export function isOutside(dir: string, root: string): boolean {
  const rel = path.relative(path.resolve(root), path.resolve(dir));
  return rel.startsWith("..") || path.isAbsolute(rel);
}

/** Pasta dentro do repositório mas ignorada pelo Git (avaliacao-ia/). */
export function isIgnoredReportDir(dir: string, root: string): boolean {
  const rel = path.relative(path.resolve(root), path.resolve(dir));
  return rel === "avaliacao-ia" || rel.startsWith(`avaliacao-ia${path.sep}`);
}

export type EvalGate = {
  /** Pode preparar e calcular (sem chamadas). */
  canPlan: boolean;
  /** Pode chamar os modelos (pago). */
  canCall: boolean;
  reasons: string[];
  keyViaProxy: boolean;
  photosDir: string | null;
};

/**
 * Condições, em camadas:
 * - planejar (grátis): SIDERA_PALM_EVAL_DIR fora do repositório;
 * - chamar (pago): além disso SIDERA_PALM_EVAL_PAID=1, a frase de
 *   confirmação, credencial no servidor e NODE_ENV ≠ production.
 * Nunca lê nem devolve o valor da chave.
 */
export function visionEvalGate(env: Env, repoRoot: string): EvalGate {
  const reasons: string[] = [];
  const photosDir = env.SIDERA_PALM_EVAL_DIR?.trim() || null;
  if (!photosDir)
    reasons.push("Pasta das fotos não informada (SIDERA_PALM_EVAL_DIR).");
  else if (!isOutside(photosDir, repoRoot))
    reasons.push(
      "A pasta das fotos precisa ficar FORA do repositório (SIDERA_PALM_EVAL_DIR).",
    );
  const canPlan = reasons.length === 0;

  if (env.SIDERA_PALM_EVAL_PAID !== "1")
    reasons.push(
      "Sem autorização explícita para chamadas pagas (SIDERA_PALM_EVAL_PAID=1).",
    );
  if (env.SIDERA_PALM_EVAL_CONFIRM !== EVAL_CONFIRM_PHRASE)
    reasons.push(
      `Confirmação ausente (SIDERA_PALM_EVAL_CONFIRM=${EVAL_CONFIRM_PHRASE}).`,
    );
  const keyViaProxy = env.SIDERA_AI_KEY_VIA_PROXY === "1";
  if (!anthropicApiKey(env) && !keyViaProxy)
    reasons.push(
      "Credencial ausente (SIDERA_ANTHROPIC_API_KEY no servidor ou SIDERA_AI_KEY_VIA_PROXY=1).",
    );
  if (env.NODE_ENV === "production")
    reasons.push("A avaliação não roda em produção.");
  return {
    canPlan,
    canCall: reasons.length === 0,
    reasons,
    keyViaProxy,
    photosDir,
  };
}
