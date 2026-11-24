/**
 * Biblioteca editorial dos capítulos 8 e 9 (Fase 04D).
 *
 * Fonte: `docs/fase-04d-biblioteca-consolidada.md` (aprovada em `d71f524`,
 * com as correções finais). Os textos são literais: qualquer mudança exige
 * revisão editorial e nova versão. Nada aqui é gerado por IA, e nada é uma
 * interpretação nova: os capítulos 8 e 9 só organizam o que os capítulos 1
 * a 7 já apresentaram.
 */
import type { ToneTag } from "@/features/interpretation/library/base";
import type { FeatureId } from "@/features/palm-reading/analysis/contract";

export const JOURNEY_LIBRARY_VERSION = "04d.1";

export type Axis = "ritmo" | "expressao" | "vinculo" | "foco";
export type Relation = "A" | "AC" | "D" | "F";

/** Ordem fixa dos eixos (D1: os quatro eixos de `ToneTag`). */
export const AXES: readonly Axis[] = ["ritmo", "expressao", "vinculo", "foco"];

export const OPPOSITE: Record<ToneTag, ToneTag> = {
  "ritmo:impulso": "ritmo:cautela",
  "ritmo:cautela": "ritmo:impulso",
  "expressao:expansiva": "expressao:reservada",
  "expressao:reservada": "expressao:expansiva",
  "foco:mudanca": "foco:estabilidade",
  "foco:estabilidade": "foco:mudanca",
  "vinculo:autonomia": "vinculo:proximidade",
  "vinculo:proximidade": "vinculo:autonomia",
};

export const AXIS_TITLE: Record<Axis, string> = {
  ritmo: "Ritmo: impulso e cautela",
  expressao: "Expressão: abertura e reserva",
  vinculo: "Vínculo: autonomia e proximidade",
  foco: "Foco: mudança e estabilidade",
};

export const SEAL: Record<Relation, string> = {
  A: "Aproximação",
  AC: "Aproximação com contraponto",
  D: "Diferença",
  F: "Duas imagens nas mãos",
};

// ── Correspondências (tabelas 2.2, 2.4, 2.5 e 2.6 da biblioteca) ─────────

/** Os 5 valores das mãos com polo (tabela 2.2) e seus rótulos curtos. */
export const PALM_POLES: Readonly<
  Record<string, { pole: ToneTag; label: string }>
> = {
  "heart.length:short": {
    pole: "expressao:reservada",
    label: "linha do coração curta",
  },
  "heart.length:long": {
    pole: "expressao:expansiva",
    label: "linha do coração longa",
  },
  "heart.shape:straight": {
    pole: "expressao:reservada",
    label: "linha do coração de traçado reto",
  },
  "heart.shape:curved": {
    pole: "expressao:expansiva",
    label: "linha do coração curvada para cima",
  },
  "head.start:joined_life": {
    pole: "ritmo:cautela",
    label: "linha da cabeça começando unida à da vida",
  },
};

/** Traços comparáveis do capítulo 8 (para a causa real de U4). */
export const COMPARABLE_FEATURES: readonly FeatureId[] = [
  "heart.length",
  "heart.shape",
  "head.start",
];

/** Fora das conexões: instáveis na 03F.2 (D4) e proporções (D3). */
export const UNRELIABLE_FEATURES: readonly FeatureId[] = [
  "hand.palmShape",
  "hand.fingerLength",
  "head.length",
  "life.arc",
];

/** Interpretações das mãos sem polo usadas só no capítulo 9 (pensamento). */
export const PALM_REFLECT: Readonly<Record<string, string>> = {
  "head.slope:straight": "linha da cabeça de traçado mais reto",
  "head.slope:sloping": "linha da cabeça descendo em direção ao pulso",
};

export type Subject = "afeto" | "agir" | "identidade" | "pensamento";

/**
 * Assunto de cada interpretação (F1 e tabela 2.6). Chaves: corpo ou ângulo
 * do céu, característica das mãos. Ausente = sem assunto no capítulo 9.
 */
