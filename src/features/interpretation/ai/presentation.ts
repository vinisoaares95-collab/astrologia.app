/**
 * Apresentação do relatório ao cliente × trilha de auditoria (Fase 02F.2).
 *
 * O cliente recebe o mesmo formato de leitura em todos os capítulos, sem
 * nenhuma mensagem técnica: nada de origem (IA ou biblioteca), motivo de
 * fallback, itemIds, modelo ou custo. Essas informações continuam
 * disponíveis, só internamente, em `auditTrail`.
 */
import type {
  AttemptMetrics,
  GeneratedChapter,
  GeneratedReport,
  GenerationMetrics,
} from "./contract";

export type ClientSection = {
  text: string;
  /** Notas de precisão do sistema (intervalos e ressalvas calculados). */
  notes: string[];
};

export type ClientChapter = {
  number: number;
  title: string;
  introduction: string;
  sections: ClientSection[];
  synthesis: string;
  reflectionQuestions: string[];
  limitations: string[];
};

export type ClientReport = { disclaimer: string; chapters: ClientChapter[] };

export function toClientChapter(c: GeneratedChapter): ClientChapter {
  return {
    number: c.number,
    title: c.title,
    introduction: c.introduction,
    sections: c.sections.map((s) => ({ text: s.text, notes: s.notes })),
    synthesis: c.synthesis,
    reflectionQuestions: c.reflectionQuestions,
    limitations: c.limitations,
  };
}

/** Somente o que o cliente lê. */
export function toClientReport(g: GeneratedReport): ClientReport {
  return {
    disclaimer: g.disclaimer,
    chapters: g.chapters.map(toClientChapter),
  };
}

/** Markdown de leitura do relatório (mesmo layout para IA e biblioteca). */
export function renderClientReport(r: ClientReport): string {
  let md = `_${r.disclaimer}_\n`;
  for (const ch of r.chapters) md += renderClientChapter(ch);
  return md;
}

export function renderClientChapter(
  ch: ClientChapter,
  trace?: (sectionIndex: number) => string,
): string {
  let md = `\n## ${ch.number}. ${ch.title}\n\n${ch.introduction}\n`;
  ch.sections.forEach((s, i) => {
    md += `\n${s.text}\n`;
    if (s.notes.length) md += `\n_${s.notes.join(" ")}_\n`;
    if (trace) md += trace(i);
  });
  md += `\n**Síntese.** ${ch.synthesis}\n\n**Para refletir.**\n${ch.reflectionQuestions.map((q) => `- ${q}`).join("\n")}\n`;
  if (ch.limitations.length)
    md += `\n**Limitações.** ${ch.limitations.join(" ")}\n`;
  return md;
}

export type ChapterAudit = {
  id: GeneratedChapter["id"];
  source: GeneratedChapter["source"];
  fallbackReason: string | null;
  attempts: AttemptMetrics[];
};

/** Uso interno: origem de cada capítulo, motivo do fallback e métricas. */
export function auditTrail(g: GeneratedReport): {
  version: string;
  provider: string;
  model: string;
  chapters: ChapterAudit[];
  totals: GenerationMetrics["totals"];
} {
  return {
    version: g.version,
    provider: g.metrics.provider,
    model: g.metrics.model,
    chapters: g.chapters.map((c) => ({
      id: c.id,
      source: c.source,
      fallbackReason: c.fallbackReason,
      attempts: g.metrics.attempts.filter((a) => a.chapter === c.id),
    })),
    totals: g.metrics.totals,
  };
}
