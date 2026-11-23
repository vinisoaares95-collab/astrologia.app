/**
 * Jornada do relatório (Fase 04B): transferência só do texto das mãos e
 * descarte nas saídas, com o mesmo <Activity> que o Next.js usa nas rotas.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Activity, useEffect, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PalmAnalysisResult } from "@/features/palm-reading/chapters/presentation";
import { createConsent } from "@/features/palm-reading/consent";
import type { LocalPhoto } from "@/features/palm-reading/lib/load-image";
import {
  PalmPhotoProvider,
  usePalmPhoto,
} from "@/features/palm-reading/palm-photo-context";
import { DemoPreview } from "@/features/palm-reading/components/demo-preview";

import { JourneyProvider, toJourneyHands, useJourney } from "./journey-context";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const result: PalmAnalysisResult = {
  status: "partial",
  retakeRecommended: false,
  simulated: false,
  disclaimer: "Aviso das mãos.",
  chapters: [
    {
      number: 6,
      title: "As características das suas mãos",
      status: "content",
      introduction: "Introdução 6.",
      sections: [
        { text: "Texto 6.", observed: ["Palma quadrada."], notes: ["Nota."] },
      ],
      synthesis: "Síntese 6.",
      reflectionQuestions: ["Pergunta?"],
      limitations: ["Limite."],
      unavailableMessage: null,
    },
    {
      number: 7,
      title: "As linhas da sua palma",
      status: "unavailable",
      introduction: "",
      sections: [],
      synthesis: "",
      reflectionQuestions: [],
      limitations: [],
      unavailableMessage: "As linhas não ficaram visíveis.",
    },
  ],
};

const photo: LocalPhoto = {
  url: "blob:foto-preparada",
  blob: new Blob(["jpeg"], { type: "image/jpeg" }),
  fileName: "palma-original.jpg",
  width: 1200,
  height: 1600,
  sizeBytes: 4,
  original: { width: 3000, height: 4000, sizeBytes: 9 },
  metadataRemoved: true,
  hints: [],
  quality: [],
};

describe("toJourneyHands", () => {
  it("copia só os campos de apresentação, em cópia nova", () => {
    const polluted = {
      ...result,
      photo,
      photoHash: "abc",
      receipt: { token: "recibo.secreto" },
      chapters: result.chapters.map((c) => ({ ...c, url: "blob:x" })),
    } as unknown as PalmAnalysisResult;
    const copy = toJourneyHands(polluted);
    expect(copy).toEqual(result);
    expect(JSON.stringify(copy)).not.toMatch(
      /blob:|recibo|abc|palma-original|jpeg/,
    );
    expect(copy.chapters[0].sections[0].observed).not.toBe(
      result.chapters[0].sections[0].observed,
    );
  });
});

function JourneyProbe() {
  const journey = useJourney();
  const [local, setLocal] = useState(0);
  return (
    <div>
      <p data-testid="hands">{JSON.stringify(journey.hands)}</p>
      <p data-testid="local">{local}</p>
      <button onClick={() => setLocal((n) => n + 1)}>local</button>
    </div>
  );
}

/** Semente da prévia (uma vez por teste): foto + resultado da análise. */
const seed = { done: false };
function Seed() {
  const ctx = usePalmPhoto();
  const { setPhoto, setAnalysis } = ctx;
  useEffect(() => {
    if (seed.done) return;
    seed.done = true;
    setPhoto(photo);
  }, [setPhoto]);
  useEffect(() => {
    if (ctx.photo && !ctx.analysis && ctx.photo.url === photo.url)
      setAnalysis(result);
    // Só a primeira foto semeada recebe o resultado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.photo]);
  return <DemoPreview />;
}

function Tree({
  journeyMode,
  palmMode,
}: {
  journeyMode: "visible" | "hidden";
  palmMode: "visible" | "hidden";
}) {
  return (
    <Activity mode={journeyMode}>
      <JourneyProvider>
        <JourneyProbe />
        <Activity mode={palmMode}>
          <PalmPhotoProvider
            initialConsent={createConsent({ adult: true, analysis: true })!}
            initialHand="right"
            initialReceipt={{
              token: "recibo.secreto",
              expiresAt: 1,
              remaining: 3,
            }}
          >
            <Seed />
          </PalmPhotoProvider>
        </Activity>
      </JourneyProvider>
    </Activity>
  );
}

const hands = () =>
  JSON.parse(screen.getByTestId("hands").textContent ?? "null");

describe("transferência e descarte", () => {
  beforeEach(() => {
    seed.done = false;
    push.mockClear();
  });

  it("Continuar leva só o texto; a foto é descartada ao esconder a etapa das mãos; o texto fica", async () => {
    const revoke = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    const user = userEvent.setup();
    const { rerender, container } = render(
      <Tree journeyMode="visible" palmMode="visible" />,
    );
    await user.click(
      await screen.findByRole("button", {
        name: /continuar: dados de nascimento/i,
      }),
    );
    expect(push).toHaveBeenCalledWith("/dados-de-nascimento");
    expect(hands()).toEqual(result); // exatamente o da prévia

    // Navegação para o nascimento: o Next.js esconde a etapa das mãos.
    rerender(<Tree journeyMode="visible" palmMode="hidden" />);
    expect(revoke).toHaveBeenCalledWith("blob:foto-preparada");
    expect(hands()).toEqual(result);
    expect(container.innerHTML).not.toMatch(/blob:|recibo\.secreto/);

    // Voltar pelo navegador: a etapa reaparece sem a foto.
    rerender(<Tree journeyMode="visible" palmMode="visible" />);
    expect(screen.queryByAltText("Sua foto")).toBeNull();
    expect(
      screen.getByText(
        /O texto da sua leitura continua na memória desta jornada/,
      ),
    ).toBeInTheDocument();
    revoke.mockRestore();
  });

  it("avançar não revoga o consentimento no servidor", async () => {
    const client = await import("@/features/palm-reading/lib/analysis-client");
    const revoke = vi
      .spyOn(client, "revokeConsentReceipt")
      .mockResolvedValue(true);
    const user = userEvent.setup();
    const { rerender } = render(
      <Tree journeyMode="visible" palmMode="visible" />,
    );
    await user.click(
      await screen.findByRole("button", {
        name: /continuar: dados de nascimento/i,
      }),
    );
    rerender(<Tree journeyMode="visible" palmMode="hidden" />);
    expect(revoke).not.toHaveBeenCalled();
    revoke.mockRestore();
  });

  it("sair da etapa das mãos sem continuar: nada vai para a jornada", () => {
    const { rerender } = render(
      <Tree journeyMode="visible" palmMode="visible" />,
    );
    rerender(<Tree journeyMode="visible" palmMode="hidden" />);
    expect(hands()).toBeNull();
  });

  it("retirar o consentimento apaga também o texto já levado à jornada", async () => {
    const client = await import("@/features/palm-reading/lib/analysis-client");
    const revoke = vi
      .spyOn(client, "revokeConsentReceipt")
      .mockResolvedValue(true);
    const user = userEvent.setup();
    render(<Tree journeyMode="visible" palmMode="visible" />);
    await user.click(
      await screen.findByRole("button", {
        name: /continuar: dados de nascimento/i,
      }),
    );
    expect(hands()).not.toBeNull();
    await user.click(
      screen.getByRole("button", { name: /retirar consentimento e sair/i }),
    );
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(hands()).toBeNull();
    expect(push).toHaveBeenLastCalledWith("/");
    revoke.mockRestore();
  });

  it("abandonar a jornada (ir ao site) apaga o texto e o estado das telas", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Tree journeyMode="visible" palmMode="visible" />,
    );
    await user.click(
      await screen.findByRole("button", {
        name: /continuar: dados de nascimento/i,
      }),
    );
    await user.click(screen.getByText("local"));
    rerender(<Tree journeyMode="hidden" palmMode="hidden" />);
    rerender(<Tree journeyMode="visible" palmMode="hidden" />);
    expect(hands()).toBeNull();
    expect(screen.getByTestId("local").textContent).toBe("0");
  });

  it("a prévia explica as três opções (continuar, retirar o consentimento, sair pelo X)", async () => {
    render(<Tree journeyMode="visible" palmMode="visible" />);
    await screen.findByRole("button", {
      name: /continuar: dados de nascimento/i,
    });
    expect(
      screen.getByText(
        /só o texto da leitura segue com você, na memória desta jornada/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /cancela a autorização, impedindo novas análises com ela/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/sem cancelar a autorização/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /descartar foto e sair/i }),
    ).toBeNull();
  });
});
