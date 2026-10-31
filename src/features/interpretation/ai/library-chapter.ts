/**
 * Capítulo determinístico (sem IA), usado como alternativa segura quando a
 * geração falha ou não está habilitada. Monta o mesmo formato do capítulo
 * gerado a partir dos textos da biblioteca editorial (02E), marcado com
 * source: "library".
 */
import type { ChapterId, InterpretationReport } from "../contract";
import type {
  ChapterDraft,
  GeneratedChapter,
  GeneratedSection,
} from "./contract";

const INTRODUCTIONS: Record<ChapterId, string> = {
  identidade:
    "Este capítulo reúne os elementos do mapa que a tradição astrológica associa ao núcleo da identidade e à forma de se colocar no mundo.",
  emocional:
    "Aqui estão os elementos que a tradição liga às necessidades emocionais, ao acolhimento e ao modo de reagir ao que se sente.",
  mente:
    "Este capítulo trata do que a tradição associa ao jeito de pensar, aprender e se comunicar.",
  relacionamentos:
    "Aqui aparecem os elementos que a tradição relaciona aos afetos, ao desejo e à forma de construir vínculos.",
  talentos:
    "Este capítulo reúne o que a tradição associa a recursos que podem ser cultivados e a desafios que pedem amadurecimento.",
};

const SYNTHESES: Record<ChapterId, string> = {
  identidade:
    "Em conjunto, esses elementos descrevem facetas simbólicas da identidade; vale observar quais delas fazem sentido na sua experiência.",
  emocional:
    "Juntos, esses temas oferecem uma leitura simbólica da vida emocional, para ser confrontada com o que você reconhece em si.",
  mente:
    "Em conjunto, esses elementos sugerem um estilo de pensar e se comunicar que você pode reconhecer, ajustar ou questionar.",
  relacionamentos:
    "Juntos, esses temas compõem uma leitura simbólica dos vínculos, como ponto de partida para reflexão e não como regra.",
  talentos:
    "Em conjunto, talentos e desafios aparecem aqui como possibilidades simbólicas, que ganham forma com escolhas e experiência.",
};

const QUESTIONS: Record<ChapterId, string[]> = {
  identidade: [
    "Em que situações você se sente mais você?",
    "Qual dessas descrições combina menos com a sua experiência, e por quê?",
  ],
  emocional: [
    "O que costuma trazer segurança emocional no seu dia a dia?",
    "Como você percebe quando precisa de acolhimento?",
  ],
  mente: [
    "Em que contextos você aprende com mais prazer?",
    "Como você prefere organizar uma ideia antes de compartilhá-la?",
  ],
  relacionamentos: [
    "O que faz você se sentir à vontade em um vínculo?",
    "Que equilíbrio entre proximidade e espaço próprio parece bom para você hoje?",
  ],
  talentos: [
    "Que habilidade você exerce com naturalidade e poderia valorizar mais?",
    "Qual desafio recente trouxe aprendizado inesperado?",
  ],
};

/** A partir do segundo item incerto, a ressalva é dita de outro jeito. */
function caveatFor(
  caveat: string,
  items: InterpretationReport["chapters"][number]["items"],
  id: string,
) {
  const uncertain = items.filter((i) => i.caveat).map((i) => i.id);
  return uncertain.indexOf(id) === 0
    ? caveat
    : "Vale a mesma reserva: este aspecto também depende do horário de nascimento.";
}

/** Rascunho determinístico no mesmo formato que o modelo deve devolver. */
export function libraryDraft(
  report: InterpretationReport,
  id: ChapterId,
): ChapterDraft {
  const chapter = report.chapters.find((c) => c.id === id)!;
  return {
    introduction: INTRODUCTIONS[id],
    sections: chapter.items.map((i) => ({
      text: [i.symbolic, i.caveat && caveatFor(i.caveat, chapter.items, i.id)]
        .filter(Boolean)
        .join(" "),
      itemIds: [i.id],
    })),
    synthesis: SYNTHESES[id],
    reflectionQuestions: QUESTIONS[id],
  };
}

/** Converte um rascunho (já validado) no capítulo final rastreável. */
export function toGeneratedChapter(
  report: InterpretationReport,
  id: ChapterId,
  draft: ChapterDraft,
  source: GeneratedChapter["source"],
  fallbackReason: string | null,
): GeneratedChapter {
  const chapter = report.chapters.find((c) => c.id === id)!;
  const items = new Map(chapter.items.map((i) => [i.id, i]));
  const sections: GeneratedSection[] = draft.sections.map((s) => ({
    text: s.text.trim(),
    itemIds: s.itemIds,
    factIds: [...new Set(s.itemIds.flatMap((i) => items.get(i)!.factIds))],
  }));
  return {
    id,
    number: chapter.number,
    title: chapter.title,
    introduction: draft.introduction.trim(),
    sections,
    synthesis: draft.synthesis.trim(),
    reflectionQuestions: draft.reflectionQuestions.map((q) => q.trim()),
    limitations: chapter.limitations,
    source,
    fallbackReason,
  };
}
