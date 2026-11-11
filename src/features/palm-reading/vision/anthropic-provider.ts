import "server-only";

/**
 * Adaptador Anthropic para a extração visual (Fase 03D).
 *
 * - Imagem em base64 (JPEG preparado, sem metadados), antes do texto.
 * - Saída estruturada: `output_config.format` com o JSON Schema da
 *   observação (suportado por Haiku 5.5 e Sonnet 5.5). O schema garante o
 *   formato, não a correção visual: o resultado passa pelo validador 03C.
 * - Sem fallback entre modelos e sem novas tentativas no SDK
 *   (maxRetries: 0); quem decide é o orquestrador.
 * - A chave vem só do servidor (mesma regra de api-key.ts).
 */
import Anthropic from "@anthropic-ai/sdk";

import { toProviderError } from "../../interpretation/ai/anthropic-provider";
import type { AnthropicEffort } from "../../interpretation/ai/anthropic-provider";
import type { VisionProvider, VisionRequest, VisionResponse } from "./contract";

type CreateFn = (
  body: Anthropic.Beta.Messages.MessageCreateParamsNonStreaming,
  options: { timeout: number },
) => Promise<Anthropic.Beta.Messages.BetaMessage>;

export function createAnthropicVisionProvider(config: {
  model: string;
  effort: AnthropicEffort;
  apiKey?: string;
  /** Injetável para testes (sem rede). */
  create?: CreateFn;
}): VisionProvider {
  const create: CreateFn =
    config.create ??
    (() => {
      const client = new Anthropic({ apiKey: config.apiKey, maxRetries: 0 });
      return (body, options) => client.beta.messages.create(body, options);
    })();

  return {
    id: "anthropic",
    model: config.model,
    async analyze(request: VisionRequest): Promise<VisionResponse> {
      let message: Anthropic.Beta.Messages.BetaMessage;
      try {
        message = await create(
          {
            model: config.model,
            max_tokens: request.maxOutputTokens,
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
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "image",
                    source: {
                      type: "base64",
                      media_type: request.image.mediaType,
                      data: request.image.base64,
                    },
                  },
                  { type: "text", text: request.text },
                ],
              },
            ],
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
