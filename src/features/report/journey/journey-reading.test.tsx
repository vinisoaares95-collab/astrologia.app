import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { PalmAnalysisResult } from "@/features/palm-reading/chapters/presentation";

import exact from "@/features/interpretation/ai/__fixtures__/library-report.exact.json";
import type { GeneratedReport } from "@/features/interpretation/ai/contract";
import { toClientReport } from "@/features/interpretation/ai/presentation";

import { JourneyProvider, type JourneySky } from "./journey-context";
import {
  HANDS_ABSENT_REASON,
  JourneyReading,
  SKY_ABSENT_REASON,
} from "./journey-reading";
import { C8, C9 } from "@/features/report/journey-chapters/library";
import {
  emptyHandsBridge,
  emptySkyBridge,
} from "@/features/report/journey-chapters/test-support";

const hands: PalmAnalysisResult = {
  bridge: emptyHandsBridge({ retakeRecommended: true }),
  status: "partial",
  retakeRecommended: true,
  simulated: false,
  disclaimer: "Aviso das mãos, do motor.",
  chapters: [
    {
      number: 6,
      title: "As características das suas mãos",
      status: "content",
      introduction: "Introdução exata do motor.",
      sections: [
        {
          text: "Seção exata.",
          observed: ["Palma quadrada."],
          notes: ["Nota exata."],
        },
      ],
      synthesis: "Síntese exata.",
      reflectionQuestions: ["Pergunta exata?"],
      limitations: ["Limite exato."],
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
      unavailableMessage: "Mensagem exata de indisponível.",
    },
  ],
};

const skyReport = toClientReport(exact as unknown as GeneratedReport);

const renderWith = (
  initial: PalmAnalysisResult | null,
  sky: JourneySky | null = null,
) =>
  render(
    <JourneyProvider initialHands={initial} initialSky={sky}>
      <JourneyReading />
    </JourneyProvider>,
  );

describe("leitura da jornada real (04B)", () => {
  it("capítulos 6 e 7 exatamente como vieram da prévia; avisos preservados", () => {
    renderWith(hands);
    for (const t of [
      "Introdução exata do motor.",
      "Seção exata.",
      "Palma quadrada.",
      "Nota exata.",
      "Síntese exata.",
      "Pergunta exata?",
      "Limite exato.",
      "Mensagem exata de indisponível.",
      "Aviso das mãos, do motor.",
    ])
      expect(screen.getByText(t)).toBeInTheDocument();
    expect(screen.getByText(/Leitura parcial/)).toBeInTheDocument();
    expect(screen.getByText(/Uma nova foto/)).toBeInTheDocument();
  });

  it("capítulos 1–5 exatamente como o motor entregou; 8–9 montados das pontes, com o motivo real quando indisponíveis", () => {
    renderWith(hands, {
      state: "ready",
      report: skyReport,
      bridge: emptySkyBridge(),
    });
    for (const c of skyReport.chapters) {
      const article = screen
        .getByRole("heading", { level: 3, name: c.title })
        .closest("article")!;
      expect(within(article).getByText(c.introduction)).toBeInTheDocument();
      expect(within(article).getByText(c.synthesis)).toBeInTheDocument();
    }
    const c9 = screen
      .getByRole("heading", { level: 3, name: "Seu guia pessoal de reflexão" })
      .closest("article")!;
    // Mãos com pedido de nova foto e céu sem item elegível nas pontes:
    // cap. 8 indisponível pela causa real (U5); cap. 9 sem temas (V1).
    expect(within(c9).getByText(C9.V.V1)).toBeInTheDocument();
    const c8 = screen
      .getByRole("heading", {
        level: 3,
        name: "Conexões simbólicas entre céu e mãos",
      })
      .closest("article")!;
    expect(within(c8).getByText(C8.U.U5)).toBeInTheDocument();
    expect(screen.queryByText("Em definição")).toBeNull();
    expect(screen.queryByText("Em integração")).toBeNull();
    expect(screen.getByText(skyReport.disclaimer)).toBeInTheDocument();
    // 5 do céu + capítulo 6 (o 7 está indisponível no exemplo).
    expect(
      screen.getByText(/6 de 9 capítulos com leitura nesta versão/),
    ).toBeInTheDocument();
  });

  it("céu carregando: capítulos ocupados, mãos intactas", () => {
    renderWith(hands, { state: "loading" });
    // 5 do céu + 8 e 9, que dependem dos capítulos do céu.
    expect(document.querySelectorAll('article[aria-busy="true"]')).toHaveLength(
      7,
    );
    expect(screen.getByText("Introdução exata do motor.")).toBeInTheDocument();
  });

  it("falha no cálculo: Parte I indisponível com o motivo, sem apagar as mãos", () => {
    renderWith(hands, { state: "unavailable", reason: "Motivo do cálculo." });
    expect(screen.getAllByText("Motivo do cálculo.")).toHaveLength(5);
    expect(screen.getByText("Introdução exata do motor.")).toBeInTheDocument();
    expect(
      screen.getByText("Mensagem exata de indisponível."),
    ).toBeInTheDocument();
  });

  it("sem confirmação do nascimento: motivo explicado, nada de exemplo", () => {
    const { container } = renderWith(hands, null);
    expect(screen.getAllByText(SKY_ABSENT_REASON)).toHaveLength(5);
    expect(container.textContent).not.toMatch(/Sol em Touro/);
  });

  it("sem leitura na jornada: Parte II indisponível com o motivo, nada de exemplo", () => {
    const { container } = renderWith(null);
    expect(screen.getAllByText(HANDS_ABSENT_REASON)).toHaveLength(2);
    // Nenhum texto das bibliotecas de exemplo da demonstração.
    expect(container.textContent).not.toMatch(
      /Sol em|Palma de formato|Demonstração interna|observações fictícias/,
    );
  });
});