export const SUBJECT: Readonly<Record<string, Subject>> = {
  moon: "afeto",
  venus: "afeto",
  "heart.length": "afeto",
  "heart.shape": "afeto",
  mars: "agir",
  "head.start": "agir",
  sun: "identidade",
  asc: "identidade",
  mercury: "pensamento",
  "head.slope": "pensamento",
};

/** Capítulo 8: só afeto e agir têm correspondência entre as tradições. */
export const BRIDGE_SUBJECTS: readonly Subject[] = ["afeto", "agir"];

/** Eixos que cada assunto trata (tabela 2.5), na ordem de preferência. */
export const SUBJECT_AXES: Readonly<Partial<Record<Subject, Axis[]>>> = {
  afeto: ["expressao", "vinculo"],
  agir: ["ritmo"],
};

/** Assuntos com pergunta própria (sem eixo). */
export const SUBJECT_TITLE: Readonly<Partial<Record<Subject, string>>> = {
  identidade: "Identidade",
  pensamento: "Pensamento",
};

/** Corpos do céu elegíveis (tabela 2.3); lentos, Meio do Céu e elementos ficam fora. */
export const ELIGIBLE_BODIES = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
] as const;

/** Rótulos das posições incertas pelo horário (R-hora). */
export const UNCERTAIN_LABEL: Readonly<Record<string, string>> = {
  moon: "a posição da Lua",
  venus: "a posição de Vênus",
  mars: "a posição de Marte",
};

// ── Capítulo 8 ───────────────────────────────────────────────────────────

