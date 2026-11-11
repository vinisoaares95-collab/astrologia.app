/**
 * Provedor de TEXTO simulado para os capítulos 6 e 7 (Fase 03E): sem rede e
 * sem custo. Monta o rascunho com as interpretações da própria requisição e
 * permite simular falhas e tentativas de interpretação não sustentada.
 */
import {
  AiProviderError,
  type AiErrorKind,
  type AiProvider,
  type AiRequest,
  type AiResponse,
} from "../../interpretation/ai/contract";
import type { PalmChapter, PalmChapterId } from "../analysis/engine";
import { palmLibraryDraft } from "./library-draft";

export const MOCK_PALM_TEXT_SCENARIOS = [
  "valid",
  "connected",
  "invalid-json",
  "truncated",
  "refusal",
  "unsupported-feature",
  "longevity",
  "fate-determinism",
  "contradiction",
  "sensitive",
  "cross-reference",
  "error:timeout",
  "error:unavailable",
] as const;
export type MockPalmTextScenario = (typeof MOCK_PALM_TEXT_SCENARIOS)[number];

type Input = {
  chapter: { id: PalmChapterId; title: string };
  items: { id: string; interpretation: string; observation: string }[];
};

function parse(request: AiRequest): Input {
  const json = request.user.slice(
    request.user.indexOf("{"),
    request.user.lastIndexOf("}") + 1,
  );
  return JSON.parse(json) as Input;
}

export function createMockPalmTextProvider(
  scenarios:
    | MockPalmTextScenario[]
    | ((request: AiRequest, call: number) => MockPalmTextScenario) = ["valid"],
  options: { model?: string } = {},
): AiProvider & { calls: AiRequest[] } {
  const model = options.model ?? "mock-text";
  const calls: AiRequest[] = [];
  const perChapter = new Map<string, number>();
  return {
    id: "mock",
    model,
    calls,
    async generate(request): Promise<AiResponse> {
      calls.push(request);
      const input = parse(request);
      const call = perChapter.get(input.chapter.id) ?? 0;
      perChapter.set(input.chapter.id, call + 1);
      const scenario =
        typeof scenarios === "function"
          ? scenarios(request, call)
          : scenarios[Math.min(call, scenarios.length - 1)];
      if (scenario.startsWith("error:"))
        throw new AiProviderError(
          scenario.slice(6) as AiErrorKind,
          "Falha simulada.",
        );

      const draft = palmLibraryDraft({
        id: input.chapter.id,
        items: input.items.map((i) => ({
          id: i.id,
          symbolic: i.interpretation,
        })),
      } as unknown as PalmChapter);
      const first = draft.sections[0];
      const isLines = input.chapter.id === "linhas";
      if (scenario === "connected" && draft.sections.length > 1)
        // Duas seções unidas numa só, citando os dois itens (conexão legítima).
        draft.sections.splice(0, 2, {
          text: `${draft.sections[0].text} ${draft.sections[1].text}`,
          itemIds: [...draft.sections[0].itemIds, ...draft.sections[1].itemIds],
        });
      if (scenario === "unsupported-feature")
        first.text += " O monte de Vênus bem marcado reforça essa leitura.";
      if (scenario === "longevity" && isLines)
        first.text += " A linha da vida sugere uma vida longa.";
      if (scenario === "fate-determinism")
        draft.synthesis = "Seu caminho já está traçado no futuro.";
      if (scenario === "contradiction" && isLines)
        first.text += " A linha do coração é curta e reta.";
      if (scenario === "sensitive")
        draft.introduction = "Pela pele, a mão parece de uma pessoa jovem.";
      if (
        scenario === "cross-reference" &&
        isLines &&
        draft.sections.length > 1
      )
        draft.sections[draft.sections.length - 1].text +=
          " Ela conversa com a linha do coração.";

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
          inputTokens: Math.ceil(
            (request.system.length + request.user.length) / 4,
          ),
          outputTokens: Math.ceil(text.length / 4),
          cacheReadInputTokens: 0,
          cacheCreationInputTokens: 0,
        },
      };
    },
  };
}
