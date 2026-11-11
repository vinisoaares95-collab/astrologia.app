/**
 * Biblioteca autoral de quiromancia (Fase 03C).
 *
 * Organização: característica → categoria observável → textos.
 * - `definition`: o que a categoria significa VISUALMENTE (critério para a
 *   extração e para a auditoria; não vai ao cliente).
 * - `observation`: frase do SISTEMA descrevendo o que foi observado.
 * - `symbolic`: leitura da TRADIÇÃO da quiromancia, em linguagem de
 *   possibilidade ("costuma ser associada", "pode").
 *
 * Regras editoriais (conferidas em testes):
 * - quiromancia é tradição simbólica, não ciência, diagnóstico nem previsão;
 * - nada de saúde, longevidade, fertilidade, dinheiro, casamento ou
 *   acontecimentos futuros;
 * - a linha da vida NUNCA fala de duração da vida;
 * - a linha do destino só tem texto para "presente e nítida".
 *
 * Terminologia: ver docs/fase-03c-observacoes-e-biblioteca.md
 * ("Referências"). As obras citadas documentam a TRADIÇÃO; não há evidência
 * científica de que características da mão indiquem personalidade.
 */
import type { FeatureId, FeatureValue } from "./contract";

export const PALM_LIBRARY_VERSION = "03c.1";

export type LibraryEntry = {
  definition: string;
  observation: string;
  symbolic: string;
};

type Library = {
  [F in FeatureId]: Record<FeatureValue<F>, LibraryEntry>;
};

