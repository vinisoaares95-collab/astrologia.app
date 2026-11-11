import "server-only";

/**
 * Adaptador da API da Anthropic (Messages API, SDK oficial).
 *
 * - Saída estruturada: output_config.format com JSON Schema por capítulo.
 * - System prompt com cache_control (prefixo estável entre capítulos).
 * - Fallback do servidor em caso de recusa por classificador
 *   (fallbacks: "default"), opcional: desligado na avaliação comparativa,
 *   para que cada resposta venha do modelo pedido. O modelo efetivo é
 *   sempre lido de response.model.
 * - Sem novas tentativas no SDK (maxRetries: 0): quem decide é generate.ts,
 *   com limite fixo.
 * A chave vem só do servidor (SIDERA_ANTHROPIC_API_KEY, ver api-key.ts),
 * passada explicitamente ao SDK; nunca do cliente.
 */
import Anthropic from "@anthropic-ai/sdk";

import {
  AiProviderError,
  type AiProvider,
  type AiRequest,
  type AiResponse,
} from "./contract";

export type AnthropicEffort = "low" | "medium" | "high";

/**
 * Modelos que aceitam `fallbacks: "default"` na API (Haiku 5.5 não tem
 * fallback do servidor). Fora desta lista o parâmetro nunca é enviado.
 */
export const SERVER_FALLBACK_MODELS: readonly string[] = [
  "claude-sonnet-5-5",
  "claude-opus-5-5",
];

type CreateFn = (
  body: Anthropic.Beta.Messages.MessageCreateParamsNonStreaming,
  options: { timeout: number },
) => Promise<Anthropic.Beta.Messages.BetaMessage>;

export function createAnthropicProvider(config: {
  model: string;
  effort: AnthropicEffort;
  apiKey?: string;
  /** Fallback do servidor para outro modelo em caso de recusa (padrão: sim, quando suportado). */
  refusalFallback?: boolean;
  /** Injetável para testes (sem rede). */
  create?: CreateFn;
}): AiProvider {
  const create: CreateFn =
    config.create ??
    (() => {
      const client = new Anthropic({ apiKey: config.apiKey, maxRetries: 0 });
      return (body, options) => client.beta.messages.create(body, options);
    })();

  const fallback =
    (config.refusalFallback ?? true) &&
    SERVER_FALLBACK_MODELS.includes(config.model);

  return {
    id: "anthropic",
    model: config.model,
    async generate(request: AiRequest): Promise<AiResponse> {
      let message: Anthropic.Beta.Messages.BetaMessage;
      try {
        message = await create(
          {
            model: config.model,
            max_tokens: request.maxOutputTokens,
            ...(fallback
              ? {
                  betas: ["server-side-fallback-2026-07-01"],
                  fallbacks: "default" as const,
                }
              : {}),
            output_config: {
              effort: config.effort,
              format: { type: "json_schema", schema: request.schema },
            },
            system: [
              {
                type: "text",
                text: request.system,
                cache_control: { type: "ephemeral" },
              },
            ],
            messages: [{ role: "user", content: request.user }],
          },
          { timeout: request.timeoutMs },
        );
      } catch (error) {
        throw toProviderError(error);
      }

      const text = message.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("");
      return {
        model: message.model,
        text,
        stopReason:
          message.stop_reason === "end_turn"
            ? "end"
            : message.stop_reason === "max_tokens"
              ? "max_tokens"
              : message.stop_reason === "refusal"
                ? "refusal"
                : "other",
        usage: {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
          cacheReadInputTokens: message.usage.cache_read_input_tokens ?? 0,
          cacheCreationInputTokens:
            message.usage.cache_creation_input_tokens ?? 0,
        },
      };
    },
  };
}

/** Erros do SDK → categorias do produto (mais específico primeiro). */
export function toProviderError(error: unknown): AiProviderError {
  if (error instanceof Anthropic.APIConnectionTimeoutError)
    return new AiProviderError("timeout", "Tempo de resposta esgotado.");
  if (error instanceof Anthropic.APIConnectionError)
    return new AiProviderError("network", "Falha de conexão com a API.");
  if (error instanceof Anthropic.RateLimitError)
    return new AiProviderError("rate_limit", "Limite de requisições atingido.");
  if (
    error instanceof Anthropic.AuthenticationError ||
    error instanceof Anthropic.PermissionDeniedError
  )
    return new AiProviderError("auth", "Credencial inválida ou sem permissão.");
  if (error instanceof Anthropic.BadRequestError)
    return new AiProviderError("bad_request", error.message);
  if (error instanceof Anthropic.InternalServerError)
    return new AiProviderError("unavailable", "API indisponível no momento.");
  if (error instanceof Anthropic.APIError && (error.status ?? 0) >= 500)
    return new AiProviderError("unavailable", "API indisponível no momento.");
  return new AiProviderError(
    "unknown",
    error instanceof Error ? error.message : String(error),
  );
}
