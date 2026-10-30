"use server";

import type { NormalizationResult } from "../birth-data/contract";
import { normalizeOnServer } from "../birth-data/server-normalize";
import type { ChartResult } from "./contract";
import { isInternalEngineEnabled } from "./engine-gate";

export type ComputeChartResult =
  ChartResult | Exclude<NormalizationResult, { status: "ok" }>;

/**
 * Normaliza os dados (mesmo código da conferência) e calcula o mapa no
 * servidor. Nada é persistido nem registrado; nenhum dado sai do servidor.
 */
export async function computeChartAction(
  raw: unknown,
): Promise<ComputeChartResult> {
  // Verificado antes de qualquer processamento dos dados.
  if (!isInternalEngineEnabled()) return { status: "engine-disabled" };

  const normalized = await normalizeOnServer(raw);
  if (normalized.status !== "ok") return normalized;

  const [{ buildChartView }, { swissEphemeris }, { ChartError }] =
    await Promise.all([
      import("./build-chart"),
      import("../astrology/engine/swiss-ephemeris"),
      import("../astrology/engine/errors"),
    ]);
  try {
    return {
      status: "ok",
      chart: buildChartView(normalized.birth, swissEphemeris),
    };
  } catch (error) {
    if (error instanceof ChartError) {
      return {
        status: "engine-error",
        code: error.code,
        message: error.message,
      };
    }
    // Sem dados pessoais no log: só o tipo do erro.
    console.error(
      "Falha inesperada no cálculo do mapa:",
      (error as Error)?.name,
    );
    return {
      status: "engine-error",
      code: "ENGINE_FAILURE",
      message: "Não foi possível calcular o mapa. Tente novamente.",
    };
  }
}
