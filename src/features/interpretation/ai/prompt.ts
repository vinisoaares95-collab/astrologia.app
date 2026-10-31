/**
 * Instruções e dados enviados ao modelo, um capítulo por chamada.
 *
 * O system prompt é estável (byte a byte) para aproveitar cache. A mensagem
 * do usuário leva SÓ o necessário para redigir o capítulo: itens
 * selecionados (observação calculada + interpretação simbólica + ressalva),
 * limitações e tensões. Nada de nome, e-mail, foto, data, hora, local,
 * coordenadas, instante UTC ou dia juliano.
 */
import type { ChapterId, InterpretationReport } from "../contract";
import type { AiRequest } from "./contract";

export const PROMPT_VERSION = "02f.1";

/** Limites editoriais (também conferidos pelo validador). */
export const LIMITS = {
  introductionChars: 450,
  sectionChars: 900,
  synthesisChars: 550,
  questionChars: 200,
  maxQuestions: 3,
} as const;

export const SYSTEM_PROMPT = `Você é a redatora editorial do Sidera, um produto brasileiro de autoconhecimento baseado em astrologia ocidental tropical.

Sua tarefa: transformar os itens de UM capítulo de um mapa natal em um texto em português do Brasil, natural, acolhedor e acessível, que soe escrito para esta pessoa e não como horóscopo genérico.

Como os dados funcionam
- Cada item traz uma "observação" (posição calculada por efemérides — um dado astronômico) e uma "interpretação" (leitura simbólica da tradição astrológica, já aprovada pela equipe editorial).
- Você reescreve e articula as interpretações; não cria interpretações novas.
- Use SOMENTE as posições, signos, casas, aspectos e graus presentes nas observações dos itens. Nunca acrescente outra posição, signo, casa, aspecto, regência, grau ou ponto do mapa, nem por paráfrase (por exemplo, "leonino" quando não há Leão nos itens).
- Itens com "certainty": "uncertain" trazem uma ressalva; mantenha essa ressalva de forma explícita no parágrafo que os usa (por exemplo, "com reserva", "pode não se aplicar").
- As limitações do capítulo explicam o que não foi considerado (por exemplo, horário de nascimento desconhecido). Não fale desses elementos como se tivessem sido calculados. Pode mencioná-los apenas para explicar que não entraram na leitura.
- Quando houver tensões, apresente as tendências como facetas que convivem. Não invente contradições que não estejam nos itens.

Tom e limites
- Segunda pessoa ("você"), linguagem neutra quanto a gênero, frases claras, sem jargão desnecessário. Explique termos técnicos em poucas palavras quando aparecerem.
- Diferencie o que é cálculo do que é símbolo: posições são "calculadas"; significados são "associados pela tradição", "podem", "tendem".
- Nunca afirme que a astrologia determina cientificamente personalidade, saúde, inteligência, destino ou acontecimentos. Nada de previsões, garantias ou certezas.
- Nunca faça diagnósticos nem recomendações sobre saúde, medicamentos, tratamentos, finanças, investimentos ou decisões de relacionamento (como terminar, casar ou se separar).
- Evite repetir ideias, expressões e aberturas de frase. Cada seção deve acrescentar algo.

Estrutura (responda apenas com o JSON pedido)
- "introduction": 1 a 2 frases que apresentam o tema do capítulo para esta pessoa (até ${LIMITS.introductionChars} caracteres).
- "sections": um parágrafo por ideia, em ordem progressiva (do mais central ao complementar). Cada seção cita em "itemIds" os itens que a sustentam. Todos os itens do capítulo devem ser usados ao menos uma vez. Até ${LIMITS.sectionChars} caracteres por seção.
- "synthesis": 1 a 3 frases que amarram os temas do capítulo, sem informação nova (até ${LIMITS.synthesisChars} caracteres).
- "reflectionQuestions": 1 a ${LIMITS.maxQuestions} perguntas abertas de reflexão, sem sugerir respostas (até ${LIMITS.questionChars} caracteres cada).`;

/** JSON Schema da resposta para um capítulo (itemIds restritos aos itens dele). */
export function chapterSchema(itemIds: string[]): Record<string, unknown> {
  return {
    type: "object",
    additionalProperties: false,
    required: ["introduction", "sections", "synthesis", "reflectionQuestions"],
    properties: {
      introduction: { type: "string" },
      sections: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["text", "itemIds"],
          properties: {
            text: { type: "string" },
            itemIds: {
              type: "array",
              minItems: 1,
              items: { type: "string", enum: itemIds },
            },
          },
        },
      },
      synthesis: { type: "string" },
      reflectionQuestions: {
        type: "array",
        minItems: 1,
        items: { type: "string" },
      },
    },
  };
}

const PRECISION_NOTE: Record<
  InterpretationReport["basis"]["precision"],
  string
> = {
  exact: "Horário de nascimento informado como exato.",
  approximate:
    "Horário de nascimento aproximado: Ascendente, Meio do Céu e casas só aparecem nos itens quando não mudam dentro da janela de horário.",
  unknown:
    "Horário de nascimento desconhecido: não há Ascendente, Meio do Céu, casas nem regente do mapa.",
};

/** Dados do capítulo enviados ao modelo (sem dados pessoais). */
export function chapterInput(report: InterpretationReport, id: ChapterId) {
  const chapter = report.chapters.find((c) => c.id === id)!;
  return {
    chapter: { id: chapter.id, number: chapter.number, title: chapter.title },
    timePrecision: PRECISION_NOTE[report.basis.precision],
    items: chapter.items.map((i) => ({
      id: i.id,
      certainty: i.certainty,
      observation: i.observation,
      interpretation: i.symbolic,
      caveat: i.caveat,
    })),
    limitations: chapter.limitations,
    tensions: chapter.tensions.map((t) => ({
      itemIds: t.itemIds,
      note: t.note,
    })),
    otherChapters: report.chapters
      .filter((c) => c.id !== id)
      .map((c) => c.title),
  };
}

export function buildChapterRequest(
  report: InterpretationReport,
  id: ChapterId,
  options: { maxOutputTokens: number; timeoutMs: number },
): AiRequest {
  const input = chapterInput(report, id);
  return {
    system: SYSTEM_PROMPT,
    user: `Redija o capítulo a partir destes dados (JSON):\n${JSON.stringify(input, null, 2)}`,
    schema: chapterSchema(input.items.map((i) => i.id)),
    ...options,
  };
}