describe("capítulos 8 e 9 montados na jornada (04D)", () => {
  const ref = (
    r: string,
    side: "sky" | "hands",
    chapter: number,
    label: string,
    key: string,
    poles: string[],
  ) => ({
    ref: r,
    side,
    chapter,
    label,
    key,
    poles: poles as never,
  });
  const fullHands: PalmAnalysisResult = {
    ...hands,
    status: "complete",
    retakeRecommended: false,
    simulated: true,
    chapters: hands.chapters.map((c) => ({
      ...c,
      status: "content" as const,
      unavailableMessage: null,
      introduction: c.introduction || "Introdução do capítulo 7.",
    })),
    bridge: emptyHandsBridge({
      simulated: true,
      items: [
        ref(
          "linhas:heart.length:long",
          "hands",
          7,
          "linha do coração longa",
          "heart.length",
          ["expressao:expansiva"],
        ),
        ref(
          "linhas:head.start:joined_life",
          "hands",
          7,
          "linha da cabeça começando unida à da vida",
          "head.start",
          ["ritmo:cautela"],
        ),
      ],
    }),
  };
  const skyBridge = {
    ...emptySkyBridge(),
    items: [
      ref("identidade:body-sign:sun", "sky", 1, "Sol em Touro", "sun", [
        "ritmo:cautela",
        "foco:estabilidade",
      ]),
      ref("emocional:body-sign:moon", "sky", 2, "Lua em Leão", "moon", [
        "expressao:expansiva",
      ]),
      ref(
        "relacionamentos:body-sign:mars",
        "sky",
        4,
        "Marte em Touro",
        "mars",
        ["ritmo:cautela", "foco:estabilidade"],
      ),
    ],
  };

  it("nove capítulos: conexões com referências rastreáveis e guia com temas de assuntos distintos", () => {
    const { container } = renderWith(fullHands, {
      state: "ready",
      report: skyReport,
      bridge: skyBridge,
    });
    const c8 = screen
      .getByRole("heading", {
        level: 3,
        name: "Conexões simbólicas entre céu e mãos",
      })
      .closest("article")!;
    expect(within(c8).getByText(C8.intro)).toBeInTheDocument();
    expect(
      within(c8).getByText("Ritmo: impulso e cautela"),
    ).toBeInTheDocument();
    expect(within(c8).getAllByText("Aproximação")).toHaveLength(2);
    expect(within(c8).getByText("Lua em Leão (cap. 2)")).toBeInTheDocument();
    expect(within(c8).getByText(C8.Rsim)).toBeInTheDocument();
    const c9 = screen
      .getByRole("heading", { level: 3, name: "Seu guia pessoal de reflexão" })
      .closest("article")!;
    expect(within(c9).getByText(C9.q["ritmo:cautela"])).toBeInTheDocument();
    expect(
      within(c9).getByText(C9.q["expressao:expansiva"]),
    ).toBeInTheDocument();
    expect(within(c9).getByText(C9.q.identidade)).toBeInTheDocument();
    expect(within(c9).getByText(C9.final)).toBeInTheDocument();
    expect(within(c9).getByText(C9.closing)).toBeInTheDocument();
    expect(screen.getByText(/9 de 9 capítulos/)).toBeInTheDocument();
    // Leitura simulada: a ressalva do capítulo 8 basta; sem aviso repetido na Parte III.
    expect(
      screen.queryByText(
        /Parte montada também a partir de uma leitura das mãos simulada/,
      ),
    ).toBeNull();
    // Ids internos nunca aparecem no texto.
    expect(container.textContent).not.toMatch(
      /body-sign|linhas:|heart\.|identidade:/,
    );
  });

  it("só astrologia: capítulo 8 indisponível (U1) e capítulo 9 disponível", () => {
    renderWith(null, { state: "ready", report: skyReport, bridge: skyBridge });
    expect(screen.getByText(C8.U.U1)).toBeInTheDocument();
    const c9 = screen
      .getByRole("heading", { level: 3, name: "Seu guia pessoal de reflexão" })
      .closest("article")!;
    expect(within(c9).getByText(C9.q.identidade)).toBeInTheDocument();
    expect(within(c9).queryByText(/conex/i)).toBeNull();
  });

  it("cap. 8 indisponível e cap. 9 com as mãos simuladas: o aviso aparece na Parte III", () => {
    const sky2 = {
      ...skyBridge,
      items: skyBridge.items.filter((r) => r.key === "sun"),
    };
    renderWith(fullHands, { state: "ready", report: skyReport, bridge: sky2 });
    expect(screen.getByText(C8.U.U6)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Parte montada também a partir de uma leitura das mãos simulada/,
      ),
    ).toBeInTheDocument();
  });
});
