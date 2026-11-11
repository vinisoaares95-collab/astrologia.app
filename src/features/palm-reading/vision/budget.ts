/**
 * Teto de gasto da extração visual (Fase 03D).
 *
 * Reaproveita o controlador de orçamento da 02F.1 (reserva do pior caso
 * antes de cada chamada, acerto pelo consumo real depois). O pior caso de
 * visão soma ao texto a imagem no TETO de tokens visuais do provedor
 * (4 784), cobrada ao preço mais alto de entrada, mais todo o max_tokens.
 */
import {
  CHARS_PER_TOKEN_UPPER_BOUND,
  type BudgetController,
} from "../../interpretation/ai/budget";
import { AiProviderError } from "../../interpretation/ai/contract";
import {
  estimateCostUsd,
  MODEL_PRICES,
  type ModelPrice,
} from "../../interpretation/ai/pricing";
import { MAX_VISUAL_TOKENS } from "../lib/prepare-image";
import type { VisionProvider, VisionRequest, VisionResponse } from "./contract";

export function visionWorstCaseUsd(
  request: VisionRequest,
  price: ModelPrice,
): number {
  const chars =
    request.system.length +
    request.text.length +
    JSON.stringify(request.schema).length;
  const textTokens = Math.ceil(chars / CHARS_PER_TOKEN_UPPER_BOUND);
  const inputPrice = Math.max(price.input, price.cacheWrite5m);
  return (
    ((textTokens + MAX_VISUAL_TOKENS) * inputPrice +
      request.maxOutputTokens * price.output) /
    1_000_000
  );
}

const MAY_HAVE_BEEN_BILLED = new Set(["timeout", "network", "unknown"]);

/** Envolve um provedor de visão com o teto de gasto. */
export function withVisionBudget(
  provider: VisionProvider,
  budget: BudgetController,
  prices: Record<string, ModelPrice> = MODEL_PRICES,
): VisionProvider {
  return {
    id: provider.id,
    model: provider.model,
    async analyze(request: VisionRequest): Promise<VisionResponse> {
      const price = prices[provider.model];
      if (!price)
        throw new AiProviderError(
          "budget",
          `Sem preço conhecido para ${provider.model}: gasto não controlável.`,
        );
      const worst = visionWorstCaseUsd(request, price);
      if (!budget.reserve(worst))
        throw new AiProviderError(
          "budget",
          "Teto de gasto da análise visual atingido; chamada não realizada.",
        );
      let response: VisionResponse;
      try {
        response = await provider.analyze(request);
      } catch (error) {
        const err =
          error instanceof AiProviderError
            ? error
            : new AiProviderError("unknown", String(error));
        const charged = MAY_HAVE_BEEN_BILLED.has(err.kind) ? worst : 0;
        budget.settle(worst, charged);
        throw new AiProviderError(err.kind, err.message, charged);
      }
      const actual =
        estimateCostUsd(response.model, response.usage, prices) ?? worst;
      budget.settle(worst, actual);
      return response;
    },
  };
}
