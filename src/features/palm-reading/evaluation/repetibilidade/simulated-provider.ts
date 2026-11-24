/**
 * Provedor de visão SIMULADO para o experimento de repetibilidade: sem rede,
 * sem custo real, sem olhar a imagem. Cada "foto" (identificada pelo SHA-256
 * dos bytes sintéticos recebidos) tem um roteiro: a n-ésima análise devolve
 * a observação fictícia que o teste definir, ou uma falha.
 *
 * O consumo informado imita o medido na 03F.1 (rodada 2): ~1.700 tokens de
 * entrada, ~500 de saída, prompt em cache (gravado na 1ª chamada de cada mão).
 */
import { createHash } from "node:crypto";

import {
  AiProviderError,
  type AiErrorKind,
} from "../../../interpretation/ai/contract";
import type {
  VisionProvider,
  VisionRequest,
  VisionResponse,
} from "../../vision/contract";
import { REP_MODEL } from "./config";

export type ScriptStep =
  | { kind: "observation"; raw: unknown; outputTokens?: number }
  | { kind: "invalid-json" }
  | { kind: "error"; error: AiErrorKind };

export type Script = (n: number) => ScriptStep;

const CACHED_PROMPT_TOKENS = 6507;

export function createSimulatedRepProvider(
  scripts: Map<string, Script>,
  options: { model?: string } = {},
): VisionProvider & { calls: number; perPhoto: Map<string, number> } {
  const perPhoto = new Map<string, number>();
  const cacheWritten = new Set<string>();
  const provider = {
    id: "simulado-repetibilidade",
    model: options.model ?? REP_MODEL,
    calls: 0,
    perPhoto,
    async analyze(request: VisionRequest): Promise<VisionResponse> {
      provider.calls++;
      const sha = createHash("sha256")
        .update(Buffer.from(request.image.base64, "base64"))
        .digest("hex");
      const script = scripts.get(sha);
      if (!script) throw new AiProviderError("unknown", "Foto sem roteiro.");
      const n = (perPhoto.get(sha) ?? 0) + 1;
      perPhoto.set(sha, n);
      const step = script(n);
      if (step.kind === "error")
        throw new AiProviderError(step.error, `Falha simulada: ${step.error}`);
      const hand = (
        request.schema.properties as Record<string, { const?: string }>
      ).hand?.const;
      const first = !cacheWritten.has(String(hand));
      cacheWritten.add(String(hand));
      return {
        model: provider.model,
        text:
          step.kind === "invalid-json"
            ? '{"version": "03c.2", "hand"'
            : JSON.stringify(step.raw),
        stopReason: "end",
        usage: {
          inputTokens: 1671,
          outputTokens:
            step.kind === "observation" ? (step.outputTokens ?? 500) : 120,
          cacheReadInputTokens: first ? 0 : CACHED_PROMPT_TOKENS,
          cacheCreationInputTokens: first ? CACHED_PROMPT_TOKENS : 0,
        },
      };
    },
  };
  return provider;
}
