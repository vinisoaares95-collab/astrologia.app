import "server-only";

/**
 * Configuração da análise visual (Fase 03D), separada da geração de textos
 * astrológicos (interpretation/ai/config.ts): outras variáveis, outro
 * modelo, outro teto.
 *
 * Camadas, todas desligadas por padrão:
 * 1. SIDERA_PALM_ANALYSIS_ENABLED=1 liga os endpoints (sem ela: 404). Com
 *    ela, a análise usa o provedor SIMULADO.
 * 2. Chamada REAL ao provedor exige, além disso:
 *    SIDERA_PALM_VISION_PROVIDER=anthropic, SIDERA_PALM_VISION_REAL=1, a
 *    chave no servidor e NODE_ENV diferente de "production" (o MVP não
 *    processa fotos reais em deploy público).
 * Em produção, o recibo de consentimento exige SIDERA_CONSENT_SECRET.
 */
import { anthropicApiKey } from "../../interpretation/ai/api-key";
import type { AnthropicEffort } from "../../interpretation/ai/anthropic-provider";
import {
  isMockVisionScenario,
  type MockVisionScenario,
} from "../vision/mock-provider";

type Env = Record<string, string | undefined>;

/** Modelos com preço e avaliação prevista (03F compara os dois). */
export const VISION_MODELS = ["claude-haiku-5-5", "claude-sonnet-5-5"] as const;
export const DEFAULT_VISION_MODEL = "claude-haiku-5-5";

/** Teto padrão por processo (US$) e teto máximo aceito por variável. */
export const DEFAULT_VISION_BUDGET_USD = 0.1;
export const MAX_VISION_BUDGET_USD = 1;

export type PalmAnalysisConfig = {
  enabled: boolean;
  mode: "mock" | "anthropic";
  model: string;
  effort: AnthropicEffort;
  budgetUsd: number;
  mockScenario: MockVisionScenario;
  /** Por que a chamada real não está ativa (só para diagnóstico interno). */
  realDisabledReason: string | null;
};

export function readPalmAnalysisConfig(
  env: Env = process.env,
): PalmAnalysisConfig {
  const enabled = env.SIDERA_PALM_ANALYSIS_ENABLED === "1";
  const model = (VISION_MODELS as readonly string[]).includes(
    env.SIDERA_PALM_VISION_MODEL ?? "",
  )
    ? (env.SIDERA_PALM_VISION_MODEL as string)
    : DEFAULT_VISION_MODEL;
  const effort = (["low", "medium", "high"] as const).includes(
    env.SIDERA_PALM_VISION_EFFORT as AnthropicEffort,
  )
    ? (env.SIDERA_PALM_VISION_EFFORT as AnthropicEffort)
    : "medium";
  const requested = Number(env.SIDERA_PALM_VISION_BUDGET_USD);
  const budgetUsd =
    Number.isFinite(requested) && requested > 0
      ? Math.min(requested, MAX_VISION_BUDGET_USD)
      : DEFAULT_VISION_BUDGET_USD;
  const realDisabledReason = !enabled
    ? "Análise desligada (SIDERA_PALM_ANALYSIS_ENABLED)."
    : env.SIDERA_PALM_VISION_PROVIDER !== "anthropic"
      ? "Provedor real não selecionado (SIDERA_PALM_VISION_PROVIDER)."
      : env.SIDERA_PALM_VISION_REAL !== "1"
        ? "Chamadas reais não autorizadas (SIDERA_PALM_VISION_REAL)."
        : !anthropicApiKey(env)
          ? "Credencial ausente no servidor."
          : env.NODE_ENV === "production"
            ? "Chamadas reais bloqueadas em produção no MVP."
            : null;
  return {
    enabled,
    mode: realDisabledReason ? "mock" : "anthropic",
    model,
    effort,
    budgetUsd,
    mockScenario: isMockVisionScenario(env.SIDERA_PALM_VISION_MOCK_SCENARIO)
      ? env.SIDERA_PALM_VISION_MOCK_SCENARIO
      : "clear",
    realDisabledReason,
  };
}
