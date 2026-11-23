/** Saída do fluxo com o pedido do recibo em andamento (03G.3, D5). */
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Activity } from "react";
import { describe, expect, it, vi } from "vitest";

import { PalmPhotoProvider } from "../palm-photo-context";
import { ConsentForm } from "./consent-form";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

vi.mock("../lib/use-analysis-availability", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("../lib/use-analysis-availability")
  >()),
  useAnalysisAvailability: () => ({
    status: "ready",
    enabled: true,
    simulated: true,
  }),
}));

const requestConsentReceipt = vi.hoisted(() => vi.fn());
vi.mock("../lib/analysis-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/analysis-client")>()),
  requestConsentReceipt,
}));

describe("ConsentForm ao sair do fluxo (D5)", () => {
  it("recibo que chega depois da saída não volta e não navega; ao voltar, caixas desmarcadas", async () => {
    let resolve!: (v: unknown) => void;
    requestConsentReceipt.mockImplementationOnce(
      () => new Promise((r) => (resolve = r)),
    );
    const tree = (mode: "visible" | "hidden") => (
      <Activity mode={mode}>
        <PalmPhotoProvider>
          <ConsentForm />
        </PalmPhotoProvider>
      </Activity>
    );
    const { rerender, container } = render(tree("visible"));
    const user = userEvent.setup();
    for (const box of screen.getAllByRole("checkbox")) await user.click(box);
    await user.click(screen.getByRole("radio", { name: /direita/i }));
    await user.click(
      screen.getByRole("button", { name: /continuar para a foto/i }),
    );
    expect(requestConsentReceipt).toHaveBeenCalledTimes(1);

    rerender(tree("hidden"));
    await act(async () => {
      resolve({
        ok: true,
        receipt: { token: "recibo.atrasado", expiresAt: 1, remaining: 3 },
      });
    });
    expect(push).not.toHaveBeenCalled();
    expect(container.innerHTML).not.toMatch(/recibo\.atrasado/);

    rerender(tree("visible"));
    for (const box of screen.getAllByRole("checkbox"))
      expect(box).not.toBeChecked();
    expect(screen.getByRole("radio", { name: /direita/i })).not.toBeChecked();
  });
});
