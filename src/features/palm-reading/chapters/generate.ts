/**
 * Geração dos capítulos 6 e 7 (Fase 03E).
 *
 * Usa o mesmo núcleo da astrologia (interpretation/ai/generate-core.ts):
 * requisição → provedor de texto → JSON → validador da quiromancia → reparo
 * de referências cruzadas na última tentativa → nova tentativa com
 * correções. Se nada passar, usa a versão da biblioteca 03C. Capítulo sem
 * itens não é gerado: vira "indisponível", com a limitação e a orientação.
 */
import type { AiProvider } from "../../interpretation/ai/contract";
import { generateValidatedDraft } from "../../interpretation/ai/generate-core";
import {
  repairCrossReferences,
  type AiValidationError,
} from "../../interpretation/ai/validate";
import type {
  PalmChapter,
  PalmChapterId,
  PalmReport,
} from "../analysis/engine";
import type { FeatureId } from "../analysis/contract";
import { partialNote, unavailableMessage } from "../analysis/phrasing";
import type {
  ChapterDraft,
  PalmGeneratedChapter,
  PalmGeneratedReport,
  PalmGeneratedSection,
} from "./contract";
import { palmLibraryDraft } from "./library-draft";
import { buildPalmChapterRequest, PALM_PROMPT_VERSION } from "./prompt";
import { validatePalmChapterDraft } from "./validate";

export const PALM_MAX_ATTEMPTS = 2;

export type PalmGenerateOptions = {
  maxAttempts?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  now?: () => number;
};

/** Observações e ressalvas do SISTEMA para cada seção. */
function sectionsOf(
  chapter: PalmChapter,
  draft: ChapterDraft,
): PalmGeneratedSection[] {
  const items = new Map(chapter.items.map((i) => [i.id, i]));
  const shownObservations = new Set<string>();
  // Uma só ressalva de parcialidade no capítulo (03F.2), na primeira seção
  // com característica parcial, nomeando todas as parciais do capítulo.
  const partial = [
    ...new Set(
      chapter.items
        .filter((i) => i.certainty === "uncertain")
        .flatMap((i) => i.factIds)
        .filter((f): f is FeatureId => f !== "hand.type"),
    ),
  ];
  let noted = false;
  return draft.sections.map((s) => {
    const cited = s.itemIds.map((id) => items.get(id)!).filter(Boolean);
    const observed = cited
      .map((i) => i.observation)
      .filter((o) => !shownObservations.has(o));
    observed.forEach((o) => shownObservations.add(o));
    const uncertain = cited.some((i) => i.certainty === "uncertain");
    const notes =
      uncertain && !noted && partial.length ? [partialNote(partial)] : [];
    if (notes.length) noted = true;
    return {
      text: s.text.trim(),
      itemIds: s.itemIds,
      factIds: [...new Set(cited.flatMap((i) => i.factIds))],
      observed,
      notes,
    };
  });
}

function chapterOf(
  chapter: PalmChapter,
  draft: ChapterDraft,
  source: "ai" | "library",
  fallbackReason: string | null,
): PalmGeneratedChapter {
  return {
    id: chapter.id,
    number: chapter.number,
    title: chapter.title,
    status: "content",
    introduction: draft.introduction.trim(),
    sections: sectionsOf(chapter, draft),
    synthesis: draft.synthesis.trim(),
    reflectionQuestions: draft.reflectionQuestions.map((q) => q.trim()),
    limitations: chapter.limitations,
    unavailableMessage: null,
    source,
    fallbackReason,
  };
}

function unavailable(
  chapter: PalmChapter,
  report: PalmReport,
): PalmGeneratedChapter {
  return {
    id: chapter.id,
    number: chapter.number,
    title: chapter.title,
    status: "unavailable",
    introduction: "",
    sections: [],
    synthesis: "",
    reflectionQuestions: [],
    limitations: chapter.limitations,
    unavailableMessage: unavailableMessage(
      chapter.id,
      chapter.unused,
      report.issues,
      report.status === "insufficient",
    ),
    source: "none",
    fallbackReason: "Capítulo sem características observadas.",
  };
}

/**
 * Reparos determinísticos na última tentativa, sempre seguidos de nova
 * validação completa: referências cruzadas (02F.2) ou remoção de seções que
 * só retomam itens já interpretados (03F.2) — nada é acrescentado ao texto.
 */
export function repairPalmDraft(
  draft: unknown,
  errors: AiValidationError[],
): { draft: unknown; repairs: string[] } | null {
  if (!errors.length) return null;
  if (errors.every((e) => e.code === "REDUNDANT_SECTION")) {
    const drop = new Set(errors.map((e) => Number(e.part?.split(".")[1])));
    const copy = structuredClone(draft) as { sections: unknown[] };
    if (!Array.isArray(copy?.sections)) return null;
    copy.sections = copy.sections.filter((_, i) => !drop.has(i));
    return {
      draft: copy,
      repairs: [...drop].map((i) => `sections.${i}: seção redundante removida`),
    };
  }
  return repairCrossReferences(draft, errors);
}

export async function generatePalmChapters(
  report: PalmReport,
  provider: AiProvider,
  options: PalmGenerateOptions = {},
): Promise<PalmGeneratedReport> {
  const opts = {
    maxAttempts: Math.max(
      1,
      Math.min(options.maxAttempts ?? PALM_MAX_ATTEMPTS, 3),
    ),
    maxOutputTokens: options.maxOutputTokens ?? 4000,
    timeoutMs: options.timeoutMs ?? 60_000,
    now: options.now ?? (() => performance.now()),
  };
  const attempts: PalmGeneratedReport["attempts"] = [];
  const chapters = await Promise.all(
    report.chapters.map(async (chapter) => {
      if (chapter.items.length === 0) return unavailable(chapter, report);
      const outcome = await generateValidatedDraft<ChapterDraft, PalmChapterId>(
        {
          chapter: chapter.id,
          request: buildPalmChapterRequest(chapter, {
            maxOutputTokens: opts.maxOutputTokens,
            timeoutMs: opts.timeoutMs,
          }),
          provider,
          validate: (draft) => validatePalmChapterDraft(draft, chapter, report),
          repair: repairPalmDraft,
          maxAttempts: opts.maxAttempts,
          now: opts.now,
          metrics: attempts,
        },
      );
      return outcome.ok
        ? chapterOf(chapter, outcome.draft, "ai", null)
        : chapterOf(
            chapter,
            palmLibraryDraft(chapter),
            "library",
            outcome.reason,
          );
    }),
  );
  attempts.sort(
    (a, b) =>
      (a.chapter === b.chapter ? 0 : a.chapter === "maos" ? -1 : 1) ||
      a.attempt - b.attempt,
  );
  return {
    version: `${report.version}+${PALM_PROMPT_VERSION}`,
    disclaimer: report.disclaimer,
    status: report.status,
    chapters: chapters as PalmGeneratedReport["chapters"],
    attempts,
  };
}
