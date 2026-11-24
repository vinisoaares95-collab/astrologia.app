"use server";

/**
 * Capítulos 1 a 5 a partir dos dados de nascimento (Fase 04C).
 *
 * Reutiliza o motor existente, sem reinventar nada:
 *   normalizeOnServer (02C) → buildChartView + Swiss Ephemeris (02B/02D)
 *   → buildInterpretation (02E) → libraryReport (02F.2, biblioteca)
 *   → toClientReport (o que o cliente lê).
 *
 * - Sem IA: nenhum provedor é chamado (a biblioteca é a fonte padrão).
 * - Só no ambiente interno: exige SIDERA_INTERNAL_ENGINE=1 (licença AGPL do
 *   Swiss Ephemeris; docs/fase-04a-licenca-motor.md).
 * - Nada é gravado nem enviado a terceiros; a resposta leva só os capítulos
 *   (sem data, hora ou local). Logs: só o tipo do erro.
 */
import { normalizeOnServer } from "../../birth-data/server-normalize";
import type { Issue } from "../../birth-data/contract";
import { isInternalEngineEnabled } from "../../natal-chart/engine-gate";
import type { ClientReport } from "../../interpretation/ai/presentation";
import type { SkyBridge } from "../journey-chapters/bridge";

export type SkyChaptersResult =
  /**
   * `bridge` (04D): metadados mínimos para os capítulos 8 e 9 — ids dos itens
   * apresentados, rótulos já exibidos e polos do motor. Nunca data, hora ou
   * local.
   */
  | { status: "ok"; report: ClientReport; bridge: SkyBridge }
  /** Motor desligado neste ambiente. */
  | { status: "engine-disabled" }
  /** Dados recusados pela mesma normalização da conferência. */
  | { status: "invalid"; issues: Issue[] }
  /** Uma escolha pendente (horário duplicado) não foi feita. */
  | { status: "needs-choice" }
  | { status: "engine-error"; message: string };

/** Mensagens amigáveis por código do motor (nunca a mensagem técnica). */
const ENGINE_MESSAGES: Record<string, string> = {
  DATE_OUT_OF_RANGE:
    "A data está fora do intervalo que o cálculo astronômico suporta.",
  INVALID_DATE: "A data informada não pôde ser usada no cálculo.",
  INVALID_COORDINATES: "As coordenadas da cidade não puderam ser usadas.",
};
const ENGINE_DEFAULT =
  "Não foi possível calcular o mapa natal neste momento. A leitura das mãos não foi afetada.";

export async function generateSkyChaptersAction(
  raw: unknown,
): Promise<SkyChaptersResult> {
  // Verificado antes de qualquer processamento dos dados.
  if (!isInternalEngineEnabled()) return { status: "engine-disabled" };

  const normalized = await normalizeOnServer(raw);
  if (normalized.status === "invalid")
    return { status: "invalid", issues: normalized.issues };
  if (normalized.status !== "ok") return { status: "needs-choice" };

  const [
    { buildChartView },
    { swissEphemeris },
    { ChartError },
    { buildInterpretation },
    { libraryReport },
    { toClientReport },
    { buildSkyBridge },
  ] = await Promise.all([
    import("../../natal-chart/build-chart"),
    import("../../astrology/engine/swiss-ephemeris"),
    import("../../astrology/engine/errors"),
    import("../../interpretation/engine"),
    import("../../interpretation/ai/generate"),
    import("../../interpretation/ai/presentation"),
    import("../journey-chapters/bridge"),
  ]);
  try {
    const chart = buildChartView(normalized.birth, swissEphemeris);
    const interpretation = buildInterpretation(chart);
    const report = libraryReport(
      interpretation,
      "Fase 04C: biblioteca como fonte padrão (sem IA).",
    );
    return {
      status: "ok",
      report: toClientReport(report),
      bridge: buildSkyBridge(interpretation),
    };
  } catch (error) {
    if (error instanceof ChartError)
      return {
        status: "engine-error",
        message: ENGINE_MESSAGES[error.code] ?? ENGINE_DEFAULT,
      };
    // Sem dados pessoais no log: só o tipo do erro.
    console.error(
      "Falha inesperada nos capítulos do céu:",
      (error as Error)?.name,
    );
    return { status: "engine-error", message: ENGINE_DEFAULT };
  }
}
