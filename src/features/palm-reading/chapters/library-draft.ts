/**
 * Versão de reserva dos capítulos 6 e 7 (Fase 03E): montada só com textos
 * autorais da biblioteca 03C, no mesmo formato do rascunho da IA. Usada
 * quando a geração falha. Também é validada (testes).
 */
import type { PalmChapter, PalmChapterId } from "../analysis/engine";
import type { ChapterDraft } from "./contract";

const INTRODUCTIONS: Record<PalmChapterId, string> = {
  maos: "Este capítulo parte do formato da sua mão, como ele apareceu na foto, e do que a tradição da quiromancia associa a ele.",
  linhas:
    "Aqui estão as linhas da palma que puderam ser observadas na foto e as leituras simbólicas que a tradição da quiromancia faz delas.",
};

const SYNTHESES: Record<PalmChapterId, string> = {
  maos: "Em conjunto, essas características compõem uma leitura simbólica do seu jeito de agir, para ser confrontada com a sua experiência.",
  linhas:
    "Juntas, essas linhas oferecem uma leitura simbólica para reflexão, a ser comparada com o que você reconhece em si.",
};

const QUESTIONS: Record<PalmChapterId, string[]> = {
  maos: [
    "Em que situações você se reconhece nessa descrição, e em quais não?",
    "Como o seu jeito de agir aparece no dia a dia?",
  ],
  linhas: [
    "Qual dessas leituras conversa mais com o que você vive hoje?",
    "O que você gostaria de observar em si a partir delas?",
  ],
};

export function palmLibraryDraft(chapter: PalmChapter): ChapterDraft {
  return {
    introduction: INTRODUCTIONS[chapter.id],
    sections: chapter.items.map((i) => ({
      text: i.symbolic,
      itemIds: [i.id],
    })),
    synthesis: SYNTHESES[chapter.id],
    reflectionQuestions: QUESTIONS[chapter.id],
  };
}
