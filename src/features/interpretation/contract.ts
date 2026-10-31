/**
 * Contrato do motor de interpretação (Fase 02E).
 *
 * Separação obrigatória:
 * - Fact.observation: o que foi CALCULADO (verificável, astronômico);
 * - InterpretationItem.symbolic: o que a TRADIÇÃO associa (simbólico).
 * Toda interpretação aponta para os fatos que a originaram (factIds) e cada
 * fato aponta para os campos do ChartView de onde veio (source).
 */
import type { AspectType, Body, Sign } from "../astrology/domain/types";

export type ChapterId =
  "identidade" | "emocional" | "mente" | "relacionamentos" | "talentos";

export type Certainty = "determined" | "uncertain";

export type FactKind =
  | "body-sign"
  | "body-house"
  | "body-retrograde"
  | "angle-sign"
  | "cusp-sign"
  | "aspect"
  | "chart-ruler"
  | "element-dominant"
  | "element-absent";

export type Fact = {
  /** Id estável, ex.: "body-sign:sun", "aspect:saturn-sun:trine". */
  id: string;
  kind: FactKind;
  certainty: Certainty;
  /** Elementos astrológicos envolvidos (para regras e deduplicação). */
  bodies: (Body | "asc" | "mc")[];
  sign?: Sign;
  house?: number;
  aspect?: { type: AspectType; orb: number; applying: boolean | null };
  /** Valores numéricos/categóricos copiados do cálculo. */
  values: Record<string, string | number | boolean | null>;
  /** Caminhos no ChartView que originaram o fato. */
  source: string[];
  /** Frase astronômica verificável, gerada só a partir de `values`. */
  observation: string;
};

export type InterpretationItem = {
  /** Id estável do item no relatório (capítulo + chave). */
  id: string;
  /** Chave editorial usada (autoral ou composta). */
  entryKey: string;
  origin: "authored" | "composed";
  factIds: string[];
  certainty: Certainty;
  observation: string;
  symbolic: string;
  /** Aviso quando o fato é incerto (ex.: aspecto que depende do horário). */
  caveat: string | null;
  score: number;
  tags: string[];
};

export type NarrativeTension = {
  axis: string;
  itemIds: [string, string];
  note: string;
};

export type ChapterInterpretation = {
  id: ChapterId;
  number: number;
  title: string;
  items: InterpretationItem[];
  /** O que não pôde ser considerado e por quê (horário, casas, signos incertos). */
  limitations: string[];
  tensions: NarrativeTension[];
};

export type InterpretationReport = {
  version: string;
  disclaimer: string;
  chapters: ChapterInterpretation[];
  /** Todos os fatos extraídos (inclusive os não usados), para auditoria. */
  facts: Fact[];
  basis: {
    precision: "exact" | "approximate" | "unknown";
    calcVersion: string;
    houseSystem: string;
    zodiac: string;
    rulership: "traditional";
  };
};
