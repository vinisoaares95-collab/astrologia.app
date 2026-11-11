import { render, screen } from "@testing-library/react";
import { useEffect } from "react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CONSENT_VERSION } from "../consent";
import { PalmPhotoProvider, usePalmPhoto } from "../palm-photo-context";
import { ConsentForm } from "./consent-form";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

let state: ReturnType<typeof usePalmPhoto> | null = null;
const capture = (value: ReturnType<typeof usePalmPhoto>) => {
  state = value;
};
/** Expõe o estado do contexto ao teste (sem alterar variáveis no render). */
function Spy({ onState }: { onState: typeof capture }) {
  const value = usePalmPhoto();
  useEffect(() => onState(value), [value, onState]);
  return null;
}

function setup() {
  render(
    <PalmPhotoProvider>
      <ConsentForm />
      <Spy onState={capture} />
    </PalmPhotoProvider>,
  );
  return userEvent.setup();
}

describe("ConsentForm", () => {
  beforeEach(() => {
    push.mockClear();
    state = null;
  });

  it("explica a finalidade, a versão de teste e a retenção do provedor", () => {
    setup();
    expect(screen.getByText("Para que serve a foto")).toBeInTheDocument();
    expect(
      screen.getByText(/nada é enviado nem analisado/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/O Sidera não guarda a foto/i)).toBeInTheDocument();
    expect(screen.getByText(/apagados em até 30 dias/i)).toBeInTheDocument();
  });

  it("caixas começam desmarcadas e nada avança sem idade, autorização e mão", async () => {
    const user = setup();
    for (const box of screen.getAllByRole("checkbox"))
      expect(box).not.toBeChecked();
    await user.click(
      screen.getByRole("button", { name: /continuar para a foto/i }),
    );
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /18 anos ou mais.*autorize o uso da foto.*escolha a mão/i,
    );

    await user.click(screen.getByLabelText(/tenho 18 anos ou mais/i));
    await user.click(screen.getByLabelText(/autorizo o uso da foto/i));
    await user.click(
      screen.getByRole("button", { name: /continuar para a foto/i }),
    );
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/escolha a mão/i);
  });

  it("sem a confirmação de idade, não avança", async () => {
    const user = setup();
    await user.click(screen.getByLabelText(/autorizo o uso da foto/i));
    await user.click(screen.getByLabelText("Mão esquerda"));
    await user.click(
      screen.getByRole("button", { name: /continuar para a foto/i }),
    );
    expect(push).not.toHaveBeenCalled();
    expect(state!.consent).toBeNull();
  });

  it("registra consentimento (versão e data) e a mão escolhida, só em memória", async () => {
    const user = setup();
    await user.click(screen.getByLabelText(/tenho 18 anos ou mais/i));
    await user.click(screen.getByLabelText(/autorizo o uso da foto/i));
    await user.click(screen.getByLabelText("Mão esquerda"));
    await user.click(
      screen.getByRole("button", { name: /continuar para a foto/i }),
    );
    expect(push).toHaveBeenCalledWith("/leitura-das-maos/foto");
    expect(state!.hand).toBe("left");
    expect(state!.consent).toMatchObject({
      version: CONSENT_VERSION,
      adult: true,
      analysis: true,
    });
    expect(Number.isNaN(Date.parse(state!.consent!.acceptedAt))).toBe(false);
    // Retirar o consentimento descarta tudo.
    await user.click(
      screen.getByRole("button", { name: /retirar consentimento/i }),
    );
    expect(state!.consent).toBeNull();
    expect(state!.hand).toBeNull();
  });
});