export const PALM_LIBRARY: Library = {
  "hand.palmShape": {
    square: {
      definition:
        "A largura da palma, na base dos dedos, é parecida com o comprimento da palma (do pulso à base do dedo médio).",
      observation:
        "Palma de formato mais quadrado: a largura é parecida com o comprimento.",
      symbolic:
        "Na quiromancia, a palma de formato mais quadrado costuma ser associada a um jeito prático de estar no mundo: gosto por estrutura, constância e soluções concretas.",
    },
    rectangular: {
      definition: "A palma é visivelmente mais longa do que larga.",
      observation: "Palma mais longa do que larga.",
      symbolic:
        "Na tradição da quiromancia, a palma mais longa do que larga é associada à sensibilidade e à imaginação: você pode se guiar bastante pelo que sente e intui.",
    },
  },
  "hand.fingerLength": {
    short: {
      definition:
        "O dedo médio mede visivelmente menos de três quartos do comprimento da palma.",
      observation: "Dedos curtos em relação ao comprimento da palma.",
      symbolic:
        "Na quiromancia, dedos mais curtos em relação à palma são ligados a um modo de agir rápido e direto, mais atento ao conjunto do que aos detalhes.",
    },
    medium: {
      definition:
        "O dedo médio mede entre cerca de três quartos e quase todo o comprimento da palma; nem claramente curto nem claramente longo.",
      observation: "Dedos de comprimento médio em relação à palma.",
      symbolic:
        "Dedos de comprimento médio em relação à palma são lidos pela tradição como um equilíbrio entre impulso e reflexão.",
    },
    long: {
      definition:
        "O dedo médio tem comprimento parecido com o da palma ou maior.",
      observation: "Dedos longos em relação ao comprimento da palma.",
      symbolic:
        "Na quiromancia, dedos longos em relação à palma costumam ser associados à atenção aos detalhes e ao gosto por pensar antes de agir.",
    },
  },
  "heart.length": {
    short: {
      definition:
        "A linha do coração termina antes de chegar à área sob o dedo médio.",
      observation:
        "Linha do coração curta, terminando antes da área sob o dedo médio.",
      symbolic:
        "Na tradição, uma linha do coração mais curta é associada a um afeto mais reservado, que se revela aos poucos e para quem conquista a sua confiança.",
    },
    medium: {
      definition:
        "A linha do coração termina na área sob o dedo médio ou entre o médio e o indicador.",
      observation:
        "Linha do coração de comprimento médio, terminando perto da área sob o dedo médio.",
      symbolic:
        "Uma linha do coração de comprimento médio é tradicionalmente lida como equilíbrio entre expressar o que sente e preservar o próprio espaço.",
    },
    long: {
      definition:
        "A linha do coração chega à área sob o dedo indicador ou à borda da palma desse lado.",
      observation:
        "Linha do coração longa, chegando à área sob o dedo indicador.",
      symbolic:
        "Uma linha do coração longa costuma ser associada, na quiromancia, a um afeto expansivo e generoso, que se envolve com intensidade.",
    },
  },
  "heart.shape": {
    straight: {
      definition:
        "A linha do coração segue quase reta, sem subir em direção aos dedos no final.",
      observation: "Linha do coração de traçado mais reto.",
      symbolic:
        "Quando a linha do coração segue mais reta, a tradição a relaciona a um modo mais racional e contido de lidar com os afetos.",
    },
    curved: {
      definition:
        "A linha do coração se curva para cima, em direção à base dos dedos, no final do traçado.",
      observation:
        "Linha do coração curvando-se para cima, em direção aos dedos.",
      symbolic:
        "Quando a linha do coração se curva em direção aos dedos, a tradição a associa a uma expressão afetiva calorosa e aberta.",
    },
  },
  "head.length": {
    short: {
      definition: "A linha da cabeça termina antes da área sob o dedo anelar.",
      observation:
        "Linha da cabeça curta, terminando antes da área sob o dedo anelar.",
      symbolic:
        "Na tradição, a linha da cabeça mais curta é ligada a um pensamento objetivo, que prefere ir direto ao ponto.",
    },
    medium: {
      definition: "A linha da cabeça termina na área sob o dedo anelar.",
      observation:
        "Linha da cabeça de comprimento médio, chegando à área sob o dedo anelar.",
      symbolic:
        "Uma linha da cabeça de comprimento médio é associada pela tradição a um pensamento que equilibra praticidade e reflexão.",
    },
    long: {
      definition:
        "A linha da cabeça passa da área sob o dedo anelar, chegando perto da borda da palma.",
      observation:
        "Linha da cabeça longa, atravessando a palma até perto da borda.",
      symbolic:
        "Uma linha da cabeça longa costuma ser associada, na quiromancia, a um pensamento abrangente, que gosta de considerar muitos ângulos antes de decidir.",
    },
  },
  "head.slope": {
    straight: {
      definition: "A linha da cabeça atravessa a palma quase na horizontal.",
      observation: "Linha da cabeça de traçado mais reto, quase horizontal.",
      symbolic:
        "Uma linha da cabeça mais reta é tradicionalmente associada a um raciocínio prático e lógico, voltado ao concreto.",
    },
    sloping: {
      definition:
        "A linha da cabeça desce visivelmente em direção ao pulso no seu final.",
      observation: "Linha da cabeça descendo em direção ao pulso.",
      symbolic:
        "Quando a linha da cabeça desce em direção ao pulso, a tradição a liga à imaginação e a um pensamento mais criativo.",
    },
  },
  "head.start": {
    joined_life: {
      definition:
        "No início, perto do polegar, a linha da cabeça sai junto da linha da vida.",
      observation: "Linha da cabeça começando unida à linha da vida.",
      symbolic:
        "Quando a linha da cabeça começa unida à da vida, a quiromancia costuma associar isso à cautela: você pode preferir avaliar bem antes de se lançar.",
    },
    separate: {
      definition:
        "No início, perto do polegar, há um espaço visível entre a linha da cabeça e a da vida.",
      observation: "Linha da cabeça começando separada da linha da vida.",
      symbolic:
        "Quando a linha da cabeça começa separada da linha da vida, a tradição associa isso à independência e à disposição para seguir o próprio caminho.",
    },
  },
  "life.arc": {
    wide: {
      definition:
        "A linha da vida faz um arco amplo, avançando bem para o centro da palma antes de descer ao pulso.",
      observation:
        "Linha da vida em arco amplo, avançando para o centro da palma.",
      symbolic:
        "Na quiromancia, um arco amplo da linha da vida é associado ao entusiasmo e à abertura para novas experiências — uma leitura sobre o modo de viver, não sobre a duração da vida.",
    },
    close: {
      definition:
        "A linha da vida faz um arco fechado, mantendo-se próxima da base do polegar.",
      observation:
        "Linha da vida em arco mais fechado, próxima à base do polegar.",
      symbolic:
        "Um arco mais fechado da linha da vida é tradicionalmente lido como preferência por ambientes conhecidos e por um ritmo mais cuidadoso — uma leitura sobre o modo de viver, não sobre a duração da vida.",
    },
  },
  "fate.presence": {
    present: {
      definition:
        "Uma linha vertical nítida sobe do meio da palma, ou da região do pulso, em direção ao dedo médio.",
      observation: "Linha do destino nítida, subindo em direção ao dedo médio.",
      symbolic:
        "Uma linha do destino bem marcada é associada, na tradição, à sensação de propósito e a uma direção que você constrói ao longo do caminho — não a um destino fixo.",
    },
  },
};

