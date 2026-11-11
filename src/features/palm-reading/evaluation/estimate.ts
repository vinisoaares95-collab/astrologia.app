/**
 * Custo da avaliação visual (Fase 03F.1), calculado com as funções REAIS
 * do sistema:
 * - pior caso: `visionWorstCaseUsd` (o mesmo que o orçamento reserva antes
 *   de cada chamada: texto a 2 caracteres por token, imagem no teto de
 *   4 784 tokens, preço de escrita de cache, todo o max_tokens);
 * - esperado: `estimateCostUsd` (o mesmo que acerta o gasto após a resposta)
 *   aplicado a um consumo típico, com a imagem nas dimensões REAIS da foto
 *   preparada (`visualTokens`).
 */
import {
  estimateCostUsd,
  MODEL_PRICES,
  type ModelPrice,
} from "../../interpretation/ai/pricing";
import type { PalmHand } from "../consent";
import { visualTokens } from "../lib/prepare-image";
import { visionWorstCaseUsd } from "../vision/budget";
import type { VisionRequest } from "../vision/contract";
import { buildVisionRequest } from "../vision/prompt";
import { EVAL_VISION_CONDITIONS } from "./config";

/** Caracteres por token no consumo TÍPICO (pt-BR + JSON); pior caso usa 2. */
export const TYPICAL_CHARS_PER_TOKEN = 3.5;
/**
 * Saída típica (JSON da observação ≈ 900 tokens + raciocínio no esforço
 * médio). Hipótese a medir na própria avaliação.
 */
export const TYPICAL_OUTPUT_TOKENS = 2500;
/** Foto típica preparada (retrato 3:4 no teto de tokens visuais). */
export const TYPICAL_PHOTO = { width: 1652, height: 2212 } as const;

export type PhotoDims = { width: number; height: number; hand: PalmHand };

export function evalVisionRequest(hand: PalmHand): VisionRequest {
  return buildVisionRequest(hand, "", {
    maxOutputTokens: EVAL_VISION_CONDITIONS.maxOutputTokens,
    timeoutMs: EVAL_VISION_CONDITIONS.timeoutMs,
  });
}

/** Uma chamada no consumo típico (sem cache: as instruções são curtas). */
export function expectedCallUsd(
  model: string,
  photo: PhotoDims,
  outputTokens = TYPICAL_OUTPUT_TOKENS,
  prices: Record<string, ModelPrice> = MODEL_PRICES,
): number {
  const r = evalVisionRequest(photo.hand);
  const textChars =
    r.system.length + r.text.length + JSON.stringify(r.schema).length;
  const usd = estimateCostUsd(
    model,
    {
      inputTokens:
        Math.ceil(textChars / TYPICAL_CHARS_PER_TOKEN) +
        visualTokens(photo.width, photo.height),
      outputTokens,
      cacheReadInputTokens: 0,
      cacheCreationInputTokens: 0,
    },
    prices,
  );
  if (usd === null) throw new Error(`Sem preço para ${model}.`);
  return usd;
}

/** Uma chamada no pior caso (o valor reservado pelo orçamento). */
export function worstCallUsd(
  model: string,
  hand: PalmHand = "right",
  prices: Record<string, ModelPrice> = MODEL_PRICES,
): number {
  const price = prices[model];
  if (!price) throw new Error(`Sem preço para ${model}.`);
  return visionWorstCaseUsd(evalVisionRequest(hand), price);
}

export type EvalPlan = {
  photos: number;
  maxAttempts: number;
  usdBrl: number;
  budgetBrl: number;
  budgetUsd: number;
  perModel: {
    model: string;
    expectedPerPhotoUsd: number;
    worstPerCallUsd: number;
    /** Pior caso de uma unidade (foto × modelo) com todas as tentativas. */
    worstPerUnitUsd: number;
    expectedUsd: number;
    worstUsd: number;
  }[];
  expectedUsd: number;
  worstUsd: number;
  expectedBrl: number;
  worstBrl: number;
  withinBudget: boolean;
  /** Fotos que cabem no orçamento no pior caso (todos os modelos). */
  photosWithinBudget: number;
  /** Teto da execução: o pior caso planejado, nunca acima do orçamento. */
  safeCapUsd: number;
};

/**
 * Plano financeiro, antes de qualquer chamada. `expected` assume a 1ª
 * tentativa aceita; `worst`, todas as tentativas no pior caso.
 */
export function planEvaluation(input: {
  photos: PhotoDims[];
  models: readonly string[];
  maxAttempts: number;
  usdBrl: number;
  budgetBrl: number;
  prices?: Record<string, ModelPrice>;
}): EvalPlan {
  const prices = input.prices ?? MODEL_PRICES;
  const budgetUsd = input.budgetBrl / input.usdBrl;
  const perModel = input.models.map((model) => {
    const worstPerCallUsd = Math.max(
      worstCallUsd(model, "right", prices),
      worstCallUsd(model, "left", prices),
    );
    const worstPerUnitUsd = worstPerCallUsd * input.maxAttempts;
    const expectedUsd = input.photos.reduce(
      (n, p) => n + expectedCallUsd(model, p, TYPICAL_OUTPUT_TOKENS, prices),
      0,
    );
    return {
      model,
      expectedPerPhotoUsd: input.photos.length
        ? expectedUsd / input.photos.length
        : expectedCallUsd(
            model,
            { ...TYPICAL_PHOTO, hand: "right" },
            TYPICAL_OUTPUT_TOKENS,
            prices,
          ),
      worstPerCallUsd,
      worstPerUnitUsd,
      expectedUsd,
      worstUsd: worstPerUnitUsd * input.photos.length,
    };
  });
  const expectedUsd = perModel.reduce((n, m) => n + m.expectedUsd, 0);
  const worstUsd = perModel.reduce((n, m) => n + m.worstUsd, 0);
  const worstPerPhoto = perModel.reduce((n, m) => n + m.worstPerUnitUsd, 0);
  return {
    photos: input.photos.length,
    maxAttempts: input.maxAttempts,
    usdBrl: input.usdBrl,
    budgetBrl: input.budgetBrl,
    budgetUsd,
    perModel,
    expectedUsd,
    worstUsd,
    expectedBrl: expectedUsd * input.usdBrl,
    worstBrl: worstUsd * input.usdBrl,
    withinBudget: worstUsd <= budgetUsd,
    photosWithinBudget:
      worstPerPhoto > 0 ? Math.floor(budgetUsd / worstPerPhoto) : 0,
    safeCapUsd: Math.min(worstUsd, budgetUsd),
  };
}
