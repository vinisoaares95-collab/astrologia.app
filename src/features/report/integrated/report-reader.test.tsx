import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import exact from "../../interpretation/ai/__fixtures__/library-report.exact.json";
import type { GeneratedReport } from "../../interpretation/ai/contract";
import { toClientReport } from "../../interpretation/ai/presentation";
import type { PalmAnalysisResult } from "../../palm-reading/chapters/presentation";
import { buildIntegratedReport } from "./build";
import { ReportReader, SYMBOLIC_NOTICE } from "./report-reader";

const sky = toClientReport(exact as unknown as GeneratedReport);
const hands: PalmAnalysisResult = {
  status: "partial",
  retakeRecommended: false,
  simulated: true,
  disclaimer: "Aviso das mãos.",
  chapters: [
    {
      number: 6,
      title: "As características das suas mãos",
      status: "content",
      introduction: "Introdução das mãos.",
      sections: [
        { text: "Leitura da palma.", observed: ["Palma quadrada."], notes: [] },
      ],
      synthesis: "Síntese das mãos.",
      reflectionQuestions: ["Pergunta?"],
      limitations: [],
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
      unavailableMessage: "As linhas não ficaram visíveis na foto.",
    },
  ],
};

const renderReport = (input: Parameters<typeof buildIntegratedReport>[0]) =>
  render(<ReportReader report={buildIntegratedReport(input)} />);

describe("ReportReader", () => {
  it("hierarquia: um h1, as três partes (h2) e os nove capítulos (h3)", () => {
    renderReport({
      sky: { state: "ready", report: sky },
      hands: { state: "ready", result: hands },
    });
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
    ).toEqual(["Seu Céu", "Suas Mãos", "Sua Jornada"]);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(9);
  });

  it("avisos de caráter simbólico visíveis, e o aviso de cada parte", () => {
    renderReport({
      sky: { state: "ready", report: sky },
      hands: { state: "ready", result: hands },
    });
    expect(screen.getAllByText(SYMBOLIC_NOTICE).length).toBeGreaterThanOrEqual(
      2,
    );
    expect(screen.getByText(sky.disclaimer)).toBeInTheDocument();
    expect(screen.getByText("Aviso das mãos.")).toBeInTheDocument();
    expect(screen.getByText(/Leitura simulada/)).toBeInTheDocument();
  });

  it("observado na foto separado; indisponível com o motivo do motor", () => {
    renderReport({
      sky: { state: "ready", report: sky },
      hands: { state: "ready", result: hands },
    });
    expect(screen.getByText("Observado na foto")).toBeInTheDocument();
    expect(screen.getByText("Palma quadrada.")).toBeInTheDocument();
    expect(
      screen.getByText("As linhas não ficaram visíveis na foto."),
    ).toBeInTheDocument();
  });

  it("capítulos 8 e 9 pendentes: só título e resumo de reportParts", () => {
    renderReport({
      sky: { state: "ready", report: sky },
      hands: { state: "ready", result: hands },
    });
    const c8 = screen
      .getByRole("heading", {
        level: 3,
        name: "Conexões simbólicas entre céu e mãos",
      })
      .closest("article")!;
    expect(
      within(c8).getByText(
        "Onde as duas leituras conversam — e onde divergem.",
      ),
    ).toBeInTheDocument();
    expect(within(c8).getByText("Em definição")).toBeInTheDocument();
    expect(within(c8).queryByText("Síntese")).toBeNull();
  });

  it("carregando: anúncio acessível e artigos marcados como ocupados", () => {
    renderReport({ sky: { state: "loading" }, hands: { state: "loading" } });
    expect(screen.getAllByRole("status")).toHaveLength(7);
    expect(document.querySelectorAll('article[aria-busy="true"]')).toHaveLength(
      7,
    );
  });

  it("sumários: dois landmarks de navegação com links para os nove capítulos e o estado em texto", () => {
    renderReport({
      sky: { state: "ready", report: sky },
      hands: { state: "ready", result: hands },
    });
    const navs = screen.getAllByRole("navigation", {
      name: "Sumário do relatório",
    });
    expect(navs).toHaveLength(2);
    for (const nav of navs) {
      const links = within(nav).getAllByRole("link");
      for (let n = 1; n <= 9; n++)
        expect(links.some((l) => l.getAttribute("href") === `#cap-${n}`)).toBe(
          true,
        );
    }
    expect(
      within(navs[0]).getByRole("link", {
        name: /As linhas da sua palma.*indisponível/,
      }),
    ).toBeInTheDocument();
    for (let n = 1; n <= 9; n++)
      expect(document.getElementById(`cap-${n}`)).not.toBeNull();
  });

  it("nada de preço, oferta ou checkout na leitura", () => {
    const { container } = renderReport({
      sky: { state: "ready", report: sky },
      hands: { state: "ready", result: hands },
    });
    expect(container.textContent).not.toMatch(
      /R\$|oferta|comprar|checkout|pagamento/i,
    );
  });
});
