import type { ReportPart } from "@/content/report-chapters";

/**
 * Base editorial de cada parte (o que o leitor vê como "origem"): cálculo,
 * observação ou síntese, sempre seguidos de interpretação simbólica. Usado no
 * sumário comercial e na leitura do relatório (Fase 04A).
 */
export const PART_BASIS: Record<
  ReportPart["source"],
  { label: string; tone: "celestial" | "neutral" | "accent" }
> = {
  sky: { label: "Cálculo + símbolo", tone: "celestial" },
  hands: { label: "Observação + símbolo", tone: "neutral" },
  journey: { label: "Síntese simbólica", tone: "accent" },
};
