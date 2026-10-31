/**
 * Preparação para IA (Fase 02E) — SEM integração com nenhum modelo.
 *
 * O payload contém apenas fatos calculados e interpretações já
 * selecionadas pelo motor. O modelo futuro só reescreve em prosa editorial;
 * não escolhe posições, não calcula e não acrescenta temas. A saída esperada
 * é estruturada (JSON) e passa por validateAiOutput antes de ser exibida.
 */
import type { InterpretationReport } from "../contract";

export const AI_PAYLOAD_VERSION = "02e.1";

export const AI_RULES: readonly string[] = [
  "Use somente os itens fornecidos. Não acrescente posições, signos, casas, aspectos, graus ou regências que não estejam nas observações.",
  "Cada parágrafo deve citar em itemIds os itens que o sustentam, todos do mesmo capítulo.",
  "Mantenha a distinção: observações são dados calculados; interpretações são leituras simbólicas da tradição astrológica.",
  "Não apresente interpretações como fatos científicos, diagnósticos, garantias ou previsões. Prefira 'pode', 'tende', 'a tradição associa'.",
  "Itens com certeza 'uncertain' devem manter a ressalva (caveat) de forma explícita.",
  "Respeite as limitações de cada capítulo: não mencione o que não foi considerado como se tivesse sido.",
  "Quando houver tensões narrativas, apresente as tendências como facetas que convivem, sem escolher uma delas.",
  "Português do Brasil, segunda pessoa (você), linguagem neutra quanto a gênero, tom acolhedor e sóbrio.",
];

/** Esquema JSON da saída esperada do modelo. */
export const AI_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["chapters"],
  properties: {
    chapters: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "paragraphs"],
        properties: {
          id: {
            enum: [
              "identidade",
              "emocional",
              "mente",
              "relacionamentos",
              "talentos",
            ],
          },
          paragraphs: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["text", "itemIds"],
              properties: {
                text: { type: "string", minLength: 1 },
                itemIds: {
                  type: "array",
                  minItems: 1,
                  items: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

export type AiPayload = ReturnType<typeof toAiPayload>;

export function toAiPayload(report: InterpretationReport) {
  return {
    version: AI_PAYLOAD_VERSION,
    reportVersion: report.version,
    locale: "pt-BR",
    task: "Redigir os capítulos astrológicos a partir dos itens selecionados.",
    rules: AI_RULES,
    disclaimer: report.disclaimer,
    basis: report.basis,
    chapters: report.chapters.map((c) => ({
      id: c.id,
      number: c.number,
      title: c.title,
      items: c.items.map((i) => ({
        id: i.id,
        certainty: i.certainty,
        observation: i.observation,
        interpretation: i.symbolic,
        caveat: i.caveat,
      })),
      limitations: c.limitations,
      tensions: c.tensions.map((t) => ({ itemIds: t.itemIds, note: t.note })),
    })),
    outputSchema: AI_OUTPUT_SCHEMA,
  };
}
