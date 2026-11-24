// @vitest-environment node
import { describe, expect, it } from "vitest";

import { reportParts } from "@/content/report-chapters";

import exact from "../../interpretation/ai/__fixtures__/library-report.exact.json";
import type { GeneratedReport } from "../../interpretation/ai/contract";
import { toClientReport } from "../../interpretation/ai/presentation";
import type { PalmAnalysisResult } from "../../palm-reading/chapters/presentation";
import {
  buildIntegratedReport,
  palmArticle,
  PENDING_REASON,
  skyArticle,
} from "./build";
import { isSampleScenario, sampleInputs, SAMPLE_SCENARIOS } from "./samples";
import { emptyHandsBridge } from "@/features/report/journey-chapters/test-support";

const sky = toClientReport(exact as unknown as GeneratedReport);

const palmChapter = (n: 6 | 7, status: "content" | "unavailable") => ({
  number: n,
  title:
    n === 6 ? "As características das suas mãos" : "As linhas da sua palma",
  status,
  introduction: status === "content" ? `introdução ${n}` : "",
  sections:
    status === "content"
      ? [
          {
            text: `texto ${n}`,
            observed: [`observado ${n}`],
            notes: [`nota ${n}`],
          },
        ]
      : [],
  synthesis: status === "content" ? `síntese ${n}` : "",
  reflectionQuestions: status === "content" ? [`pergunta ${n}?`] : [],
  limitations: [`limite ${n}`],
  unavailableMessage: status === "content" ? null : `motivo ${n}`,
});
const palm = (
  s6: "content" | "unavailable",
  s7: "content" | "unavailable",
  over: Partial<PalmAnalysisResult> = {},
): PalmAnalysisResult => ({
  status: "complete",
  retakeRecommended: false,
  simulated: false,
  disclaimer: "Aviso das mãos.",
  chapters: [palmChapter(6, s6), palmChapter(7, s7)],
  bridge: emptyHandsBridge(),
  ...over,
});

describe("adaptadores: o texto do motor passa sem alteração", () => {
  it("capítulos astrológicos (1–5)", () => {
    for (const c of sky.chapters) {
      const a = skyArticle(c);
      expect(a).toMatchObject({
        number: c.number,
        title: c.title,
        status: "content",
        introduction: c.introduction,
        synthesis: c.synthesis,
        reflectionQuestions: c.reflectionQuestions,
        limitations: c.limitations,
        unavailableMessage: null,
      });
      expect(a.sections).toEqual(
        c.sections.map((s) => ({ text: s.text, notes: s.notes })),
      );
    }
  });

  it("capítulos das mãos (6–7), incluindo observado e indisponível", () => {
    const [c6, c7] = palm("content", "unavailable").chapters;
    expect(palmArticle(c6)).toEqual({ ...c6 });
    expect(palmArticle(c7)).toEqual({ ...c7 });
  });
});

