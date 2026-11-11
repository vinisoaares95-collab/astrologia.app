/**
 * Apresentação dos capítulos 6 e 7 (Fase 03E) com resultados FICTÍCIOS
 * produzidos pelos provedores simulados.
 */
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChapterArticle } from "@/features/report/chapter-article";

import {
  clearHand,
  insufficientPhoto,
  linesMissing,
  partialHand,
} from "../analysis/__fixtures__/observations";
import { PARTIAL_CAVEAT } from "../analysis/library";
import { validatePalmObservation } from "../analysis/validate-observation";
import { composePalmReading } from "../chapters/compose";
import { createMockPalmTextProvider } from "../chapters/mock-text-provider";
import type { PalmAnalysisResult } from "../chapters/presentation";
import { DemoPreview } from "./demo-preview";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const palm = vi.hoisted(() => ({ analysis: null as unknown }));
vi.mock("../palm-photo-context", () => ({
  usePalmPhoto: () => ({
    photo: { url: "blob:foto" },
    hand: "right",
    withdraw: vi.fn(),
    analysis: palm.analysis,
  }),
}));

async function resultOf(raw: unknown): Promise<PalmAnalysisResult> {
  const r = validatePalmObservation(
    raw,
    (raw as { hand: "right" | "left" }).hand,
  );
  if (!r.ok) throw new Error("fixture inválida");
  const { result } = await composePalmReading({
    observation: r.observation,
    textProvider: createMockPalmTextProvider(),
    simulated: true,
  });
  return result;
}

describe("capítulo redigido", () => {
  it("observação separada da leitura, síntese, perguntas e limites", async () => {
    const result = await resultOf(clearHand());
    const chapter = result.chapters[1];
    render(<ChapterArticle chapter={chapter} />);
    const article = screen.getByRole("article", {
      name: "As linhas da sua palma",
    });
    expect(within(article).getByText("07")).toBeInTheDocument();
    expect(
      within(article).getAllByText("Observado na foto").length,
    ).toBeGreaterThan(0);
    // A frase observada não se mistura ao parágrafo simbólico.
    const observed = chapter.sections[0].observed[0];
    const observedEl = within(article).getByText(observed);
    expect(observedEl.tagName).toBe("LI");
    expect(within(article).getByText(chapter.sections[0].text).tagName).toBe(
      "P",
    );
    expect(within(article).getByText("Síntese")).toBeInTheDocument();
    expect(within(article).getByText("Para refletir")).toBeInTheDocument();
    for (const q of chapter.reflectionQuestions)
      expect(within(article).getByText(q)).toBeInTheDocument();
  });

  it("ressalva de leitura parcial aparece junto da seção", async () => {
    const result = await resultOf(partialHand());
    const chapter = result.chapters.find((c) =>
      c.sections.some((s) => s.notes.length > 0),
    )!;
    render(<ChapterArticle chapter={chapter} />);
    expect(screen.getByText(PARTIAL_CAVEAT)).toBeInTheDocument();
  });

  it("capítulo indisponível: mensagem específica, sem texto inventado", async () => {
    const result = await resultOf(linesMissing());
    render(<ChapterArticle chapter={result.chapters[1]} />);
    expect(
      screen.getByText("Esta parte não pôde ser lida"),
    ).toBeInTheDocument();
    expect(screen.getByText(/nova foto/u)).toBeInTheDocument();
    expect(screen.queryByText("Síntese")).not.toBeInTheDocument();
    expect(screen.queryByText("Observado na foto")).not.toBeInTheDocument();
  });
});

describe("prévia com a leitura", () => {
  beforeEach(() => {
    palm.analysis = null;
  });

  it("sem análise: demonstração fixa, capítulos 6 e 7 bloqueados", () => {
    render(<DemoPreview />);
    expect(
      screen.getByText("Demonstração — sua foto não foi analisada"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(screen.getByText("As linhas da sua palma")).toBeInTheDocument();
  });

  it("com análise simulada: os dois capítulos, aviso de simulação, nada técnico", async () => {
    palm.analysis = await resultOf(clearHand());
    const { container } = render(<DemoPreview />);
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.getByText("Resultado simulado")).toBeInTheDocument();
    expect(
      screen.queryByText("Demonstração — sua foto não foi analisada"),
    ).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(
      /biblioteca|fallback|maos:|linhas:|modelo|custo|US\$/iu,
    );
  });

  it("foto insuficiente: os dois capítulos com orientação para nova foto", async () => {
    palm.analysis = await resultOf(insufficientPhoto());
    render(<DemoPreview />);
    expect(screen.getAllByText("Esta parte não pôde ser lida")).toHaveLength(2);
  });
});
