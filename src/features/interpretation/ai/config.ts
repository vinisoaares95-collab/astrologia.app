import "server-only";

/**
 * Seleção do provedor (somente servidor).
 *
 * A IA real só é usada com TRÊS condições: SIDERA_AI_ENABLED=1,
 * SIDERA_AI_PROVIDER=anthropic e ANTHROPIC_API_KEY definida no ambiente do
 * servidor. Em qualquer outro caso, usa o provedor simulado (sem rede).
 * Nenhuma rota pública chama este módulo nesta fase.
 */
import {
  createAnthropicProvider,
  type AnthropicEffort,
} from "./anthropic-provider";
import type { AiProvider } from "./contract";
import { createMockProvider } from "./mock-provider";

/** Recomendação da Fase 02F (ver docs/fase-02f-geracao-com-ia.md). */
export const DEFAULT_MODEL = "claude-sonnet-5-5";
export const DEFAULT_EFFORT: AnthropicEffort = "medium";

type Env = Record<string, string | undefined>;

export type AiConfig = {
  mode: "anthropic" | "mock";
  model: string;
  effort: AnthropicEffort;
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
        : !env.ANTHROPIC_API_KEY
          ? "ANTHROPIC_API_KEY ausente."
          : null;
  return { mode: reason ? "mock" : "anthropic", model, effort, reason };
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
          apiKey: env.ANTHROPIC_API_KEY,
        })
      : createMockProvider();
  return { provider, config };
}
