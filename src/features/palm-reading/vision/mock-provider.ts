/**
 * Provedor de visão SIMULADO (Fase 03D): sem rede, sem custo, sem olhar a
 * imagem. Devolve observações fictícias da 03C para exercitar o fluxo de
 * ponta a ponta. Nada do que ele diz se refere à foto enviada.
 */
import {
  AiProviderError,
  type AiErrorKind,
} from "../../interpretation/ai/contract";
import {
  clearHand,
  insufficientPhoto,
  linesMissing,
  partialHand,
} from "../analysis/__fixtures__/observations";
import type { VisionProvider, VisionRequest, VisionResponse } from "./contract";

export const MOCK_VISION_SCENARIOS = [
  "clear",
  "partial",
  "insufficient",
  "lines-missing",
  "contradictory",
  "sensitive",
  "invalid-json",
  "truncated",
  "refusal",
  "error:timeout",
  "error:unavailable",
  "error:rate_limit",
] as const;
export type MockVisionScenario = (typeof MOCK_VISION_SCENARIOS)[number];

export function isMockVisionScenario(v: unknown): v is MockVisionScenario {
  return (MOCK_VISION_SCENARIOS as readonly unknown[]).includes(v);
}

/** Mão que o pedido declara (no schema, campo "hand" com const). */
function handOf(request: VisionRequest) {
  const props = request.schema.properties as Record<string, { const?: string }>;
  return props.hand?.const === "left" ? "left" : "right";
}

function observationFor(scenario: MockVisionScenario, hand: "right" | "left") {
  const base =
    scenario === "partial"
      ? partialHand()
      : scenario === "insufficient"
        ? insufficientPhoto()
        : scenario === "lines-missing"
          ? linesMissing()
          : clearHand();
  base.hand = hand;
  if (scenario === "contradictory") {
    // "Adequada", mas é o dorso da mão: o validador deve anular tudo.
    base.image = { quality: "adequate", issues: ["back_of_hand"] };
  }
  if (scenario === "sensitive")
    base.features["head.length"].evidence =
      "Mão de pessoa idosa; a linha termina sob o dedo anelar.";
  return base;
}

export function createMockVisionProvider(
  scenarios:
    | MockVisionScenario[]
    | ((request: VisionRequest, call: number) => MockVisionScenario) = [
    "clear",
  ],
  options: { model?: string; delayMs?: number } = {},
): VisionProvider & { calls: VisionRequest[] } {
  const model = options.model ?? "mock-vision";
  const calls: VisionRequest[] = [];
  return {
    id: "mock",
    model,
    calls,
    async analyze(request: VisionRequest): Promise<VisionResponse> {
      const call = calls.length;
      calls.push(request);
      const scenario =
        typeof scenarios === "function"
          ? scenarios(request, call)
          : scenarios[Math.min(call, scenarios.length - 1)];
      if (options.delayMs)
        await new Promise((r) => setTimeout(r, options.delayMs));
      if (scenario.startsWith("error:")) {
        const kind = scenario.slice(6) as AiErrorKind;
        throw new AiProviderError(kind, `Falha simulada: ${kind}`);
      }
      let text = JSON.stringify(observationFor(scenario, handOf(request)));
      if (scenario === "invalid-json") text = text.slice(0, -2);
      if (scenario === "truncated") text = text.slice(0, text.length / 2);
      return {
        model,
        text,
        stopReason:
          scenario === "truncated"
            ? "max_tokens"
            : scenario === "refusal"
              ? "refusal"
              : "end",
        usage: {
          // Aproximação: imagem no teto de tokens + texto ÷ 4.
          inputTokens:
            4784 + Math.ceil((request.system.length + request.text.length) / 4),
          outputTokens: Math.ceil(text.length / 4),
          cacheReadInputTokens: 0,
          cacheCreationInputTokens: 0,
        },
      };
    },
  };
}
