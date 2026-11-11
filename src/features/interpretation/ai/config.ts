import "server-only";

/**
 * Seleção do provedor (somente servidor).
 *
 * A IA real só é usada com TRÊS condições: SIDERA_AI_ENABLED=1,
 * SIDERA_AI_PROVIDER=anthropic e SIDERA_ANTHROPIC_API_KEY (ou ANTHROPIC_API_KEY) definida no ambiente do
 * servidor. Em qualquer outro caso, usa o provedor simulado (sem rede).
 * Nenhuma rota pública chama este módulo nesta fase.
 */
import {
  createAnthropicProvider,
  type AnthropicEffort,
} from "./anthropic-provider";
import { anthropicApiKey } from "./api-key";
import type { AiProvider } from "./contract";
import { createMockProvider } from "./mock-provider";

/**
 * Padrão do MVP: Haiku 5.5, escolhido na avaliação cega da Fase 02F.1
 * (docs/fase-02f1-avaliacao-comparativa.md). Sonnet 5.5 continua suportado
 * por SIDERA_AI_MODEL, para novas comparações.
 */
export const DEFAULT_MODEL = "claude-haiku-5-5";
/** Modelos com preço, adaptador e testes mantidos. */
export const SUPPORTED_MODELS = [
  "claude-haiku-5-5",
  "claude-sonnet-5-5",
] as const;
export const DEFAULT_EFFORT: AnthropicEffort = "medium";

type Env = Record<string, string | undefined>;

export type AiConfig = {
  mode: "anthropic" | "mock";
  model: string;
  effort: AnthropicEffort;
  /**
   * Fallback do servidor para outro modelo (pago) em caso de recusa.
   * Desligado por padrão (02F.2); SIDERA_AI_REFUSAL_FALLBACK=1 liga.
   * A alternativa sem custo é sempre a biblioteca.
   */
  refusalFallback: boolean;
  /** Motivo de estar no modo simulado (para logs internos). */
  reason: string | null;
};

export function readAiConfig(env: Env = process.env): AiConfig {
  const model = env.SIDERA_AI_MODEL?.trim() || DEFAULT_MODEL;
  const effort = (["low", "medium", "high"] as const).includes(
    env.SIDERA_AI_EFFORT as AnthropicEffort,
  )
    ? (env.SIDERA_AI_EFFORT as AnthropicEffort)
    : DEFAULT_EFFORT;
  const reason =
    env.SIDERA_AI_ENABLED !== "1"
      ? "SIDERA_AI_ENABLED não está ativo."
      : env.SIDERA_AI_PROVIDER !== "anthropic"
        ? "SIDERA_AI_PROVIDER não é 'anthropic'."
        : !anthropicApiKey(env)
          ? "SIDERA_ANTHROPIC_API_KEY ausente."
          : null;
  return {
    mode: reason ? "mock" : "anthropic",
    model,
    effort,
    refusalFallback: env.SIDERA_AI_REFUSAL_FALLBACK === "1",
    reason,
  };
}

export function providerFromEnv(env: Env = process.env): {
  provider: AiProvider;
  config: AiConfig;
} {
  const config = readAiConfig(env);
  const provider =
    config.mode === "anthropic"
      ? createAnthropicProvider({
          model: config.model,
          effort: config.effort,
          refusalFallback: config.refusalFallback,
          apiKey: anthropicApiKey(env),
        })
      : createMockProvider();
  return { provider, config };
}
