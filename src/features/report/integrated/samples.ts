import "server-only";

/**
 * Dados de EXEMPLO para a demonstração interna do relatório (Fase 04A).
 *
 * Nada aqui vem de uma pessoa real, de uma foto ou de uma chamada de IA:
 * - Parte I: relatórios da biblioteca já versionados como fixtures da 02F.2
 *   (mapa de exemplo, horário exato, aproximado e desconhecido);
 * - Parte II: observações FICTÍCIAS da 03C (escritas à mão), passadas pelo
 *   motor das mãos e pela biblioteca, com um provedor simulado que sempre
 *   falha (força o texto determinístico; nenhuma rede);
 * - Parte III: sem motor; só títulos e resumos de `reportParts`.
 * Os textos são exatamente os que os motores produzem; nada é reescrito.
 */
import approximate from "../../interpretation/ai/__fixtures__/library-report.approximate.json";
import exact from "../../interpretation/ai/__fixtures__/library-report.exact.json";
import unknown from "../../interpretation/ai/__fixtures__/library-report.unknown.json";
import type { GeneratedReport } from "../../interpretation/ai/contract";
import { toClientReport } from "../../interpretation/ai/presentation";
import {
  clearHand,
  insufficientPhoto,
  partialHand,
} from "../../palm-reading/analysis/__fixtures__/observations";
import { validatePalmObservation } from "../../palm-reading/analysis/validate-observation";
import { composePalmReading } from "../../palm-reading/chapters/compose";
import { createMockPalmTextProvider } from "../../palm-reading/chapters/mock-text-provider";
import type { HandsInput, SkyInput } from "./build";

export const SAMPLE_SCENARIOS = [
  { id: "completo", label: "Completo" },
  { id: "parcial", label: "Leitura parcial" },
  { id: "insuficiente", label: "Foto insuficiente" },
  { id: "sem-maos", label: "Sem leitura das mãos" },
  { id: "sem-ceu", label: "Mapa indisponível" },
  { id: "carregando", label: "Carregando" },
] as const;
export type SampleScenario = (typeof SAMPLE_SCENARIOS)[number]["id"];

export const isSampleScenario = (v: unknown): v is SampleScenario =>
  SAMPLE_SCENARIOS.some((s) => s.id === v);

const sky = (g: unknown): SkyInput => ({
  state: "ready",
  report: toClientReport(g as GeneratedReport),
});

async function hands(raw: { hand: "right" | "left" }): Promise<HandsInput> {
  const check = validatePalmObservation(raw, raw.hand);
  if (!check.ok) throw new Error("Observação de exemplo inválida.");
  const { result } = await composePalmReading({
    observation: check.observation,
    // Sempre falha → capítulos da biblioteca (sem rede, sem custo).
    textProvider: createMockPalmTextProvider(["error:unavailable"]),
    simulated: true,
  });
  return { state: "ready", result };
}

export async function sampleInputs(
  scenario: SampleScenario,
): Promise<{ sky: SkyInput; hands: HandsInput }> {
  switch (scenario) {
    case "completo":
      return { sky: sky(exact), hands: await hands(clearHand()) };
    case "parcial":
      return { sky: sky(approximate), hands: await hands(partialHand()) };
    case "insuficiente":
      return { sky: sky(unknown), hands: await hands(insufficientPhoto()) };
    case "sem-maos":
      return {
        sky: sky(exact),
        hands: {
          state: "absent",
          reason: "A leitura das mãos não foi feita nesta sessão.",
        },
      };
    case "sem-ceu":
      return {
        sky: {
          state: "unavailable",
          reason:
            "O mapa natal não pôde ser calculado neste ambiente. Os capítulos do céu dependem do cálculo astronômico.",
        },
        hands: await hands(clearHand()),
      };
    case "carregando":
      return { sky: { state: "loading" }, hands: { state: "loading" } };
  }
}
