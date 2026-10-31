/**
 * Biblioteca editorial — significados de base (astrologia ocidental tropical).
 *
 * Linguagem: descreve o que a TRADIÇÃO associa a cada elemento, nunca
 * afirma traços comprovados da pessoa. Estes significados alimentam os
 * textos compostos quando não há texto autoral específico.
 */
import type { AspectType, Body, Sign } from "@/features/astrology/domain/types";

export type Element = "fire" | "earth" | "air" | "water";
export type Modality = "cardinal" | "fixed" | "mutable";

/** Eixos de tensão narrativa: valores diferentes no mesmo eixo podem soar contraditórios. */
export type ToneTag =
  | "ritmo:impulso"
  | "ritmo:cautela"
  | "expressao:expansiva"
  | "expressao:reservada"
  | "foco:mudanca"
  | "foco:estabilidade"
  | "vinculo:autonomia"
  | "vinculo:proximidade";

export const BODY_MEANINGS: Record<
  Body,
  { name: string; function: string; article: "o" | "a" }
> = {
  sun: {
    name: "Sol",
    article: "o",
    function: "o núcleo de identidade e a vontade de se expressar",
  },
  moon: {
    name: "Lua",
    article: "a",
    function: "as necessidades emocionais e a forma de buscar acolhimento",
  },
  mercury: {
    name: "Mercúrio",
    article: "o",
    function: "o modo de pensar, aprender e se comunicar",
  },
  venus: {
    name: "Vênus",
    article: "o",
    function: "o afeto, o prazer e a forma de se vincular",
  },
  mars: {
    name: "Marte",
    article: "o",
    function: "a iniciativa, o desejo e a maneira de agir",
  },
  jupiter: {
    name: "Júpiter",
    article: "o",
    function: "a expansão, a confiança e a busca de sentido",
  },
  saturn: {
    name: "Saturno",
    article: "o",
    function: "a estrutura, os limites e o amadurecimento",
  },
  uranus: {
    name: "Urano",
    article: "o",
    function: "a originalidade, a ruptura e a liberdade",
  },
  neptune: {
    name: "Netuno",
    article: "o",
    function: "a imaginação, a sensibilidade e o anseio de transcendência",
  },
  pluto: {
    name: "Plutão",
    article: "o",
    function: "a intensidade, a transformação e o poder pessoal",
  },
};

export const SIGN_MEANINGS: Record<
  Sign,
  {
    name: string;
    element: Element;
    modality: Modality;
    qualities: string;
    tags: ToneTag[];
  }
> = {
  aries: {
    name: "Áries",
    element: "fire",
    modality: "cardinal",
    qualities: "iniciativa, coragem e franqueza",
    tags: ["ritmo:impulso", "vinculo:autonomia"],
  },
  taurus: {
    name: "Touro",
    element: "earth",
    modality: "fixed",
    qualities: "estabilidade, sensorialidade e persistência",
    tags: ["ritmo:cautela", "foco:estabilidade"],
  },
  gemini: {
    name: "Gêmeos",
    element: "air",
    modality: "mutable",
    qualities: "curiosidade, versatilidade e troca de ideias",
    tags: ["foco:mudanca", "expressao:expansiva"],
  },
  cancer: {
    name: "Câncer",
    element: "water",
    modality: "cardinal",
    qualities: "cuidado, memória afetiva e proteção",
    tags: ["vinculo:proximidade", "expressao:reservada"],
  },
  leo: {
    name: "Leão",
    element: "fire",
    modality: "fixed",
    qualities: "criatividade, generosidade e desejo de reconhecimento",
    tags: ["expressao:expansiva"],
  },
  virgo: {
    name: "Virgem",
    element: "earth",
    modality: "mutable",
    qualities:
      "atenção aos detalhes, senso prático e cuidado com o funcionamento das coisas",
    tags: ["ritmo:cautela"],
  },
  libra: {
    name: "Libra",
    element: "air",
    modality: "cardinal",
    qualities: "busca de equilíbrio, diplomacia e senso estético",
    tags: ["vinculo:proximidade"],
  },
  scorpio: {
    name: "Escorpião",
    element: "water",
    modality: "fixed",
    qualities: "intensidade, profundidade e entrega",
    tags: ["expressao:reservada", "foco:estabilidade"],
  },
  sagittarius: {
    name: "Sagitário",
    element: "fire",
    modality: "mutable",
    qualities: "busca de sentido, entusiasmo e amplitude de horizontes",
    tags: ["foco:mudanca", "expressao:expansiva", "vinculo:autonomia"],
  },
  capricorn: {
    name: "Capricórnio",
    element: "earth",
    modality: "cardinal",
    qualities: "responsabilidade, ambição e paciência",
    tags: ["ritmo:cautela", "expressao:reservada"],
  },
  aquarius: {
    name: "Aquário",
    element: "air",
    modality: "fixed",
    qualities: "originalidade, senso coletivo e independência",
    tags: ["vinculo:autonomia", "foco:mudanca"],
  },
  pisces: {
    name: "Peixes",
    element: "water",
    modality: "mutable",
    qualities: "sensibilidade, imaginação e empatia",
    tags: ["vinculo:proximidade"],
  },
};

