import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Activity } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createConsent } from "../consent";
import type { LocalPhoto } from "../lib/load-image";
import { PalmPhotoProvider } from "../palm-photo-context";
import type { PalmAnalysisResult } from "../chapters/presentation";
import { PhotoCapture } from "./photo-capture";
import { emptyHandsBridge } from "@/features/report/journey-chapters/test-support";

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
vi.mock("../lib/use-analysis-availability", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("../lib/use-analysis-availability")
  >()),
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
const chapter = (n: 6 | 7) => ({
  number: n,
  title:
    n === 6 ? "As características das suas mãos" : "As linhas da sua palma",
  introduction: "",
  sections: [],
  synthesis: "",
  reflectionQuestions: [],
  limitations: [],
});
const content = (n: 6 | 7) => ({
  ...chapter(n),
  status: "content" as const,
  unavailableMessage: null,
});
const unavailable = (n: 6 | 7, message: string) => ({
  ...chapter(n),
  status: "unavailable" as const,
  unavailableMessage: message,
});
const result = (
  over: Partial<PalmAnalysisResult> = {},
): PalmAnalysisResult => ({
  status: "complete",
  retakeRecommended: false,
  simulated: true,
  disclaimer: "Leitura simbólica.",
  chapters: [content(6), content(7)],
  bridge: emptyHandsBridge(),
  ...over,
});

