/**
 * Versão de reserva dos capítulos 6 e 7 (Fase 03E): montada só com textos
 * autorais da biblioteca 03C, no mesmo formato do rascunho da IA. Usada
 * quando a geração falha. Também é validada (testes). Síntese e perguntas
 * citam só as características do capítulo (03F.2).
 */
import type { PalmChapter, PalmChapterId } from "../analysis/engine";
import type { ChapterDraft } from "./contract";

const INTRODUCTIONS: Record<PalmChapterId, string> = {
  maos: "Este capítulo parte do formato da sua mão, como ele apareceu na foto, e do que a tradição da quiromancia associa a ele.",
  linhas:
    "Aqui estão as linhas da palma que puderam ser observadas na foto e as leituras simbólicas que a tradição da quiromancia faz delas.",
};

/** Como cada característica é nomeada na síntese e nas perguntas. */
const TOPIC: Record<string, string> = {
  "hand.palmShape": "o formato da palma",
  "hand.fingerLength": "o comprimento dos dedos",
  "hand.type": "a combinação de palma e dedos",
  heart: "a linha do coração",
  head: "a linha da cabeça",
  life: "a linha da vida",
  fate: "a linha do destino",
};

/** Só as características que o capítulo tem (03F.2), sem enchimento. */
function topicsOf(chapter: PalmChapter): string[] {
  // "linhas:heart.length:long" → "heart.length" (o id sempre traz a característica).
  const keys = chapter.items.map((i) => {
    const f = i.id.split(":")[1] ?? "";
    return chapter.id === "maos" ? f : f.split(".")[0];
  });
  return [...new Set(keys)].map((k) => TOPIC[k]).filter(Boolean);
}

const list = (t: string[]) =>
  t.length <= 1 ? (t[0] ?? "") : `${t.slice(0, -1).join(", ")} e ${t.at(-1)}`;

function closing(chapter: PalmChapter): {
  synthesis: string;
  reflectionQuestions: string[];
} {
  const topics = topicsOf(chapter);
  if (topics.length <= 1)
    return {
      synthesis: `É uma leitura simbólica sobre ${list(topics)}, para comparar com o que você reconhece em si.`,
      reflectionQuestions: [
        "Em que situações do seu dia a dia você reconhece essa leitura, e em quais não?",
      ],
    };
  return {
    synthesis: `Juntas, as leituras sobre ${list(topics)} formam um retrato simbólico para comparar com o que você reconhece em si.`,
    reflectionQuestions: [
      `Entre ${list(topics)}, qual leitura conversa mais com o que você vive hoje?`,
      "Em que situações você se reconhece nessas leituras, e em quais não?",
    ],
  };
}

export function palmLibraryDraft(chapter: PalmChapter): ChapterDraft {
  return {
    introduction: INTRODUCTIONS[chapter.id],
    sections: chapter.items.map((i) => ({
      text: i.symbolic,
      itemIds: [i.id],
    })),
    ...closing(chapter),
  };
}
