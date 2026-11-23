import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { PalmAnalysisResult } from "@/features/palm-reading/chapters/presentation";

import { JourneyProvider } from "./journey-context";
import {
  HANDS_ABSENT_REASON,
  JourneyReading,
  SKY_PENDING_REASON,
} from "./journey-reading";

const hands: PalmAnalysisResult = {
  status: "partial",
  retakeRecommended: true,
  simulated: false,
  disclaimer: "Aviso das mãos, do motor.",
  chapters: [
    {
      number: 6,
      title: "As características das suas mãos",
      status: "content",
      introduction: "Introdução exata do motor.",
      sections: [
        {
          text: "Seção exata.",
          observed: ["Palma quadrada."],
          notes: ["Nota exata."],
        },
      ],
      synthesis: "Síntese exata.",
      reflectionQuestions: ["Pergunta exata?"],
      limitations: ["Limite exato."],
      unavailableMessage: null,
    },
    {
      number: 7,
      title: "As linhas da sua palma",
      status: "unavailable",
      introduction: "",
      sections: [],
      synthesis: "",
      reflectionQuestions: [],
      limitations: [],
      unavailableMessage: "Mensagem exata de indisponível.",
    },
  ],
};

const renderWith = (initial: PalmAnalysisResult | null) =>
  render(
    <JourneyProvider initialHands={initial}>
      <JourneyReading />
    </JourneyProvider>,
  );

describe("leitura da jornada real (04B)", () => {
  it("capítulos 6 e 7 exatamente como vieram da prévia; avisos preservados", () => {
    renderWith(hands);
    for (const t of [
      "Introdução exata do motor.",
      "Seção exata.",
      "Palma quadrada.",
      "Nota exata.",
      "Síntese exata.",
      "Pergunta exata?",
      "Limite exato.",
      "Mensagem exata de indisponível.",
      "Aviso das mãos, do motor.",
    ])
      expect(screen.getByText(t)).toBeInTheDocument();
    expect(screen.getByText(/Leitura parcial/)).toBeInTheDocument();
    expect(screen.getByText(/Uma nova foto/)).toBeInTheDocument();
  });

  it("capítulos 1–5 em integração e 8–9 em definição: só títulos e resumos; nunca completo", () => {
    renderWith(hands);
    const c1 = screen
      .getByRole("heading", { level: 3, name: "Sua identidade astrológica" })
      .closest("article")!;
    expect(within(c1).getByText("Em integração")).toBeInTheDocument();
    expect(within(c1).getByText(SKY_PENDING_REASON)).toBeInTheDocument();
    const c9 = screen
      .getByRole("heading", { level: 3, name: "Seu guia pessoal de reflexão" })
      .closest("article")!;
    expect(within(c9).getByText("Em definição")).toBeInTheDocument();
    expect(screen.getByText(/Não é o relatório completo/)).toBeInTheDocument();
    expect(
      screen.getByText(/1 de 9 capítulos com leitura nesta versão/),
    ).toBeInTheDocument();
  });

  it("sem leitura na jornada: Parte II indisponível com o motivo, nada de exemplo", () => {
    const { container } = renderWith(null);
    expect(screen.getAllByText(HANDS_ABSENT_REASON)).toHaveLength(2);
    // Nenhum texto das bibliotecas de exemplo da demonstração.
    expect(container.textContent).not.toMatch(
      /Sol em|Palma de formato|Demonstração interna|observações fictícias/,
    );
  });
});