describe("relatório integrado", () => {
  it("nove capítulos, nas partes, números, títulos e resumos de reportParts", () => {
    const r = buildIntegratedReport({
      sky: { state: "ready", report: sky },
      hands: { state: "ready", result: palm("content", "content") },
    });
    expect(r.parts.map((p) => [p.numeral, p.title, p.basis])).toEqual(
      reportParts.map((p) => [p.numeral, p.title, p.source]),
    );
    expect(
      r.parts.flatMap((p) =>
        p.chapters.map((c) => [c.number, c.title, c.summary]),
      ),
    ).toEqual(
      reportParts.flatMap((p) =>
        p.chapters.map((c) => [c.number, c.title, c.summary]),
      ),
    );
    expect(r.parts.map((p) => p.status)).toEqual(["ready", "ready", "pending"]);
    expect(r.parts[0].disclaimer).toBe(sky.disclaimer);
    expect(r.parts[1].disclaimer).toBe("Aviso das mãos.");
    expect(r).toMatchObject({ complete: false, hasPending: true });
  });

  it("capítulos 8 e 9: só título e resumo, pendentes, sem nenhum texto interpretativo", () => {
    const r = buildIntegratedReport({
      sky: { state: "ready", report: sky },
      hands: { state: "ready", result: palm("content", "content") },
    });
    for (const c of r.parts[2].chapters) {
      expect(c).toMatchObject({
        availability: "pending",
        article: null,
        unavailableReason: PENDING_REASON,
      });
    }
  });

  it("não expõe origem do texto (IA ou biblioteca) nem identificadores internos", () => {
    const r = buildIntegratedReport({
      sky: { state: "ready", report: sky },
      hands: { state: "ready", result: palm("content", "content") },
    });
    const json = JSON.stringify(r);
    expect(json).not.toMatch(
      /"source":"(ai|library)"|fallbackReason|itemIds|factIds|"model"/,
    );
  });

  it("leitura das mãos parcial: parte parcial, motivo do motor, aviso de parcial", () => {
    const r = buildIntegratedReport({
      sky: { state: "ready", report: sky },
      hands: {
        state: "ready",
        result: palm("content", "unavailable", { status: "partial" }),
      },
    });
    const hands = r.parts[1];
    expect(hands.status).toBe("partial");
    expect(hands.chapters[1]).toMatchObject({
      availability: "unavailable",
      unavailableReason: "motivo 7",
    });
    expect(hands.notices.join(" ")).toMatch(/Leitura parcial/);
  });

  it("foto insuficiente, simulada e sem leitura das mãos", () => {
    const insufficient = buildIntegratedReport({
      sky: { state: "ready", report: sky },
      hands: {
        state: "ready",
        result: palm("unavailable", "unavailable", {
          status: "insufficient",
          retakeRecommended: true,
          simulated: true,
        }),
      },
    });
    expect(insufficient.parts[1].status).toBe("unavailable");
    expect(insufficient.parts[1].notices.join(" ")).toMatch(
      /simulada.*nova foto/s,
    );
    const absent = buildIntegratedReport({
      sky: { state: "ready", report: sky },
      hands: { state: "absent", reason: "Sem leitura." },
    });
    expect(absent.parts[1]).toMatchObject({
      status: "unavailable",
      disclaimer: null,
    });
    expect(
      absent.parts[1].chapters.every(
        (c) => c.unavailableReason === "Sem leitura.",
      ),
    ).toBe(true);
  });

  it("carregando e mapa indisponível", () => {
    const loading = buildIntegratedReport({
      sky: { state: "loading" },
      hands: { state: "loading" },
    });
    expect(loading.parts.map((p) => p.status)).toEqual([
      "loading",
      "loading",
      "pending",
    ]);
    const noSky = buildIntegratedReport({
      sky: { state: "unavailable", reason: "Sem cálculo." },
      hands: { state: "ready", result: palm("content", "content") },
    });
    expect(noSky.parts[0]).toMatchObject({
      status: "unavailable",
      disclaimer: null,
    });
    expect(
      noSky.parts[0].chapters.every(
        (c) => c.unavailableReason === "Sem cálculo.",
      ),
    ).toBe(true);
  });

  it("capítulo do motor que não bate com reportParts é recusado", () => {
    const wrong = {
      ...sky,
      chapters: sky.chapters.map((c, i) =>
        i === 0 ? { ...c, title: "Outro" } : c,
      ),
    };
    expect(() =>
      buildIntegratedReport({
        sky: { state: "ready", report: wrong },
        hands: { state: "loading" },
      }),
    ).toThrow(/não corresponde/);
  });
});

describe("dados de exemplo (só demonstração)", () => {
  it("todos os cenários montam o relatório, sem chamada de rede", async () => {
    for (const s of SAMPLE_SCENARIOS) {
      const r = buildIntegratedReport(await sampleInputs(s.id));
      expect(r.parts).toHaveLength(3);
      expect(r.hasPending).toBe(true);
    }
    expect(isSampleScenario("completo")).toBe(true);
    expect(isSampleScenario("../../etc")).toBe(false);
  });

  it("o texto astrológico é exatamente o do relatório de exemplo da biblioteca", async () => {
    const r = buildIntegratedReport(await sampleInputs("completo"));
    expect(r.parts[0].chapters.map((c) => c.article?.introduction)).toEqual(
      sky.chapters.map((c) => c.introduction),
    );
  });

  it("cenários das mãos: completo, parcial e insuficiente", async () => {
    const status = async (s: Parameters<typeof sampleInputs>[0]) =>
      buildIntegratedReport(await sampleInputs(s)).parts[1].status;
    expect(await status("completo")).toBe("ready");
    expect(await status("insuficiente")).toBe("unavailable");
    expect(await status("sem-maos")).toBe("unavailable");
  });
});
