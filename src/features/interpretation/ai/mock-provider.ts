/**
 * Provedor simulado (sem rede, sem custo) para desenvolvimento e testes.
 *
 * Por padrão devolve um capítulo válido montado a partir dos próprios itens
 * da requisição. Cenários permitem simular falhas: JSON inválido, posição
 * inventada, linguagem proibida, resposta truncada, recusa, erros da API.
 * Os tokens informados são uma aproximação (caracteres ÷ 4), não medições.
 */
import {
  AiProviderError,
  type AiErrorKind,
  type AiProvider,
  type AiRequest,
  type AiResponse,
} from "./contract";

export type MockScenario =
  | "valid"
  | "invalid-json"
  | "invented-position"
  | "forbidden-language"
  | "missing-item"
  | "truncated"
  | "refusal"
  | `error:${AiErrorKind}`;

type ChapterInput = {
  chapter: { title: string };
  items: { id: string; interpretation: string; caveat: string | null }[];
};

const approxTokens = (s: string) => Math.ceil(s.length / 4);

function parseInput(request: AiRequest): ChapterInput {
  const json = request.user.slice(
    request.user.indexOf("{"),
    request.user.lastIndexOf("}") + 1,
  );
  return JSON.parse(json) as ChapterInput;
}

/** Capítulo válido feito só com o material autorizado da requisição. */
function validDraft(input: ChapterInput) {
  let seenCaveat = false;
  return {
    introduction: `Este capítulo, "${input.chapter.title}", articula os elementos selecionados do seu mapa.`,
    sections: input.items.map((i) => {
      // Ressalva completa só na primeira vez; depois, uma variação curta.
      const caveat =
        i.caveat && (seenCaveat ? "Aqui também vale a reserva." : i.caveat);
      if (i.caveat) seenCaveat = true;
      return {
        text: [i.interpretation, caveat].filter(Boolean).join(" "),
        itemIds: [i.id],
      };
    }),
    synthesis:
      "Em conjunto, esses temas formam uma leitura simbólica para ser confrontada com a sua experiência.",
    reflectionQuestions: [
      "O que, nesta leitura, conversa com a sua experiência?",
    ],
  };
}

export function createMockProvider(
  /** Cenário por chamada (índice 0 = primeira chamada daquele capítulo). */
  scenarios:
    MockScenario[] | ((request: AiRequest, call: number) => MockScenario) = [
    "valid",
  ],
  options: { model?: string } = {},
): AiProvider & { calls: AiRequest[] } {
  const model = options.model ?? "mock-local";
  const calls: AiRequest[] = [];
  const perChapter = new Map<string, number>();

  return {
    id: "mock",
    model,
    calls,
    async generate(request: AiRequest): Promise<AiResponse> {
      calls.push(request);
      const input = parseInput(request);
      const key = input.chapter.title;
      const call = perChapter.get(key) ?? 0;
      perChapter.set(key, call + 1);
      const scenario =
        typeof scenarios === "function"
          ? scenarios(request, call)
          : scenarios[Math.min(call, scenarios.length - 1)];

      if (scenario.startsWith("error:")) {
        const kind = scenario.slice(6) as AiErrorKind;
        throw new AiProviderError(kind, `Falha simulada: ${kind}`);
      }

      const draft = validDraft(input);
      if (scenario === "invented-position")
        draft.sections[0].text += " Com o Sol em Leão, o brilho é inevitável.";
      if (scenario === "forbidden-language")
        draft.synthesis =
          "Você certamente vai prosperar se investir no momento certo.";
      if (scenario === "missing-item" && draft.sections.length > 1)
        draft.sections.pop();

      let text = JSON.stringify(draft);
      if (scenario === "invalid-json") text = text.slice(0, -1);
      if (scenario === "truncated") text = text.slice(0, text.length / 2);

      return {
        model,
        text,
        stopReason:
          scenario === "truncated"
            ? "max_tokens"
            : scenario === "refusal"
              ? "refusal"
              : "end",
        usage: {
          inputTokens: approxTokens(request.system + request.user),
          outputTokens: approxTokens(text),
          cacheReadInputTokens: 0,
          cacheCreationInputTokens: 0,
        },
      };
    },
  };
}
