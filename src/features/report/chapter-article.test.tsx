import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
  ChapterArticle,
  LIMITATION_DETAILS_TITLE,
  type ChapterArticleData,
} from "./chapter-article";

const base: ChapterArticleData = {
  number: 8,
  title: "Conexões simbólicas entre céu e mãos",
  status: "content",
  introduction: "Introdução.",
  sections: [{ heading: "Tema", text: "Texto do tema." }],
  synthesis: "Síntese.",
  reflectionQuestions: [],
  limitations: ["Aviso essencial."],
  limitationDetails: ["Exclusão A.", "Escopo.", "Leitura simulada."],
  unavailableMessage: null,
};

describe("ChapterArticle: ressalvas em dois níveis (04E.2A)", () => {
  it("aviso essencial visível; detalhes técnicos recolhidos, completos e expansíveis", async () => {
    const user = userEvent.setup();
    const { container } = render(<ChapterArticle chapter={base} />);
    expect(screen.getByText("Aviso essencial.")).toBeVisible();
    const details = container.querySelector("details")!;
    expect(details.open).toBe(false);
    const summary = within(details).getByText(LIMITATION_DETAILS_TITLE, {
      exact: false,
    });
    expect(summary.closest("summary")).toHaveTextContent(
      `${LIMITATION_DETAILS_TITLE} (3)`,
    );
    // Conteúdo integral no documento (só recolhido), na ordem recebida.
    expect(
      [...details.querySelectorAll("li")].map((li) => li.textContent),
    ).toEqual(base.limitationDetails);
    await user.click(summary);
    expect(details.open).toBe(true);
    await user.click(summary);
    expect(details.open).toBe(false);
  });

  it("sem detalhes técnicos: lista simples, sem seção expansível", () => {
    const { container } = render(
      <ChapterArticle
        chapter={{ ...base, limitationDetails: undefined, limitations: ["L."] }}
      />,
    );
    expect(container.querySelector("details")).toBeNull();
    expect(screen.getByText("Limites desta leitura")).toBeInTheDocument();
    expect(screen.getByText("L.")).toBeInTheDocument();
  });

  it("indisponível: a mensagem nunca fica recolhida", () => {
    const { container } = render(
      <ChapterArticle
        chapter={{
          ...base,
          status: "unavailable",
          sections: [],
          limitations: [],
          limitationDetails: undefined,
          unavailableMessage: "Motivo real.",
        }}
      />,
    );
    expect(screen.getByText("Motivo real.")).toBeVisible();
    expect(container.querySelector("details")).toBeNull();
  });
});
