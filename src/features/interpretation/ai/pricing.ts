/**
 * Preços oficiais por milhão de tokens (USD), usados para estimar o custo
 * de cada chamada a partir do consumo REAL devolvido pela API (usage).
 *
 * Fonte: https://platform.claude.com/docs/en/about-claude/pricing
 * (consultada em 31/10/2026). Atualize esta tabela quando os preços mudarem.
 */
import type { AiUsage } from "./contract";

export type ModelPrice = {
  input: number;
  output: number;
  cacheWrite5m: number;
  cacheRead: number;
};

export const PRICES_CHECKED_AT = "2026-10-31";

export const MODEL_PRICES: Record<string, ModelPrice> = {
  "claude-opus-5-5": { input: 4, output: 20, cacheWrite5m: 5, cacheRead: 0.2 },
  "claude-sonnet-5-5": {
    input: 2,
    output: 10,
    cacheWrite5m: 2.5,
    cacheRead: 0.1,
  },
  // Preços para prompts de até 100 mil tokens (nossas chamadas têm poucos mil).
  "claude-haiku-5-5": {
    input: 0.1,
    output: 0.5,
    cacheWrite5m: 0.125,
    cacheRead: 0.01,
  },
  // Simulação local: custo zero por definição.
  "mock-local": { input: 0, output: 0, cacheWrite5m: 0, cacheRead: 0 },
};

/** Custo em USD, ou null quando o modelo não está na tabela. */
export function estimateCostUsd(model: string, usage: AiUsage): number | null {
  const p = MODEL_PRICES[model];
  if (!p) return null;
  const perToken = (usd: number) => usd / 1_000_000;
  return (
    usage.inputTokens * perToken(p.input) +
    usage.outputTokens * perToken(p.output) +
    usage.cacheCreationInputTokens * perToken(p.cacheWrite5m) +
    usage.cacheReadInputTokens * perToken(p.cacheRead)
  );
}