export const C8 = {
  intro:
    "Este capítulo coloca lado a lado as imagens que a astrologia e a quiromancia usaram nos capítulos anteriores. São tradições simbólicas independentes: quando usam imagens parecidas, trata-se de uma semelhança de linguagem, não de uma constatação sobre você; quando apontam para lados diferentes, a diferença fica à vista.",
  /** Chave: `{polo das mãos}:{relação}` ou `{eixo}:F`. */
  bridge: {
    "ritmo:cautela:A":
      "Aqui as duas leituras usam uma imagem parecida: um ritmo cuidadoso, de avaliar antes de seguir.",
    "ritmo:cautela:D":
      "Aqui as leituras apontam para lados diferentes: a quiromancia associa este traço à cautela, e as posições citadas do mapa são associadas a uma ação mais imediata. As duas descrições ficam registradas como estão, sem uma conciliação forçada.",
    "expressao:expansiva:A":
      "As duas leituras usam a imagem de uma expressão afetiva mais aberta.",
    "expressao:expansiva:AC":
      "Nas duas tradições aparece a imagem de uma expressão afetiva mais aberta. No mapa, ela divide espaço com imagens de reserva: são facetas descritas lado a lado, não uma conta que precise fechar.",
    "expressao:expansiva:D":
      "Aqui as leituras seguem caminhos diferentes: a quiromancia associa estes traços a uma expressão mais aberta, e as posições citadas do mapa, a uma expressão mais reservada. A diferença fica à vista, sem conciliação.",
    "expressao:reservada:A":
      "As duas leituras usam a imagem de uma expressão afetiva mais reservada, que se revela aos poucos.",
    "expressao:reservada:AC":
      "Nas duas tradições aparece a imagem de uma expressão afetiva mais reservada. O mapa também traz imagens de abertura: as duas convivem na leitura, sem que uma corrija a outra.",
    "expressao:reservada:D":
      "Aqui as leituras apontam para lados diferentes: a quiromancia associa estes traços a uma expressão mais reservada, e as posições citadas do mapa, a uma expressão mais aberta. As duas descrições ficam como estão.",
    "expressao:F":
      "Nas mãos, a própria linha do coração traz duas imagens: uma de abertura e outra de reserva. Por isso, aqui não se aponta aproximação nem diferença; as imagens do mapa aparecem ao lado, só para comparação.",
  } as Readonly<Record<string, string>>,
  synthesis: {
    A: "As aproximações acima mostram onde as duas tradições usam palavras parecidas. Elas servem como ponto de partida para observar a sua experiência, não como conclusão.",
    D: "Nos temas comparados, as duas tradições apontam para lados diferentes. Isso não é um erro de nenhuma delas: são sistemas simbólicos distintos, e cada um pode ser confrontado com o que você vive.",
    AD: "Há pontos em que as duas tradições usam imagens parecidas e pontos em que seguem caminhos diferentes. Os dois casos valem, no mesmo peso, como material de reflexão.",
    F: "As imagens comparadas aqui convivem dentro de cada leitura e entre elas. Servem como material de reflexão, não como conclusão.",
  },
  R0: "Semelhanças entre tradições simbólicas não comprovam traços de personalidade, e diferenças entre elas não indicam erro de nenhuma das leituras.",
  Rparcial: {
    one: "{Lista} ficou só parcialmente visível na foto e por isso não sustenta nenhuma comparação.",
    many: "{Lista} ficaram só parcialmente visíveis na foto e por isso não sustentam nenhuma comparação.",
  },
  Rconf: {
    one: "{Lista} não entra nestas comparações: é uma característica que ainda não pode ser classificada com segurança a partir de uma foto.",
    many: "{Lista} não entram nestas comparações: são características que ainda não podem ser classificadas com segurança a partir de uma foto.",
  },
  Rhora: {
    one: "{Lista} depende do horário de nascimento informado e não entra nestas comparações.",
    many: "{Lista} dependem do horário de nascimento informado e não entram nestas comparações.",
  },
  Rescopo:
    "Os demais traços e posições tratam de outros temas e por isso não são comparados neste capítulo.",
  Rsim: "Esta comparação usa uma leitura das mãos simulada, do ambiente interno de testes.",
  U: {
    U1: "As conexões dependem das duas leituras, e a leitura das mãos não está nesta jornada. Nenhuma conexão foi criada só a partir do mapa.",
    U2: "As conexões dependem das duas leituras, e os capítulos do mapa natal não estão nesta jornada. Nenhuma conexão foi criada só a partir das mãos.",
    U3: "As conexões dependem das duas leituras, e nenhuma delas está disponível nesta jornada.",
    U4: "Os traços das mãos que podem ser comparados — o comprimento e o traçado da linha do coração e o início da linha da cabeça — não puderam ser classificados com segurança nesta leitura. Por isso, nenhuma conexão foi criada.",
    U5: "A leitura das mãos pediu uma nova foto. Sem uma observação nítida, nenhuma conexão foi criada.",
    U6: "As posições do mapa ligadas aos mesmos temas dos traços nítidos das mãos — o afeto e o modo de agir — não apontam para nenhum dos lados desses traços. Por isso, não há o que comparar, e nenhuma conexão foi criada para preencher o capítulo.",
  },
  /** U4 misto: `{observados sem correspondência}-{não classificados}`. */
  U4misto: {
    "one-many":
      "{Lista1} foi observado, mas sem uma categoria que corresponda aos temas comparados, e {lista2} não puderam ser classificados com segurança nesta leitura. Por isso, nenhuma conexão foi criada.",
    "many-one":
      "{Lista1} foram observados, mas sem uma categoria que corresponda aos temas comparados, e {lista2} não pôde ser classificado com segurança nesta leitura. Por isso, nenhuma conexão foi criada.",
  } as Readonly<Record<string, string>>,
  labels: {
    hands: "Nas mãos",
    sky: "No céu",
    opposite: "No céu, o outro lado",
  },
} as const;

export type Ch8Unavailable = keyof typeof C8.U | "U4misto";

// ── Capítulo 9 ───────────────────────────────────────────────────────────

