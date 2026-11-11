/**
 * Capítulos 6 e 7 gerados (Fase 03E).
 *
 * Mesmo formato de rascunho dos capítulos astrológicos (`ChapterDraft`), com
 * duas diferenças de apresentação, ambas preenchidas pelo SISTEMA, nunca pelo
 * modelo:
 * - `observed`: o que foi observado na foto (frases da 03C), mostrado
 *   separado da interpretação;
 * - `notes`: ressalvas de características só parcialmente visíveis.
 */
import type {
  AttemptMetrics,
  ChapterDraft,
} from "../../interpretation/ai/contract";
import type { PalmChapterId } from "../analysis/engine";
import type { ReadingStatus } from "../analysis/validate-observation";

export type { ChapterDraft };

export type PalmGeneratedSection = {
  text: string;
  /** Itens da 03C que sustentam o texto (auditoria). */
  itemIds: string[];
  /** Características observadas por trás dos itens (auditoria). */
  factIds: string[];
  /** Frases de observação do sistema (o que a foto mostrou). */
  observed: string[];
  /** Ressalvas do sistema (característica parcial). */
  notes: string[];
};

export type PalmGeneratedChapter = {
  id: PalmChapterId;
  number: 6 | 7;
  title: string;
  /**
   * "content": capítulo redigido (IA ou biblioteca).
   * "unavailable": não há o que interpretar; só a explicação e a orientação.
   */
  status: "content" | "unavailable";
  introduction: string;
  sections: PalmGeneratedSection[];
  synthesis: string;
  reflectionQuestions: string[];
  /** Limitações do motor 03C, copiadas literalmente. */
  limitations: string[];
  /** Mensagem do capítulo indisponível (com orientação de nova foto). */
  unavailableMessage: string | null;
  /** Interno: "ai", "library" ou "none" (indisponível). */
  source: "ai" | "library" | "none";
  /** Interno: por que a biblioteca foi usada. */
  fallbackReason: string | null;
};

export type PalmGeneratedReport = {
  version: string;
  disclaimer: string;
  status: ReadingStatus;
  chapters: [PalmGeneratedChapter, PalmGeneratedChapter];
  attempts: AttemptMetrics<PalmChapterId>[];
};
