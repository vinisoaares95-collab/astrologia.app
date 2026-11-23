import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { PalmAnalysisResult } from "@/features/palm-reading/chapters/presentation";

import exact from "@/features/interpretation/ai/__fixtures__/library-report.exact.json";
import type { GeneratedReport } from "@/features/interpretation/ai/contract";
import { toClientReport } from "@/features/interpretation/ai/presentation";

import { JourneyProvider, type JourneySky } from "./journey-context";
import {
  HANDS_ABSENT_REASON,
  JourneyReading,
  SKY_ABSENT_REASON,
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

const skyReport = toClientReport(exact as unknown as GeneratedReport);

const renderWith = (
  initial: PalmAnalysisResult | null,
  sky: JourneySky | null = null,
) =>
  render(
    <JourneyProvider initialHands={initial} initialSky={sky}>
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

  it("capítulos 1–5 da biblioteca exatamente como o motor entregou; 8–9 em definição; nunca completo", () => {
    renderWith(hands, { state: "ready", report: skyReport });
    for (const c of skyReport.chapters) {
      const article = screen
        .getByRole("heading", { level: 3, name: c.title })
        .closest("article")!;
      expect(within(article).getByText(c.introduction)).toBeInTheDocument();
      expect(within(article).getByText(c.synthesis)).toBeInTheDocument();
    }
    const c9 = screen
      .getByRole("heading", { level: 3, name: "Seu guia pessoal de reflexão" })
      .closest("article")!;
    expect(within(c9).getByText("Em definição")).toBeInTheDocument();
    expect(screen.queryByText("Em integração")).toBeNull();
    expect(screen.getByText(skyReport.disclaimer)).toBeInTheDocument();
    expect(screen.getByText(/Não é o relatório completo/)).toBeInTheDocument();
    // 5 do céu + capítulo 6 (o 7 está indisponível no exemplo).
    expect(
      screen.getByText(/6 de 9 capítulos com leitura nesta versão/),
    ).toBeInTheDocument();
  });

  it("céu carregando: capítulos ocupados, mãos intactas", () => {
    renderWith(hands, { state: "loading" });
    expect(document.querySelectorAll('article[aria-busy="true"]')).toHaveLength(
      5,
    );
    expect(screen.getByText("Introdução exata do motor.")).toBeInTheDocument();
  });

  it("falha no cálculo: Parte I indisponível com o motivo, sem apagar as mãos", () => {
    renderWith(hands, { state: "unavailable", reason: "Motivo do cálculo." });
    expect(screen.getAllByText("Motivo do cálculo.")).toHaveLength(5);
    expect(screen.getByText("Introdução exata do motor.")).toBeInTheDocument();
    expect(
      screen.getByText("Mensagem exata de indisponível."),
    ).toBeInTheDocument();
  });

  it("sem confirmação do nascimento: motivo explicado, nada de exemplo", () => {
    const { container } = renderWith(hands, null);
    expect(screen.getAllByText(SKY_ABSENT_REASON)).toHaveLength(5);
    expect(container.textContent).not.toMatch(/Sol em Touro/);
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
