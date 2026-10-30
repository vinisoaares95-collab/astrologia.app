// @vitest-environment node
import { describe, expect, it } from "vitest";

import { swissEphemeris } from "../engine/swiss-ephemeris";
import type { ChartRequest } from "../domain/types";
import { computeNatalChart } from "./compute-natal-chart";

// Nascimento fictício: 12/05/1990, 17:30 UTC, São Paulo.
const base: ChartRequest = {
  instant: { year: 1990, month: 5, day: 12, hour: 17, minute: 30 },
  location: { latitude: -23.5505, longitude: -46.6333 },
  timePrecision: "exact",
};

describe("computeNatalChart", () => {
  it("monta um mapa completo com horário exato", () => {
    const chart = computeNatalChart(base, swissEphemeris);
    expect(chart.bodies).toHaveLength(10);
    expect(chart.angles?.asc.sign).toBe("virgo");
    expect(chart.angles?.mc.sign).toBe("gemini");
    expect(chart.houses?.cusps).toHaveLength(12);
    expect(
      chart.bodies.every(
        (b) => b.house !== null && b.house >= 1 && b.house <= 12,
      ),
    ).toBe(true);
    expect(chart.meta).toMatchObject({
      zodiac: "tropical",
      houseSystem: "placidus",
      frame: "geocentric-apparent-true-ecliptic-of-date",
      orbs: "orbs-v1",
    });
    expect(chart.meta.calcVersion).toContain("sepl_18.se1+semo_18.se1");
    // Simetria: nenhum par repetido nos aspectos.
    const pairs = chart.aspects.map((a) => [a.a, a.b].sort().join("-"));
    expect(new Set(pairs).size).toBe(pairs.length);
  });

  it("não inventa ângulos, casas nem aspectos com ângulos sem horário", () => {
    const chart = computeNatalChart(
      { ...base, timePrecision: "unknown" },
      swissEphemeris,
    );
    expect(chart.angles).toBeNull();
    expect(chart.houses).toBeNull();
    expect(chart.unavailable).toEqual({
      angles: "BIRTH_TIME_UNKNOWN",
      houses: "BIRTH_TIME_UNKNOWN",
    });
    expect(chart.bodies.every((b) => b.house === null)).toBe(true);
    expect(
      chart.aspects.some(
        (a) => ["asc", "mc"].includes(a.a) || ["asc", "mc"].includes(a.b),
      ),
    ).toBe(false);
  });

  it("mantém ASC/MC mas omite casas onde Placidus é indefinido", () => {
    const chart = computeNatalChart(
      { ...base, location: { latitude: 69.6492, longitude: 18.9553 } },
      swissEphemeris,
    );
    expect(chart.angles).not.toBeNull();
    expect(chart.houses).toBeNull();
    expect(chart.unavailable.houses).toBe("PLACIDUS_UNDEFINED");
    expect(chart.warnings.map((w) => w.code)).toContain("PLACIDUS_UNDEFINED");
  });

  it("sinaliza planeta a menos de 1′ do limite de signo", () => {
    // 20/03/2000 07:30 UTC: Sol a ~13″ de 0° Áries (referência DE421).
    const chart = computeNatalChart(
      {
        ...base,
        instant: { year: 2000, month: 3, day: 20, hour: 7, minute: 30 },
      },
      swissEphemeris,
    );
    const sun = chart.bodies.find((b) => b.body === "sun")!;
    expect(sun).toMatchObject({ sign: "pisces", degree: 29, minute: 59 });
    expect(chart.warnings.some((w) => w.code === "NEAR_SIGN_BOUNDARY")).toBe(
      true,
    );
  });

  it("marca planetas retrógrados pela velocidade", () => {
    const chart = computeNatalChart(
      {
        ...base,
        instant: { year: 2016, month: 9, day: 10, hour: 12, minute: 0 },
      },
      swissEphemeris,
    );
    const mercury = chart.bodies.find((b) => b.body === "mercury")!;
    expect(mercury.speed).toBeLessThan(0);
    expect(mercury.retrograde).toBe(true);
  });

  it.each([
    [
      "data inexistente",
      { instant: { ...base.instant, month: 2, day: 30 } },
      "INVALID_DATE",
    ],
    [
      "hora inválida",
      { instant: { ...base.instant, hour: 24 } },
      "INVALID_DATE",
    ],
    [
      "minuto fracionário",
      { instant: { ...base.instant, minute: 30.5 } },
      "INVALID_DATE",
    ],
    [
      "ano antes das efemérides",
      { instant: { ...base.instant, year: 1700 } },
      "DATE_OUT_OF_RANGE",
    ],
    [
      "ano depois das efemérides",
      { instant: { ...base.instant, year: 2400 } },
      "DATE_OUT_OF_RANGE",
    ],
    [
      "latitude no polo",
      { location: { latitude: 90, longitude: 0 } },
      "INVALID_COORDINATES",
    ],
    [
      "longitude inválida",
      { location: { latitude: 0, longitude: 200 } },
      "INVALID_COORDINATES",
    ],
    [
      "valor não numérico",
      { location: { latitude: Number.NaN, longitude: 0 } },
      "INVALID_DATE",
    ],
  ] as const)("recusa %s", (_label, patch, code) => {
    expect(() =>
      computeNatalChart({ ...base, ...patch } as ChartRequest, swissEphemeris),
    ).toThrow(expect.objectContaining({ code }));
  });
});
