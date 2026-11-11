/**
 * Estrutura editorial do relatório. Descreve o que cada capítulo abordará;
 * não contém interpretações nem resultados.
 */
export type ReportPart = {
  numeral: string;
  title: string;
  source: "sky" | "hands" | "journey";
  chapters: readonly { number: number; title: string; summary: string }[];
};

export const reportParts: readonly ReportPart[] = [
  {
    numeral: "I",
    title: "Seu Céu",
    source: "sky",
    chapters: [
      {
        number: 1,
        title: "Sua identidade astrológica",
        summary: "Sol, Lua e Ascendente como ponto de partida simbólico.",
      },
      {
        number: 2,
        title: "Seu mundo emocional",
        summary: "Como a tradição astrológica descreve necessidades e afetos.",
      },
      {
        number: 3,
        title: "Sua mente e comunicação",
        summary: "Estilos de pensamento, aprendizado e expressão.",
      },
      {
        number: 4,
        title: "Seus relacionamentos e vínculos",
        summary: "Temas simbólicos ligados a parcerias e convivência.",
      },
      {
        number: 5,
        title: "Seus talentos e desafios",
        summary: "Potenciais e tensões descritos pelo mapa natal.",
      },
    ],
  },
  {
    numeral: "II",
    title: "Suas Mãos",
    source: "hands",
    chapters: [
      {
        number: 6,
        title: "As características das suas mãos",
        summary: "Formato, proporções e traços visíveis na fotografia.",
      },
      {
        number: 7,
        title: "As linhas da sua palma",
        summary: "Coração, cabeça e vida segundo a tradição da quiromancia.",
      },
    ],
  },
  {
    numeral: "III",
    title: "Sua Jornada",
    source: "journey",
    chapters: [
      {
        number: 8,
        title: "Conexões simbólicas entre céu e mãos",
        summary: "Onde as duas leituras conversam — e onde divergem.",
      },
      {
        number: 9,
        title: "Seu guia pessoal de reflexão",
        summary: "Perguntas e práticas para levar a leitura ao cotidiano.",
      },
    ],
  },
];
