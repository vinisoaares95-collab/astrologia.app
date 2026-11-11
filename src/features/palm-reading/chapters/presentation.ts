/**
 * Capítulos 6 e 7 para o cliente × auditoria interna (Fase 03E).
 *
 * O cliente recebe o mesmo formato para texto da IA e da biblioteca, sem
 * origem, motivo de reserva, itemIds, modelo nem custo. A observação da foto
 * vem separada da interpretação (`observed`), e as ressalvas do sistema em
 * `notes`. A auditoria guarda o resto, só no servidor.
 */
import type { AttemptMetrics } from "../../interpretation/ai/contract";
import type { PalmChapterId, PalmReport } from "../analysis/engine";
import type { ReadingStatus } from "../analysis/validate-observation";
import type { PalmGeneratedChapter, PalmGeneratedReport } from "./contract";

export type ClientPalmSection = {
  text: string;
  observed: string[];
  notes: string[];
};

export type ClientPalmChapter = {
  number: 6 | 7;
  title: string;
  status: "content" | "unavailable";
  introduction: string;
  sections: ClientPalmSection[];
  synthesis: string;
  reflectionQuestions: string[];
  limitations: string[];
  unavailableMessage: string | null;
};

/** O que o endpoint devolve ao navegador. */
export type PalmAnalysisResult = {
  status: ReadingStatus;
  /** Sugerir nova foto: insuficiente, ou parcial com pouco observado. */
  retakeRecommended: boolean;
  /** Provedores simulados: nada foi realmente observado na foto. */
  simulated: boolean;
  disclaimer: string;
  chapters: ClientPalmChapter[];
};

/** Menos que isto observado → sugerir nova foto mesmo com leitura parcial. */
const MIN_OBSERVED_FOR_PARTIAL = 3;

export function toClientPalmChapter(
  c: PalmGeneratedChapter,
): ClientPalmChapter {
  return {
    number: c.number,
    title: c.title,
    status: c.status,
    introduction: c.introduction,
    sections: c.sections.map((s) => ({
      text: s.text,
      observed: s.observed,
      notes: s.notes,
    })),
    synthesis: c.synthesis,
    reflectionQuestions: c.reflectionQuestions,
    limitations: c.limitations,
    unavailableMessage: c.unavailableMessage,
  };
}

export function toClientPalmResult(
  report: PalmReport,
  generated: PalmGeneratedReport,
  simulated: boolean,
): PalmAnalysisResult {
  const observed = report.facts.filter((f) => f.id !== "hand.type").length;
  return {
    status: report.status,
    retakeRecommended:
      report.status === "insufficient" ||
      (report.status === "partial" && observed < MIN_OBSERVED_FOR_PARTIAL),
    simulated,
    disclaimer: generated.disclaimer,
    chapters: generated.chapters.map(toClientPalmChapter),
  };
}

/** Uso interno: origem de cada capítulo, motivo da reserva e tentativas. */
export function palmAuditTrail(g: PalmGeneratedReport): {
  version: string;
  chapters: {
    id: PalmChapterId;
    source: PalmGeneratedChapter["source"];
    fallbackReason: string | null;
    sections: { itemIds: string[]; factIds: string[] }[];
    attempts: AttemptMetrics<PalmChapterId>[];
  }[];
} {
  return {
    version: g.version,
    chapters: g.chapters.map((c) => ({
      id: c.id,
      source: c.source,
      fallbackReason: c.fallbackReason,
      sections: c.sections.map((s) => ({
        itemIds: s.itemIds,
        factIds: s.factIds,
      })),
      attempts: g.attempts.filter((a) => a.chapter === c.id),
    })),
  };
}
