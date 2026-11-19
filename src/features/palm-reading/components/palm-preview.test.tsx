/**
 * Prévia (03F.2, Etapa B): com análise, só o que foi gerado para a foto;
 * sem análise, a demonstração fica separada e identificada.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { PalmAnalysisResult } from "../chapters/presentation";
import { createConsent } from "../consent";
import type { LocalPhoto } from "../lib/load-image";
import { PalmPhotoProvider, usePalmPhoto } from "../palm-photo-context";
import { DemoPreview } from "./demo-preview";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const photo: LocalPhoto = {
  url: "blob:preparada",
  blob: new Blob(["x"], { type: "image/jpeg" }),
  fileName: "palma.jpg",
  width: 1200,
  height: 1600,
  sizeBytes: 1000,
  original: { width: 1200, height: 1600, sizeBytes: 1000 },
  metadataRemoved: true,
  hints: [],
  quality: [],
};
const chapter = (n: 6 | 7, status: "content" | "unavailable") => ({
  number: n,
  title:
    n === 6 ? "As características das suas mãos" : "As linhas da sua palma",
  status,
  introduction: status === "content" ? `Introdução do capítulo ${n}.` : "",
  sections: [],
  synthesis: status === "content" ? `Síntese ${n}.` : "",
  reflectionQuestions: [],
  limitations: [],
  unavailableMessage: status === "content" ? null : `Indisponível ${n}.`,
});

function Seed({ analysis }: { analysis: PalmAnalysisResult | null }) {
  const ctx = usePalmPhoto();
  if (!ctx.photo) {
    ctx.setPhoto(photo);
    return null;
  }
  if (analysis && !ctx.analysis) {
    ctx.setAnalysis(analysis);
    return null;
  }
  return <DemoPreview />;
}

const renderWith = (analysis: PalmAnalysisResult | null) =>
  render(
    <PalmPhotoProvider
      initialConsent={createConsent({ adult: true, analysis: true })!}
      initialHand="right"
    >
      <Seed analysis={analysis} />
    </PalmPhotoProvider>,
  );

const result = (
  chapters: ReturnType<typeof chapter>[],
): PalmAnalysisResult => ({
  status: "partial",
  retakeRecommended: false,
  simulated: false,
  disclaimer: "Leitura simbólica.",
  chapters,
});

describe("prévia", () => {
  it("com análise: nenhum exemplo fixo nem promessa de personalização futura", async () => {
    renderWith(result([chapter(6, "content"), chapter(7, "unavailable")]));
    expect(
      await screen.findByText("Introdução do capítulo 6."),
    ).toBeInTheDocument();
    expect(screen.getByText("Indisponível 7.")).toBeInTheDocument();
    for (const t of [
      /exemplo fixo/i,
      /não personalizado/i,
      /as três linhas principais/i,
      /tradicionalmente associada/i,
      /na versão final/i,
      /demonstração/i,
      /duração/i,
    ])
      expect(screen.queryByText(t)).not.toBeInTheDocument();
    expect(screen.getAllByText("Leitura parcial").length).toBeGreaterThan(0);
    // Seguir e tirar outra foto.
    expect(
      screen.getByRole("link", { name: /continuar: dados de nascimento/i }),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: /tirar outra foto/i }),
    );
    expect(push).toHaveBeenCalledWith("/leitura-das-maos/foto");
  });

  it("com ambos indisponíveis: não conduz à próxima etapa", async () => {
    renderWith(result([chapter(6, "unavailable"), chapter(7, "unavailable")]));
    expect(await screen.findByText("Indisponível 6.")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /continuar: dados de nascimento/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /tirar outra foto/i }),
    ).toBeInTheDocument();
  });

  it("sem análise: demonstração separada e identificada, sem negar a duração da vida", async () => {
    renderWith(null);
    expect(
      await screen.findByText(/demonstração — sua foto não foi analisada/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Exemplo fixo")).toBeInTheDocument();
    expect(screen.queryByText(/duração/i)).not.toBeInTheDocument();
  });
});
