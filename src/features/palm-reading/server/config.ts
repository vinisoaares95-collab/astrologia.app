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
 * Em produção, o recibo de consentimento exige SIDERA_CONSENT_SECRET, e os
 * limites por cliente exigem SIDERA_CLIENT_KEY_SECRET mais uma fonte de IP
 * confiável (SIDERA_CLIENT_IP_HEADER ou SIDERA_TRUSTED_PROXY_HOPS; ver
 * client-key.ts). Sem eles, os endpoints respondem 503.
 */
import { anthropicApiKey } from "../../interpretation/ai/api-key";
import { readAiConfig } from "../../interpretation/ai/config";
import type { AnthropicEffort } from "../../interpretation/ai/anthropic-provider";
import {
  isMockVisionScenario,
  type MockVisionScenario,
} from "../vision/mock-provider";

type Env = Record<string, string | undefined>;

/** Modelos com preço e avaliação mantidos. */
export const VISION_MODELS = ["claude-haiku-5-5", "claude-sonnet-5-5"] as const;
/**
 * Sonnet 5.5: escolhido na Fase 03F.1 (duas rodadas, 8 fotos, 4 pessoas;
 * docs/fase-03f1-avaliacao-visual.md, seção 9). Haiku 5.5 continua
 * suportado por SIDERA_PALM_VISION_MODEL, mas teve cobertura útil quase nula.
 */
export const DEFAULT_VISION_MODEL = "claude-sonnet-5-5";

/**
 * Teto por RELATÓRIO (visão + capítulos 6 e 7), em US$: cobre o pior caso
 * reservado pelo orçamento (2 tentativas de visão no Sonnet + 2 tentativas
 * de cada capítulo no modelo de texto padrão), conferido em teste. Uma
 * variável só pode baixá-lo.
 */
export const PALM_REPORT_BUDGET_USD = 0.15;

/**
 * Teto por processo (US$): soma de todos os relatórios enquanto o servidor
 * vive (estado em memória; não substitui um teto diário compartilhado antes
 * de uso público). US$ 1 ≈ 6 relatórios no pior caso, ≈ 70 no custo real
 * observado na 03F.1. Teto máximo aceito por variável: o mesmo.
 */
export const DEFAULT_VISION_BUDGET_USD = 1;
export const MAX_VISION_BUDGET_USD = 1;

export type PalmAnalysisConfig = {
  enabled: boolean;
  mode: "mock" | "anthropic";
  model: string;
  effort: AnthropicEffort;
  /** Teto do processo (visão + texto, todos os relatórios). */
  budgetUsd: number;
  /** Teto de cada relatório (visão + capítulos). */
  reportBudgetUsd: number;
  /**
   * Redação dos capítulos 6 e 7: o MESMO modelo de texto do Sidera
   * (SIDERA_AI_MODEL, padrão Haiku 5.5, escolhido na 02F.1), independente
   * do modelo de visão.
   */
  textModel: string;
  textEffort: AnthropicEffort;
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
  const report = Number(env.SIDERA_PALM_REPORT_BUDGET_USD);
  const reportBudgetUsd =
    Number.isFinite(report) && report > 0
      ? Math.min(report, PALM_REPORT_BUDGET_USD)
      : PALM_REPORT_BUDGET_USD;
  const text = readAiConfig(env);
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
    reportBudgetUsd,
    textModel: text.model,
    textEffort: text.effort,
    mockScenario: isMockVisionScenario(env.SIDERA_PALM_VISION_MOCK_SCENARIO)
      ? env.SIDERA_PALM_VISION_MOCK_SCENARIO
      : "clear",
    realDisabledReason,
  };
}
