import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createConsent } from "../consent";
import type { LocalPhoto } from "../lib/load-image";
import { PalmPhotoProvider } from "../palm-photo-context";
import type { PalmAnalysisResult } from "../chapters/presentation";
import { PhotoCapture } from "./photo-capture";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const loadLocalPhoto = vi.hoisted(() => vi.fn());
vi.mock("../lib/load-image", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/load-image")>()),
  loadLocalPhoto,
}));

const availability = vi.hoisted(() => ({
  current: { status: "ready", enabled: true, simulated: true } as Record<
    string,
    unknown
  >,
}));
vi.mock("../lib/use-analysis-availability", () => ({
  useAnalysisAvailability: () => availability.current,
}));

const requestPalmAnalysis = vi.hoisted(() => vi.fn());
vi.mock("../lib/analysis-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/analysis-client")>()),
  requestPalmAnalysis,
}));

const consent = createConsent({ adult: true, analysis: true })!;
const photo: LocalPhoto = {
  url: "blob:preparada",
  blob: new Blob(["x"], { type: "image/jpeg" }),
  fileName: "palma.jpg",
  width: 1652,
  height: 2212,
  sizeBytes: 900_000,
  original: { width: 3024, height: 4032, sizeBytes: 4_000_000 },
  metadataRemoved: true,
  hints: [],
  quality: [],
};
const result = (
  over: Partial<PalmAnalysisResult> = {},
): PalmAnalysisResult => ({
  status: "complete",
  retakeRecommended: false,
  simulated: true,
  disclaimer: "Leitura simbólica.",
  chapters: [],
  ...over,
});

async function withPhoto(receipt = true) {
  loadLocalPhoto.mockResolvedValueOnce({ ok: true, photo });
  render(
    <PalmPhotoProvider
      initialConsent={consent}
      initialHand="right"
      initialReceipt={receipt ? { token: "recibo", expiresAt: 1 } : null}
    >
      <PhotoCapture />
    </PalmPhotoProvider>,
  );
  const user = userEvent.setup({ applyAccept: false });
  await user.upload(
    screen.getByTestId("gallery-input"),
    new File(["x"], "palma.jpg", { type: "image/jpeg" }),
  );
  await screen.findByAltText(/pré-visualização da foto/i);
  return user;
}

const analyzeButton = () =>
  screen.getByRole("button", { name: /analisar a foto/i });

describe("análise na jornada (provedor simulado)", () => {
  beforeEach(() => {
    push.mockClear();
    requestPalmAnalysis.mockReset();
    availability.current = { status: "ready", enabled: true, simulated: true };
  });

  it("com a análise desligada, nada é enviado (fluxo da 03B)", async () => {
    availability.current = { status: "ready", enabled: false };
    await withPhoto();
    expect(
      screen.queryByRole("button", { name: /analisar/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /usar esta foto/i }),
    ).toBeEnabled();
    expect(requestPalmAnalysis).not.toHaveBeenCalled();
  });

  it("simulação é anunciada; resultado completo segue para a prévia", async () => {
    const user = await withPhoto();
    expect(screen.getByText("Análise simulada")).toBeInTheDocument();
    expect(analyzeButton()).toHaveTextContent("(simulação)");
    requestPalmAnalysis.mockResolvedValueOnce({ ok: true, result: result() });
    await user.click(analyzeButton());
    expect(requestPalmAnalysis).toHaveBeenCalledWith(photo.blob, {
      token: "recibo",
      expiresAt: 1,
    });
    expect(push).toHaveBeenCalledWith("/leitura-das-maos/previa");
  });

  it("sem recibo de consentimento: pede para confirmar de novo, sem enviar", async () => {
    const user = await withPhoto(false);
    await user.click(analyzeButton());
    expect(requestPalmAnalysis).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /confirme o consentimento de novo/i,
    );
    expect(
      screen.getByRole("link", { name: /confirmar consentimento/i }),
    ).toHaveAttribute("href", "/leitura-das-maos/consentimento");
  });

  it("imagem insuficiente: pede outra foto e não segue", async () => {
    const user = await withPhoto();
    requestPalmAnalysis.mockResolvedValueOnce({
      ok: true,
      result: result({ status: "insufficient", retakeRecommended: true }),
    });
    await user.click(analyzeButton());
    expect(
      await screen.findByText("A foto não permitiu a análise"),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(analyzeButton()).toBeDisabled();
  });

  it("parcial com pouco observado: recomenda outra foto, mas permite seguir", async () => {
    const user = await withPhoto();
    requestPalmAnalysis.mockResolvedValueOnce({
      ok: true,
      result: result({ status: "partial", retakeRecommended: true }),
    });
    await user.click(analyzeButton());
    expect(
      await screen.findByText("Só parte da palma pôde ser observada"),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /seguir com esta análise/i }),
    );
    expect(push).toHaveBeenCalledWith("/leitura-das-maos/previa");
  });

  it.each([
    ["temporarily_unavailable", /falha temporária/i],
    ["rate_limited", /limite de análises atingido/i],
    ["processing_limit", /limite de processamento atingido/i],
    ["retake_required", /precisamos de outra foto/i],
    ["invalid_image", /não passou na conferência/i],
  ])("erro %s tem mensagem própria", async (code, title) => {
    const user = await withPhoto();
    requestPalmAnalysis.mockResolvedValueOnce({ ok: false, error: code });
    await user.click(analyzeButton());
    expect(await screen.findByRole("alert")).toHaveTextContent(title);
    expect(push).not.toHaveBeenCalled();
  });
});