export const ELEMENT_NAMES: Record<Element, string> = {
  fire: "Fogo",
  earth: "Terra",
  air: "Ar",
  water: "Água",
};

export const HOUSE_MEANINGS: Record<number, { name: string; area: string }> = {
  1: { name: "Casa 1", area: "a forma de se apresentar e iniciar" },
  2: { name: "Casa 2", area: "os recursos, os valores e a segurança material" },
  3: {
    name: "Casa 3",
    area: "a comunicação, o aprendizado e o entorno próximo",
  },
  4: { name: "Casa 4", area: "as raízes, o lar e a vida íntima" },
  5: { name: "Casa 5", area: "a criatividade, o prazer e a autoexpressão" },
  6: {
    name: "Casa 6",
    area: "a rotina, o trabalho cotidiano e o cuidado com o corpo",
  },
  7: { name: "Casa 7", area: "as parcerias e os encontros com o outro" },
  8: {
    name: "Casa 8",
    area: "a intimidade, os recursos compartilhados e as transformações",
  },
  9: { name: "Casa 9", area: "as viagens, os estudos e a busca de sentido" },
  10: { name: "Casa 10", area: "a vocação, a carreira e a imagem pública" },
  11: {
    name: "Casa 11",
    area: "as amizades, os grupos e os projetos de futuro",
  },
  12: {
    name: "Casa 12",
    area: "o recolhimento, o inconsciente e o que está nos bastidores",
  },
};

export type AspectNature = "conjunction" | "harmonious" | "tense";

export const ASPECT_MEANINGS: Record<
  AspectType,
  { name: string; nature: AspectNature; dynamic: string }
> = {
  conjunction: {
    name: "Conjunção",
    nature: "conjunction",
    dynamic: "se fundem e atuam em conjunto, para o bem e para o desafio",
  },
  sextile: {
    name: "Sextil",
    nature: "harmonious",
    dynamic: "se apoiam e abrem oportunidades quando há iniciativa",
  },
  trine: {
    name: "Trígono",
    nature: "harmonious",
    dynamic:
      "fluem com naturalidade, como um talento que se exerce com facilidade",
  },
  square: {
    name: "Quadratura",
    nature: "tense",
    dynamic: "geram atrito, um desafio que costuma impulsionar crescimento",
  },
  opposition: {
    name: "Oposição",
    nature: "tense",
    dynamic: "puxam em direções opostas e pedem integração e equilíbrio",
  },
};

/** Regências tradicionais (sete corpos visíveis). Documentado em docs/fase-02e. */
export const TRADITIONAL_RULER: Record<Sign, Body> = {
  aries: "mars",
  taurus: "venus",
  gemini: "mercury",
  cancer: "moon",
  leo: "sun",
  virgo: "mercury",
  libra: "venus",
  scorpio: "mars",
  sagittarius: "jupiter",
  capricorn: "saturn",
  aquarius: "saturn",
  pisces: "jupiter",
};

/** Temas curtos, usados em textos compostos de aspectos. */
export const POINT_THEMES: Record<Body | "asc" | "mc", string> = {
  sun: "a identidade",
  moon: "as emoções",
  mercury: "a mente",
  venus: "os afetos",
  mars: "a ação",
  jupiter: "a expansão",
  saturn: "a estrutura",
  uranus: "a liberdade",
  neptune: "a imaginação",
  pluto: "a intensidade",
  asc: "a forma de se apresentar",
  mc: "a vocação",
};

/** Corpos lentos: seus signos são compartilhados por gerações inteiras. */
export const OUTER_BODIES: readonly Body[] = ["uranus", "neptune", "pluto"];
