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
import { repairCrossReferences } from "../../interpretation/ai/validate";
import type {
  PalmChapter,
  PalmChapterId,
  PalmReport,
} from "../analysis/engine";
import { PARTIAL_CAVEAT } from "../analysis/library";
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

const UNAVAILABLE: Record<PalmChapterId, string> = {
  maos: "Nesta foto, o formato da mão não pôde ser observado com segurança, então esta parte da leitura não foi feita. Uma nova foto, com a mão inteira no quadro, dedos levemente afastados e luz natural, pode permitir esta leitura.",
  linhas:
    "Nesta foto, nenhuma linha da palma pôde ser observada com segurança, então esta parte da leitura não foi feita. Uma nova foto, com a palma bem aberta, de frente para a câmera e com luz natural sem reflexos, pode permitir esta leitura.",
};

/** Observações e ressalvas do SISTEMA para cada seção. */
function sectionsOf(
  chapter: PalmChapter,
  draft: ChapterDraft,
): PalmGeneratedSection[] {
  const items = new Map(chapter.items.map((i) => [i.id, i]));
  const shownObservations = new Set<string>();
  let caveats = 0;
  return draft.sections.map((s) => {
    const cited = s.itemIds.map((id) => items.get(id)!).filter(Boolean);
    const observed = cited
      .map((i) => i.observation)
      .filter((o) => !shownObservations.has(o));
    observed.forEach((o) => shownObservations.add(o));
    const uncertain = cited.some((i) => i.certainty === "uncertain");
    const notes = uncertain
      ? [caveats++ === 0 ? PARTIAL_CAVEAT : REPEATED_PARTIAL]
      : [];
    return {
      text: s.text.trim(),
      itemIds: s.itemIds,
      factIds: [...new Set(cited.flatMap((i) => i.factIds))],
      observed,
      notes,
    };
  });
}

/** Segunda ressalva do capítulo, mais curta (sem repetição literal). */
const REPEATED_PARTIAL =
  "Aqui também a característica ficou só parcialmente visível; vale a mesma reserva.";

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

function unavailable(chapter: PalmChapter): PalmGeneratedChapter {
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
    unavailableMessage: UNAVAILABLE[chapter.id],
    source: "none",
    fallbackReason: "Capítulo sem características observadas.",
  };
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
      if (chapter.items.length === 0) return unavailable(chapter);
      const outcome = await generateValidatedDraft<ChapterDraft, PalmChapterId>(
        {
          chapter: chapter.id,
          request: buildPalmChapterRequest(chapter, {
            maxOutputTokens: opts.maxOutputTokens,
            timeoutMs: opts.timeoutMs,
          }),
          provider,
          validate: (draft) => validatePalmChapterDraft(draft, chapter, report),
          repair: repairCrossReferences,
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
