import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createConsent, type PalmHand } from "../consent";
import type { LocalPhoto } from "../lib/load-image";
import { PalmPhotoProvider } from "../palm-photo-context";
import { PhotoCapture } from "./photo-capture";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const loadLocalPhoto = vi.hoisted(() => vi.fn());
vi.mock("../lib/load-image", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/load-image")>()),
  loadLocalPhoto,
}));

const consent = createConsent({ adult: true, analysis: true })!;

function setup(options: { consent?: boolean; hand?: PalmHand | null } = {}) {
  render(
    <PalmPhotoProvider
      initialConsent={options.consent === false ? null : consent}
      initialHand={options.hand === undefined ? "right" : options.hand}
    >
      <PhotoCapture />
    </PalmPhotoProvider>,
  );
  return userEvent.setup({ applyAccept: false });
}

const photo = (over: Partial<LocalPhoto> = {}): LocalPhoto => ({
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
  ...over,
});

describe("PhotoCapture", () => {
  it("sem consentimento ou sem mão escolhida, não oferece a câmera", () => {
    setup({ consent: false });
    expect(screen.getByText("Antes da foto")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /ir para o consentimento/i }),
    ).toHaveAttribute("href", "/leitura-das-maos/consentimento");
    expect(screen.queryByTestId("gallery-input")).not.toBeInTheDocument();
  });

  it("também exige a mão escolhida", () => {
    setup({ hand: null });
    expect(screen.queryByTestId("gallery-input")).not.toBeInTheDocument();
  });

  it("mostra as opções de captura e a mão escolhida", () => {
    setup({ hand: "left" });
    expect(
      screen.getByText("Adicione a foto da sua palma"),
    ).toBeInTheDocument();
    expect(screen.getByText(/palma da mão esquerda/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /escolher da galeria/i }),
    ).toBeEnabled();
  });

  it("exibe o erro devolvido para arquivos incompatíveis", async () => {
    loadLocalPhoto.mockResolvedValueOnce({
      ok: false,
      code: "unsupported-type",
      message: "Este formato não é aceito.",
    });
    const user = setup();
    await user.upload(
      screen.getByTestId("gallery-input"),
      new File(["%PDF"], "doc.pdf", { type: "application/pdf" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /formato não é aceito/i,
    );
  });

  it("câmera ou galeria fechadas sem foto: orienta sobre a permissão", () => {
    setup();
    fireEvent(screen.getByTestId("gallery-input"), new Event("cancel"));
    expect(screen.getByText("Nenhuma foto recebida")).toBeInTheDocument();
    expect(screen.getByText(/permissão para usá-la/i)).toBeInTheDocument();
  });

  it("erro inesperado no preparo vira mensagem, não tela quebrada", async () => {
    loadLocalPhoto.mockRejectedValueOnce(new Error("sem memória"));
    const user = setup();
    await user.upload(
      screen.getByTestId("gallery-input"),
      new File(["x"], "palma.jpg", { type: "image/jpeg" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /algo deu errado/i,
    );
  });

  it("pré-visualização: metadados removidos, avisos como aproximação e descarte", async () => {
    loadLocalPhoto.mockResolvedValueOnce({
      ok: true,
      photo: photo({
        quality: [{ code: "too-dark", message: "A foto parece escura." }],
      }),
    });
    const user = setup();
    await user.upload(
      screen.getByTestId("gallery-input"),
      new File(["x"], "palma.jpg", { type: "image/jpeg" }),
    );
    expect(
      await screen.findByAltText(/pré-visualização da foto/i),
    ).toHaveAttribute("src", "blob:preparada");
    expect(screen.getByText("Removidos")).toBeInTheDocument();
    expect(screen.getByText("Mão direita")).toBeInTheDocument();
    expect(screen.getByText("A foto parece escura.")).toBeInTheDocument();
    expect(screen.getByText(/não garante que as linhas/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /descartar/i }));
    expect(
      screen.getByText("Adicione a foto da sua palma"),
    ).toBeInTheDocument();
  });

  it("sem avisos, não promete precisão", async () => {
    loadLocalPhoto.mockResolvedValueOnce({ ok: true, photo: photo() });
    const user = setup();
    await user.upload(
      screen.getByTestId("gallery-input"),
      new File(["x"], "palma.jpg", { type: "image/jpeg" }),
    );
    expect(
      await screen.findByText(/não encontramos sinais evidentes/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/é aproximada/i)).toBeInTheDocument();
  });
});
