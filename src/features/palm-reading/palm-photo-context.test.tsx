/**
 * Saída do fluxo (03G.3, D5): com cacheComponents, o Next.js esconde a rota
 * com <Activity> em vez de desmontá-la. Estes testes usam o próprio
 * <Activity> do React para simular a saída e o retorno.
 */
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Activity, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createConsent } from "./consent";
import * as client from "./lib/analysis-client";
import type { LocalPhoto } from "./lib/load-image";
import {
  PalmPhotoProvider,
  usePalmPhoto,
  type FlowTask,
} from "./palm-photo-context";

const consent = createConsent({ adult: true, analysis: true })!;
const receipt = { token: "recibo.assinado", expiresAt: 1, remaining: 3 };
const photo = (url: string): LocalPhoto => ({
  url,
  blob: new Blob(["foto"], { type: "image/jpeg" }),
  fileName: "palma.jpg",
  width: 1200,
  height: 1600,
  sizeBytes: 4,
  original: { width: 3000, height: 4000, sizeBytes: 9 },
  metadataRemoved: true,
  hints: [],
  quality: [],
});

let task: FlowTask | null = null;

/** Mostra o estado do fluxo e guarda um estado local, como as telas. */
function Probe() {
  const ctx = usePalmPhoto();
  const [local, setLocal] = useState(0);
  return (
    <div>
      <p data-testid="state">
        {JSON.stringify({
          photo: ctx.photo?.url ?? null,
          consent: Boolean(ctx.consent),
          hand: ctx.hand,
          receipt: ctx.receipt?.token ?? null,
          analysis: Boolean(ctx.analysis),
          previous: Boolean(ctx.previous),
          remaining: ctx.remaining,
          local,
        })}
      </p>
      <button onClick={() => ctx.setPhoto(photo("blob:um"))}>foto</button>
      <button onClick={() => ctx.setAnalysis({} as never)}>analisada</button>
      <button onClick={() => ctx.setPhoto(photo("blob:dois"))}>trocar</button>
      <button onClick={() => setLocal((n) => n + 1)}>local</button>
      <button onClick={() => (task = ctx.beginTask())}>tarefa</button>
      <button onClick={() => ctx.withdraw()}>retirar</button>
    </div>
  );
}

function Flow({ mode }: { mode: "visible" | "hidden" }) {
  return (
    <Activity mode={mode}>
      <PalmPhotoProvider
        initialConsent={consent}
        initialHand="right"
        initialReceipt={receipt}
      >
        <Probe />
      </PalmPhotoProvider>
    </Activity>
  );
}

const state = () =>
  JSON.parse(screen.getByTestId("state").textContent ?? "{}") as Record<
    string,
    unknown
  >;

afterEach(() => {
  task = null;
  vi.restoreAllMocks();
});

describe("saída do fluxo da leitura das mãos (D5)", () => {
  it("navegar entre etapas (layout visível) preserva o progresso", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Flow mode="visible" />);
    await user.click(screen.getByText("foto"));
    await user.click(screen.getByText("local"));
    rerender(<Flow mode="visible" />);
    expect(state()).toMatchObject({
      photo: "blob:um",
      consent: true,
      hand: "right",
      receipt: "recibo.assinado",
      local: 1,
    });
  });

  it("ao sair, descarta foto, anterior, resultado, consentimento, recibo e estado local", async () => {
    const revoke = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    const user = userEvent.setup();
    const { rerender, container } = render(<Flow mode="visible" />);
    await user.click(screen.getByText("foto"));
    await user.click(screen.getByText("analisada"));
    await user.click(screen.getByText("trocar")); // "blob:um" vira a anterior
    await user.click(screen.getByText("local"));
    expect(state()).toMatchObject({ photo: "blob:dois", previous: true });

    rerender(<Flow mode="hidden" />);
    // Mesmo escondida, a árvore não guarda mais a foto nem o recibo.
    expect(container.innerHTML).not.toMatch(/blob:|recibo\.assinado/);
    expect(revoke).toHaveBeenCalledWith("blob:um");
    expect(revoke).toHaveBeenCalledWith("blob:dois");

    rerender(<Flow mode="visible" />);
    expect(state()).toEqual({
      photo: null,
      consent: false,
      hand: null,
      receipt: null,
      analysis: false,
      previous: false,
      remaining: null,
      local: 0, // telas remontadas: o estado local também saiu
    });
  });

  it("tarefa em andamento é abortada e deixa de valer ao sair", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Flow mode="visible" />);
    await user.click(screen.getByText("tarefa"));
    const started = task!;
    expect(started.isCurrent()).toBe(true);
    rerender(<Flow mode="hidden" />);
    expect(started.signal.aborted).toBe(true);
    expect(started.isCurrent()).toBe(false);
    // Nem depois de voltar a tarefa antiga volta a valer.
    rerender(<Flow mode="visible" />);
    expect(started.isCurrent()).toBe(false);
    await user.click(screen.getByText("tarefa"));
    expect(task!.isCurrent()).toBe(true);
  });

  it("a montagem inicial não limpa nada", () => {
    render(<Flow mode="visible" />);
    expect(state()).toMatchObject({
      consent: true,
      receipt: "recibo.assinado",
      remaining: 3,
    });
  });

  it("depois de voltar, um novo fluxo funciona normalmente", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Flow mode="visible" />);
    rerender(<Flow mode="hidden" />);
    rerender(<Flow mode="visible" />);
    await act(async () => {
      await user.click(screen.getByText("foto"));
    });
    expect(state()).toMatchObject({ photo: "blob:um" });
  });

  it("sair do fluxo não revoga no servidor; retirar o consentimento revoga", async () => {
    const revoke = vi
      .spyOn(client, "revokeConsentReceipt")
      .mockResolvedValue(true);
    const user = userEvent.setup();
    const { rerender } = render(<Flow mode="visible" />);
    rerender(<Flow mode="hidden" />);
    expect(revoke).not.toHaveBeenCalled();
    rerender(<Flow mode="visible" />);
    // Após voltar não há recibo; um fluxo novo, com recibo, revoga ao retirar.
    render(<Flow mode="visible" />);
    await user.click(screen.getAllByText("retirar").at(-1)!);
    expect(revoke).toHaveBeenCalledWith(receipt);
  });
});