export const C9 = {
  intro: {
    many: "Este guia transforma alguns temas da sua leitura em perguntas para pensar com calma. Os temas vêm dos capítulos {lista}; as respostas, e a decisão sobre o que faz sentido para você, são suas.",
    one: "Este guia transforma alguns temas da sua leitura em perguntas para pensar com calma. Os temas vêm do capítulo {lista}; as respostas, e a decisão sobre o que faz sentido para você, são suas.",
  },
  /** Chave: `{eixo}:{polo|two}` ou o assunto (identidade, pensamento). */
  q: {
    "ritmo:two":
      "Quando foi a última vez que esperar antes de decidir ajudou você — e quando agir logo teria sido melhor?",
    "ritmo:cautela":
      "Que decisões você costuma tomar com calma, e quais gostaria de tomar com menos espera?",
    "ritmo:impulso":
      "Que escolhas você costuma fazer de imediato? Alguma delas pediria um pouco mais de tempo?",
    "expressao:two":
      "Com quem você mostra com facilidade o que sente, e com quem prefere guardar mais para si?",
    "expressao:expansiva":
      "De que formas você costuma demonstrar afeto, e quais delas parecem mais naturais para você?",
    "expressao:reservada":
      "O que precisa acontecer para você contar a alguém o que está sentindo?",
    "vinculo:two":
      "Em quais momentos da sua semana você procura companhia, e em quais prefere ficar por conta própria?",
    "vinculo:autonomia":
      "Que espaços de independência são importantes para você hoje, e como você cuida deles?",
    "vinculo:proximidade":
      "Com quem você gosta de dividir o dia a dia, e o que torna essa convivência boa?",
    // Inativas (5.4): nenhum assunto trata o foco. Preservadas por decisão editorial.
    "foco:two":
      "O que na sua vida você gostaria de manter como está, e o que gostaria de ver mudar?",
    "foco:mudanca":
      "Que novidade recente despertou o seu interesse, e o que ela trouxe de bom ou de difícil?",
    "foco:estabilidade":
      "Que hábitos ou lugares trazem a você uma sensação de continuidade?",
    identidade:
      "Que atividade ou escolha do seu dia a dia parece mais com você, e por quê?",
    pensamento:
      "Como você costuma chegar a uma conclusão quando algo importante está em jogo?",
  } as Readonly<Record<string, string>>,
  /** Uma por capítulo: a do eixo do primeiro tema que tem eixo. Foco: inativa. */
  practice: {
    ritmo:
      "Se quiser, observe durante alguns dias as pequenas decisões do cotidiano: quais você toma de imediato e quais deixa para depois. Não é preciso mudar nada, só notar.",
    expressao:
      "Se quiser, repare ao longo de uma semana em quando você fala do que sente e quando prefere guardar. Anotar uma ou duas situações já basta.",
    vinculo:
      "Se quiser, observe numa semana comum os momentos em que buscou companhia e os momentos em que preferiu ficar só, e como foi cada um.",
    foco: "Se quiser, faça uma lista curta do que você gostaria de manter e do que gostaria de experimentar. A lista pode mudar quando você quiser.",
  } as Readonly<Record<Axis, string>>,
  final:
    "Pensando na leitura como um todo: com o que você concorda, com o que discorda — e o que prefere deixar em aberto por enquanto?",
  closing:
    "Este guia é um convite à reflexão a partir de tradições simbólicas. Ele não prevê acontecimentos nem substitui orientação profissional, e nenhuma pergunta aqui tem resposta certa.",
  V: {
    V1: "Não há temas suficientes nesta jornada para montar um guia de reflexão sem inventar conteúdo. O guia precisa de pelo menos dois temas sustentados pelos capítulos anteriores.",
    V2: "Os capítulos disponíveis sustentam só um tema com segurança, e o guia precisa de pelo menos dois. Para não preencher o espaço com temas inventados, ele não foi montado nesta jornada.",
  },
  labels: {
    from: "A partir de",
    practice: "Prática opcional",
    final: "Para fechar",
  },
} as const;

/** Limites editoriais do capítulo 9. */
export const C9_MIN_THEMES = 2;
export const C9_MAX_THEMES = 3;
export const C8_MAX_THEMES = 3;