async function withPhoto(receipt = true, remaining?: number) {
  loadLocalPhoto.mockResolvedValueOnce({ ok: true, photo });
  render(
    <PalmPhotoProvider
      initialConsent={consent}
      initialHand="right"
      initialReceipt={
        receipt ? { token: "recibo", expiresAt: 1, remaining } : null
      }
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
    expect(requestPalmAnalysis).toHaveBeenCalledWith(
      photo.blob,
      expect.objectContaining({ token: "recibo", expiresAt: 1 }),
      undefined,
      expect.any(AbortSignal), // abortado se a pessoa sair do fluxo (D5)
      expect.stringMatching(/^[A-Za-z0-9_-]{22,64}$/), // idempotência (Bloco 2)
    );
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

  it("ambos os capítulos indisponíveis: explica, oferece nova foto e não segue", async () => {
    const user = await withPhoto();
    requestPalmAnalysis.mockResolvedValueOnce({
      ok: true,
      result: result({
        status: "insufficient",
        retakeRecommended: true,
        chapters: [
          unavailable(6, "Mãos fora do quadro."),
          unavailable(7, "Linhas não visíveis."),
        ],
      }),
      remaining: 2,
    });
    await user.click(analyzeButton());
    expect(
      await screen.findByText("Esta foto não permitiu a leitura"),
    ).toBeInTheDocument();
    expect(screen.getByText("Mãos fora do quadro.")).toBeInTheDocument();
    expect(screen.getByText("Linhas não visíveis.")).toBeInTheDocument();
    expect(
      screen.getByText("Restam 2 análises nesta sessão."),
    ).toBeInTheDocument();
    // Nova foto como ação principal; sem caminho para seguir.
    expect(
      screen.getByRole("button", { name: /tirar outra foto/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /seguir com esta leitura/i }),
    ).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("um capítulo indisponível: motivo e orientação, nova foto primeiro, seguir é opcional", async () => {
    const user = await withPhoto();
    requestPalmAnalysis.mockResolvedValueOnce({
      ok: true,
      result: result({
        status: "partial",
        chapters: [
          content(6),
          unavailable(7, "As linhas não ficaram visíveis."),
        ],
      }),
      remaining: 2,
    });
    await user.click(analyzeButton());
    expect(
      await screen.findByText("Uma parte da leitura não pôde ser feita"),
    ).toBeInTheDocument();
    expect(screen.getByText("Pronto")).toBeInTheDocument();
    expect(
      screen.getByText("As linhas não ficaram visíveis."),
    ).toBeInTheDocument();
    const buttons = screen
      .getAllByRole("button")
      .map((b) => b.textContent ?? "");
    const at = (t: string) => buttons.findIndex((b) => b.startsWith(t));
    expect(at("Tirar outra foto")).toBeGreaterThanOrEqual(0);
    expect(at("Tirar outra foto")).toBeLessThan(at("Seguir com esta leitura"));
    expect(push).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", { name: /seguir com esta leitura/i }),
    );
    expect(push).toHaveBeenCalledWith("/leitura-das-maos/previa");
  });

  it("parcial com pouco observado e ambos com conteúdo: recomenda nova foto, permite seguir", async () => {
    const user = await withPhoto();
    requestPalmAnalysis.mockResolvedValueOnce({
      ok: true,
      result: result({
        status: "partial",
        retakeRecommended: true,
        chapters: [content(6), content(7)],
        bridge: emptyHandsBridge(),
      }),
      remaining: 1,
    });
    await user.click(analyzeButton());
    expect(
      await screen.findByText("A leitura ficou parcial"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Resta 1 análise nesta sessão."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /seguir com esta leitura/i }),
    ).toBeInTheDocument();
  });

  it("sem análises restantes: não oferece nova foto; segue com o que houver", async () => {
    const user = await withPhoto();
    requestPalmAnalysis.mockResolvedValueOnce({
      ok: true,
      result: result({
        status: "partial",
        chapters: [content(6), unavailable(7, "Linhas não visíveis.")],
      }),
      remaining: 0,
    });
    await user.click(analyzeButton());
    expect(
      await screen.findByText(
        /usou as análises desta sessão. Siga com a leitura obtida/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /tirar outra foto/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /seguir com esta leitura/i }),
    ).toBeInTheDocument();
  });

  it("análises disponíveis aparecem antes do envio e são atualizadas", async () => {
    const user = await withPhoto(true, 3);
    expect(screen.getByTestId("remaining")).toHaveTextContent(
      "3 análises disponíveis nesta sessão",
    );
    requestPalmAnalysis.mockResolvedValueOnce({
      ok: false,
      error: "temporarily_unavailable",
      remaining: 3,
    });
    await user.click(analyzeButton());
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /não foi contada/i,
    );
    expect(screen.getByTestId("remaining")).toHaveTextContent("3 análises");
  });

  it("nova foto preserva a análise anterior até a pessoa decidir", async () => {
    const user = await withPhoto();
    requestPalmAnalysis.mockResolvedValueOnce({
      ok: true,
      result: result({
        status: "partial",
        chapters: [content(6), unavailable(7, "Linhas não visíveis.")],
      }),
      remaining: 2,
    });
    await user.click(analyzeButton());
    await screen.findByText("Uma parte da leitura não pôde ser feita");
    // Substitui pela galeria (o mesmo vale para a câmera).
    loadLocalPhoto.mockResolvedValueOnce({
      ok: true,
      photo: { ...photo, url: "blob:nova" },
    });
    await user.upload(
      screen.getByTestId("camera-input"),
      new File(["y"], "nova.jpg", { type: "image/jpeg" }),
    );
    expect(await screen.findByAltText(/pré-visualização/i)).toHaveAttribute(
      "src",
      "blob:nova",
    );
    await user.click(
      screen.getByRole("button", { name: /voltar à foto analisada antes/i }),
    );
    expect(await screen.findByAltText(/pré-visualização/i)).toHaveAttribute(
      "src",
      "blob:preparada",
    );
    expect(
      screen.getByText("Uma parte da leitura não pôde ser feita"),
    ).toBeInTheDocument();
  });

  it("espera esgotada no aparelho: mensagem própria e a mesma foto pode ser reenviada", async () => {
    const user = await withPhoto();
    requestPalmAnalysis.mockResolvedValueOnce({
      ok: false,
      error: "timeout",
      remaining: null,
    });
    await user.click(analyzeButton());
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /demorou mais que o esperado/i,
    );
    expect(analyzeButton()).toBeEnabled();
  });

  it("durante a análise: mensagem realista de tempo e ações bloqueadas", async () => {
    const user = await withPhoto();
    let resolve!: (v: unknown) => void;
    requestPalmAnalysis.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    await user.click(analyzeButton());
    expect(await screen.findByText(/de 20 a 40 segundos/i)).toBeInTheDocument();
    expect(screen.queryByText(/alguns segundos/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /analisando/i })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /descartar foto/i }),
    ).toBeDisabled();
    resolve({ ok: true, result: result(), remaining: 2 });
  });

  it.each([
    ["temporarily_unavailable", /falha temporária/i],
    ["rate_limited", /limite de análises atingido/i],
    ["processing_limit", /limite de processamento atingido/i],
    ["retake_required", /precisamos de outra foto/i],
    ["invalid_image", /não passou na conferência/i],
  ])("erro %s tem mensagem própria", async (code, title) => {
    const user = await withPhoto();
    requestPalmAnalysis.mockResolvedValueOnce({
      ok: false,
      error: code,
      remaining: 2,
    });
    await user.click(analyzeButton());
    expect(await screen.findByRole("alert")).toHaveTextContent(title);
    expect(push).not.toHaveBeenCalled();
  });
});

