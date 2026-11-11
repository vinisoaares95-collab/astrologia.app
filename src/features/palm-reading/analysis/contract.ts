/**
 * Contrato das observações visuais da palma (Fase 03C).
 *
 * Uma observação descreve só o que é VISÍVEL numa fotografia comum da palma,
 * em categorias fechadas e grosseiras. Não há medidas em milímetros,
 * ângulos, contagens finas nem classificação anatômica: uma foto de celular
 * não sustenta esse grau de precisão.
 *
 * Três regras do contrato:
 * - cada característica tem visibilidade categórica ("clear", "partial" ou
 *   "not_visible"). Não é uma probabilidade calibrada e não há campo
 *   numérico de confiança;
 * - toda característica usada precisa de evidência visual descritiva
 *   (onde ela está na foto);
 * - sem evidência, a característica é "not_visible", nunca um palpite.
 *
 * Este módulo não conhece nenhum provedor de IA: é o formato que a futura
 * extração visual (03D) deverá preencher e que o validador confere.
 */
import type { PalmHand } from "../consent";

export const OBSERVATION_VERSION = "03c.1";

export const VISIBILITIES = ["clear", "partial", "not_visible"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

/** Problemas de imagem que a extração pode apontar. */
export const IMAGE_ISSUES = [
  "too_dark",
  "overexposed",
  "glare",
  "blurry",
  "hand_cropped",
  "hand_closed",
  "angled",
  "obstruction",
  "back_of_hand",
  "multiple_hands",
  "not_a_hand",
] as const;
export type ImageIssue = (typeof IMAGE_ISSUES)[number];

/** Problemas que tornam qualquer leitura da palma impossível. */
export const BLOCKING_ISSUES: readonly ImageIssue[] = [
  "back_of_hand",
  "multiple_hands",
  "not_a_hand",
  "hand_closed",
];

export const IMAGE_QUALITIES = ["adequate", "limited", "insufficient"] as const;
export type ImageQuality = (typeof IMAGE_QUALITIES)[number];

/**
 * Categorias observáveis, por característica. Conservadoras de propósito:
 * poucas opções, todas distinguíveis a olho numa foto boa.
 */
export const FEATURE_VALUES = {
  /** Proporção da palma: largura parecida com o comprimento, ou mais longa. */
  "hand.palmShape": ["square", "rectangular"],
  /** Comprimento dos dedos em relação ao comprimento da palma. */
  "hand.fingerLength": ["short", "medium", "long"],
  /** Até onde a linha do coração se estende sob os dedos. */
  "heart.length": ["short", "medium", "long"],
  /** Se a linha do coração termina reta ou curvando para cima. */
  "heart.shape": ["straight", "curved"],
  /** Até onde a linha da cabeça atravessa a palma. */
  "head.length": ["short", "medium", "long"],
  /** Se a linha da cabeça segue reta ou desce em direção ao pulso. */
  "head.slope": ["straight", "sloping"],
  /** Se a linha da cabeça começa unida à da vida ou separada dela. */
  "head.start": ["joined_life", "separate"],
  /**
   * Quanto a linha da vida se afasta do polegar no seu arco. Não há
   * "comprimento" da linha da vida neste contrato: a tradição popular o
   * associa à duração da vida, e o Sidera nunca faz essa leitura.
   */
  "life.arc": ["wide", "close"],
  /** Linha do destino: só a presença, e só quando nítida. */
  "fate.presence": ["present"],
} as const;

export type FeatureId = keyof typeof FEATURE_VALUES;
export type FeatureValue<F extends FeatureId> =
  (typeof FEATURE_VALUES)[F][number];

export const FEATURE_IDS = Object.keys(FEATURE_VALUES) as FeatureId[];

/** Partes do relatório a que cada característica pertence. */
export const FEATURE_GROUP: Record<
  FeatureId,
  "hand" | "heart" | "head" | "life" | "fate"
> = {
  "hand.palmShape": "hand",
  "hand.fingerLength": "hand",
  "heart.length": "heart",
  "heart.shape": "heart",
  "head.length": "head",
  "head.slope": "head",
  "head.start": "head",
  "life.arc": "life",
  "fate.presence": "fate",
};

/** Por que uma característica não pôde ser observada. */
export const NOT_VISIBLE_REASONS = [
  "out_of_frame",
  "too_faint",
  "obscured",
  "image_quality",
  "ambiguous",
] as const;
export type NotVisibleReason = (typeof NOT_VISIBLE_REASONS)[number];

/** Característica observada (com evidência) ou não visível (sem valor). */
export type FeatureObservation<F extends FeatureId = FeatureId> =
  | {
      visibility: "clear" | "partial";
      value: FeatureValue<F>;
      /** Onde a característica aparece na foto (uso interno, auditoria). */
      evidence: string;
    }
  | { visibility: "not_visible"; reason: NotVisibleReason };

/** O que a extração visual devolve (formato de entrada do validador). */
export type PalmObservation = {
  version: typeof OBSERVATION_VERSION;
  hand: PalmHand;
  image: { quality: ImageQuality; issues: ImageIssue[] };
  features: { [F in FeatureId]: FeatureObservation<F> };
};

/** Limites do texto de evidência. */
export const EVIDENCE_MIN_CHARS = 20;
export const EVIDENCE_MAX_CHARS = 160;
