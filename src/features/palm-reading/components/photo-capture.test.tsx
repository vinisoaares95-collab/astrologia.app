import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PalmPhotoProvider } from "../palm-photo-context";
import { PhotoCapture } from "./photo-capture";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function setup() {
  render(
    <PalmPhotoProvider>
      <PhotoCapture />
    </PalmPhotoProvider>,
  );
  return userEvent.setup({ applyAccept: false });
}

describe("PhotoCapture", () => {
  it("mostra as opções de captura no estado inicial", () => {
    setup();
    expect(
      screen.getByText("Adicione a foto da sua palma"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /escolher da galeria/i }),
    ).toBeEnabled();
  });

  it("exibe erro para arquivos que não são imagem", async () => {
    const user = setup();
    const input = screen.getByTestId("gallery-input");
    await user.upload(
      input,
      new File(["%PDF"], "doc.pdf", { type: "application/pdf" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /formato não é aceito/i,
    );
  });
});