describe("saída do fluxo com a análise em andamento (D5)", () => {
  beforeEach(() => {
    push.mockClear();
    requestPalmAnalysis.mockReset();
    availability.current = { status: "ready", enabled: true, simulated: true };
  });

  it("resposta atrasada não restaura nada nem navega", async () => {
    loadLocalPhoto.mockResolvedValueOnce({ ok: true, photo });
    let resolve!: (v: unknown) => void;
    let signal: AbortSignal | undefined;
    requestPalmAnalysis.mockImplementationOnce(
      (_b: Blob, _r: unknown, _f: unknown, s: AbortSignal) => {
        signal = s;
        return new Promise((r) => (resolve = r));
      },
    );
    const tree = (mode: "visible" | "hidden") => (
      <Activity mode={mode}>
        <PalmPhotoProvider
          initialConsent={consent}
          initialHand="right"
          initialReceipt={{ token: "recibo", expiresAt: 1, remaining: 3 }}
        >
          <PhotoCapture />
        </PalmPhotoProvider>
      </Activity>
    );
    const { rerender, container } = render(tree("visible"));
    const user = userEvent.setup({ applyAccept: false });
    await user.upload(
      screen.getByTestId("gallery-input"),
      new File(["x"], "palma.jpg", { type: "image/jpeg" }),
    );
    await screen.findByAltText(/pré-visualização da foto/i);
    await user.click(analyzeButton());

    rerender(tree("hidden")); // a pessoa saiu para a página inicial
    expect(signal?.aborted).toBe(true);
    await act(async () => {
      resolve({ ok: true, result: result(), remaining: 2 });
    });
    expect(push).not.toHaveBeenCalled();
    expect(container.innerHTML).not.toMatch(/blob:preparada|recibo/);

    rerender(tree("visible")); // voltou pelo navegador
    expect(screen.getByText("Antes da foto")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /ir para o consentimento/i }),
    ).toBeInTheDocument();
    expect(screen.queryByAltText(/pré-visualização da foto/i)).toBeNull();
  });

  it("foto preparada depois da saída é descartada na hora", async () => {
    let resolve!: (v: unknown) => void;
    loadLocalPhoto.mockImplementationOnce(
      () => new Promise((r) => (resolve = r)),
    );
    const revoke = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    const tree = (mode: "visible" | "hidden") => (
      <Activity mode={mode}>
        <PalmPhotoProvider initialConsent={consent} initialHand="right">
          <PhotoCapture />
        </PalmPhotoProvider>
      </Activity>
    );
    const { rerender } = render(tree("visible"));
    const user = userEvent.setup({ applyAccept: false });
    await user.upload(
      screen.getByTestId("gallery-input"),
      new File(["x"], "palma.jpg", { type: "image/jpeg" }),
    );
    rerender(tree("hidden"));
    await act(async () => {
      resolve({ ok: true, photo: { ...photo, url: "blob:atrasada" } });
    });
    expect(revoke).toHaveBeenCalledWith("blob:atrasada");
    rerender(tree("visible"));
    expect(screen.getByText("Antes da foto")).toBeInTheDocument();
    revoke.mockRestore();
  });
});