/**
 * Tipos elementares da quiromancia moderna (combinação de palma e dedos).
 * Só existem para combinações nítidas nos dois eixos; dedos médios não
 * formam tipo (seria uma classificação além do que a foto sustenta).
 */
export const HAND_TYPES = {
  earth: {
    palm: "square",
    fingers: "short",
    label: "mão de Terra",
    symbolic:
      "Palma mais quadrada com dedos curtos compõe o que a quiromancia moderna chama de mão de Terra, associada à praticidade, à estabilidade e ao contato com o concreto.",
  },
  air: {
    palm: "square",
    fingers: "long",
    label: "mão de Ar",
    symbolic:
      "Palma mais quadrada com dedos longos compõe o que a quiromancia moderna chama de mão de Ar, associada à curiosidade, à comunicação e ao gosto por ideias.",
  },
  fire: {
    palm: "rectangular",
    fingers: "short",
    label: "mão de Fogo",
    symbolic:
      "Palma mais longa com dedos curtos compõe o que a quiromancia moderna chama de mão de Fogo, associada ao entusiasmo, à iniciativa e à energia para começar.",
  },
  water: {
    palm: "rectangular",
    fingers: "long",
    label: "mão de Água",
    symbolic:
      "Palma mais longa com dedos longos compõe o que a quiromancia moderna chama de mão de Água, associada à sensibilidade, à intuição e à receptividade.",
  },
} as const satisfies Record<
  string,
  {
    palm: FeatureValue<"hand.palmShape">;
    fingers: FeatureValue<"hand.fingerLength">;
    label: string;
    symbolic: string;
  }
>;

export type HandType = keyof typeof HAND_TYPES;

/** Nome de cada característica, para limitações e auditoria. */
export const FEATURE_LABELS: Record<FeatureId, string> = {
  "hand.palmShape": "O formato da palma",
  "hand.fingerLength": "O comprimento dos dedos",
  "heart.length": "O comprimento da linha do coração",
  "heart.shape": "O traçado da linha do coração",
  "head.length": "O comprimento da linha da cabeça",
  "head.slope": "A inclinação da linha da cabeça",
  "head.start": "O início da linha da cabeça",
  "life.arc": "O arco da linha da vida",
  "fate.presence": "A linha do destino",
};

/** Ressalva do sistema para características só parcialmente visíveis. */
export const PARTIAL_CAVEAT =
  "Esta característica ficou só parcialmente visível na foto; leia esta interpretação com reserva.";

export const PALM_DISCLAIMER =
  "As características descritas foram observadas numa fotografia e podem não corresponder exatamente à sua mão. Os significados vêm da tradição simbólica da quiromancia — não são fatos científicos, diagnósticos nem previsões.";

/**
 * Temas que nenhum texto de quiromancia pode tocar (somam-se às listas do
 * validador de textos de IA, em interpretation/ai/validate.ts).
 * "Duração da vida" só é aceita negada ("não sobre a duração da vida").
 */
export const PALM_FORBIDDEN_TEXT_PATTERNS: readonly RegExp[] = [
  /(?<!\p{L})(mort\p{L}*|morrer|longevidade|anos de vida|vida (?:longa|curta)|expectativa de vida)(?!\p{L})/iu,
  /(?<!(?:não|nunca) sobre a )(?<!\p{L})duração da vida(?!\p{L})/iu,
  /(?<!\p{L})(filhos?|gravidez|grávid\p{L}*|fertilidade|fértil|casamento|casar\p{L}*|divórcio|viuvez)(?!\p{L})/iu,
  /(?<!\p{L})(dinheiro|riqueza|fortuna|herança|enriquec\p{L}*|prosperidade financeira)(?!\p{L})/iu,
  /(?<!\p{L})(doen\p{L}*|saúde|acidente\p{L}*|cirurgia\p{L}*)(?!\p{L})/iu,
  /(?<!\p{L})(você (?:vai|irá|terá)|acontecerá|no futuro)(?!\p{L})/iu,
];
