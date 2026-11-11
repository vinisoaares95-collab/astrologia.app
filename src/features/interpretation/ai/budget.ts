/**
 * Teto de gasto para chamadas pagas (Fase 02F.1).
 *
 * Antes de cada chamada, reserva o PIOR custo possível (entrada estimada
 * com folga, cobrada ao preço de escrita em cache, e todos os tokens de
 * saída permitidos). Se a reserva estourar o teto, a chamada nem é feita.
 * Depois, troca a reserva pelo custo calculado com o consumo real.
 * Falhas sem consumo informado que podem ter sido cobradas (timeout, rede,
 * erro desconhecido) ficam com o custo do pior caso.
 */
import {
  AiProviderError,
  type AiProvider,
  type AiRequest,
  type AiResponse,
} from "./contract";
import { estimateCostUsd, MODEL_PRICES, type ModelPrice } from "./pricing";

/** Limite conservador de tokens de entrada: 1 token a cada 2 caracteres. */
export const CHARS_PER_TOKEN_UPPER_BOUND = 2;

export function worstCaseUsd(request: AiRequest, price: ModelPrice): number {
  const chars =
    request.system.length +
    request.user.length +
    JSON.stringify(request.schema).length;
  const inputTokens = Math.ceil(chars / CHARS_PER_TOKEN_UPPER_BOUND);
  const inputPrice = Math.max(price.input, price.cacheWrite5m);
  return (
    (inputTokens * inputPrice + request.maxOutputTokens * price.output) /
    1_000_000
  );
}

export type Budget = {
  readonly limitUsd: number;
  spentUsd(): number;
  reservedUsd(): number;
  /** Chamadas recusadas por falta de orçamento. */
  blockedCalls(): number;
};

export function createBudget(limitUsd: number) {
  if (!(limitUsd > 0)) throw new Error("O teto de gasto deve ser positivo.");
  let spent = 0;
  let reserved = 0;
  let blocked = 0;
  return {
    limitUsd,
    spentUsd: () => spent,
    reservedUsd: () => reserved,
    blockedCalls: () => blocked,
    /** Reserva sincronamente (seguro com chamadas em paralelo). */
    reserve(amount: number): boolean {
      if (spent + reserved + amount > limitUsd) {
        blocked++;
        return false;
      }
      reserved += amount;
      return true;
    },
    settle(reservedAmount: number, actual: number) {
      reserved -= reservedAmount;
      spent += actual;
    },
  };
}

export type BudgetController = ReturnType<typeof createBudget>;

const MAY_HAVE_BEEN_BILLED = new Set(["timeout", "network", "unknown"]);

/** Envolve um provedor com o teto de gasto. */
export function withBudget(
  provider: AiProvider,
  budget: BudgetController,
  prices: Record<string, ModelPrice> = MODEL_PRICES,
): AiProvider {
  return {
    id: provider.id,
    model: provider.model,
    async generate(request: AiRequest): Promise<AiResponse> {
      const price = prices[provider.model];
      if (!price)
        throw new AiProviderError(
          "budget",
          `Sem preço conhecido para ${provider.model}: gasto não controlável.`,
        );
      const worst = worstCaseUsd(request, price);
      if (!budget.reserve(worst))
        throw new AiProviderError(
          "budget",
          "Teto de gasto da avaliação atingido; chamada não realizada.",
        );

      let response: AiResponse;
      try {
        response = await provider.generate(request);
      } catch (error) {
        const err =
          error instanceof AiProviderError
            ? error
            : new AiProviderError("unknown", String(error));
        const charged = MAY_HAVE_BEEN_BILLED.has(err.kind) ? worst : 0;
        budget.settle(worst, charged);
        throw new AiProviderError(err.kind, err.message, charged);
      }

      // Modelo respondente sem preço: mantém o pior caso como gasto.
      const actual =
        estimateCostUsd(response.model, response.usage, prices) ?? worst;
      budget.settle(worst, actual);
      return response;
    },
  };
}
