// @vitest-environment node
/**
 * Capítulos 1–5 a partir do nascimento (Fase 04C), com o motor e a base
 * reais (Swiss Ephemeris, tzdb fixada, biblioteca). Sem IA e sem rede.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { reportParts } from "@/content/report-chapters";

const exact = {
  date: "12/05/1990",
  time: { precision: "exact", value: "14:30" },
  placeId: "ibge:2611606", // Recife
};
const sky = reportParts.find((p) => p.source === "sky")!;

let fetchSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  fetchSpy = vi.spyOn(globalThis, "fetch");
});
afterEach(() => {
  delete process.env.SIDERA_INTERNAL_ENGINE;
  vi.restoreAllMocks();
  vi.resetModules();
  vi.doUnmock("../../natal-chart/build-chart");
});

const load = async () =>
  (await import("./sky-actions")).generateSkyChaptersAction;

describe("generateSkyChaptersAction", () => {
  it("fora do ambiente interno: não processa nada", async () => {
    const action = await load();
    expect(await action(exact)).toEqual({ status: "engine-disabled" });
    expect(await action("lixo")).toEqual({ status: "engine-disabled" });
  });

  it("horário exato: os cinco capítulos da biblioteca, na estrutura do relatório, sem dados de nascimento", async () => {
    process.env.SIDERA_INTERNAL_ENGINE = "1";
    const r = await (await load())(exact);
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.report.chapters.map((c) => [c.number, c.title])).toEqual(
      sky.chapters.map((c) => [c.number, c.title]),
    );
    for (const c of r.report.chapters) {
      expect(c.introduction.length).toBeGreaterThan(20);
      expect(c.sections.length).toBeGreaterThan(0);
    }
    expect(r.report.disclaimer).toMatch(/não são fatos científicos/);
    const json = JSON.stringify(r);
    // Só capítulos: nada de data, hora, cidade, coordenadas ou origem interna.
    expect(json).not.toMatch(
      /12\/05\/1990|1990-05-12|14:30|Recife|ibge:|-8\.0|"source"|fallbackReason|itemIds|factIds/,
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("horário aproximado e desconhecido: limitações do motor preservadas", async () => {
    process.env.SIDERA_INTERNAL_ENGINE = "1";
    const action = await load();
    const unknown = await action({ ...exact, time: { precision: "unknown" } });
    const approx = await action({
      ...exact,
      time: { precision: "approximate", value: "14:30", marginMinutes: 60 },
    });
    for (const r of [unknown, approx]) {
      if (r.status !== "ok") throw new Error(r.status);
      expect(r.report.chapters).toHaveLength(5);
      expect(
        r.report.chapters.flatMap((c) => c.limitations).length,
      ).toBeGreaterThan(0);
    }
    if (unknown.status !== "ok") throw new Error();
    expect(JSON.stringify(unknown)).toMatch(/horário|Ascendente|casas/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("cidade ou data inválida: recusa com a mesma normalização da conferência", async () => {
    process.env.SIDERA_INTERNAL_ENGINE = "1";
    const action = await load();
    expect((await action({ ...exact, placeId: "ibge:0000000" })).status).toBe(
      "invalid",
    );
    expect((await action({ ...exact, date: "30/02/1990" })).status).toBe(
      "invalid",
    );
    expect((await action({ ...exact, placeId: null })).status).toBe("invalid");
  });

  it("horário duplicado sem escolha: pede a escolha, não decide sozinho", async () => {
    process.env.SIDERA_INTERNAL_ENGINE = "1";
    const r = await (
      await load()
    )({
      date: "14/03/1986",
      time: { precision: "exact", value: "23:30" },
      placeId: "ibge:3550308",
    });
    expect(r).toEqual({ status: "needs-choice" });
  });

  it("erro do motor: mensagem amigável, nunca a técnica", async () => {
    process.env.SIDERA_INTERNAL_ENGINE = "1";
    const { ChartError } = await import("../../astrology/engine/errors");
    vi.doMock("../../natal-chart/build-chart", () => ({
      buildChartView: () => {
        throw new ChartError(
          "EPHEMERIS_FILES_MISSING",
          "Arquivos sepl_18.se1 ausentes em /srv/ephe.",
        );
      },
    }));
    const r = await (await load())(exact);
    expect(r.status).toBe("engine-error");
    expect(JSON.stringify(r)).not.toMatch(/sepl|\/srv|ephe/);
    expect(JSON.stringify(r)).toMatch(/leitura das mãos não foi afetada/);
  });

  it("erro inesperado: registra só o tipo do erro", async () => {
    process.env.SIDERA_INTERNAL_ENGINE = "1";
    vi.doMock("../../natal-chart/build-chart", () => ({
      buildChartView: () => {
        throw new TypeError("quebrou em Recife 14:30");
      },
    }));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await (await load())(exact);
    expect(r.status).toBe("engine-error");
    expect(log).toHaveBeenCalledWith(expect.any(String), "TypeError");
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/Recife|14:30/);
  });
});
