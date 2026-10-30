// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const input = {
  date: "12/05/1990",
  time: { precision: "exact", value: "14:30" },
  placeId: "ibge:2611606",
};

describe("computeChartAction", () => {
  afterEach(() => {
    delete process.env.SIDERA_INTERNAL_ENGINE;
    vi.resetModules();
    vi.doUnmock("./build-chart");
  });

  it("fica desligado por padrão e não processa os dados", async () => {
    const { computeChartAction } = await import("./actions");
    expect(await computeChartAction(input)).toEqual({
      status: "engine-disabled",
    });
    expect(await computeChartAction("lixo")).toEqual({
      status: "engine-disabled",
    });
  });

  it("no ambiente interno, normaliza e calcula com a base real", async () => {
    process.env.SIDERA_INTERNAL_ENGINE = "1";
    const { computeChartAction } = await import("./actions");
    const r = await computeChartAction(input);
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.chart.birth.place.label).toBe("Recife — PE, Brasil");
      expect(r.chart.bodies).toHaveLength(10);
    }
  });

  it("devolve os problemas da normalização sem calcular", async () => {
    process.env.SIDERA_INTERNAL_ENGINE = "1";
    const { computeChartAction } = await import("./actions");
    const r = await computeChartAction({ ...input, date: "30/02/1990" });
    expect(r.status === "invalid" && r.issues[0].code).toBe("DATE_NONEXISTENT");
  });

  it("traduz erros do motor sem expor detalhes", async () => {
    process.env.SIDERA_INTERNAL_ENGINE = "1";
    const { ChartError } = await import("../astrology/engine/errors");
    vi.doMock("./build-chart", () => ({
      buildChartView: () => {
        throw new ChartError(
          "EPHEMERIS_FILES_MISSING",
          "Arquivos de efemérides ausentes.",
        );
      },
    }));
    const { computeChartAction } = await import("./actions");
    expect(await computeChartAction(input)).toEqual({
      status: "engine-error",
      code: "EPHEMERIS_FILES_MISSING",
      message: "Arquivos de efemérides ausentes.",
    });
  });
});
