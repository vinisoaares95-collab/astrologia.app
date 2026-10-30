// @vitest-environment node
import { describe, expect, it } from "vitest";

import reference from "../astrology/__fixtures__/de421-reference.json";
import { BODIES } from "../astrology/domain/types";
import { angularSeparation } from "../astrology/domain/zodiac";
import { swissEphemeris } from "../astrology/engine/swiss-ephemeris";
import type { BirthDataInput } from "../birth-data/contract";
import { normalizeBirthData } from "../birth-data/normalize";
import type { PlaceRecord } from "../places/types";
import { buildChartView, longitudeRange } from "./build-chart";

const ARCSEC = 1 / 3600;
const ref = (id: string) => reference.cases.find((c) => c.id === id)!;

// Localidades com as MESMAS coordenadas dos casos de referência (fictícios).
const places: Record<string, PlaceRecord> = {
  sp: {
    id: "t:sp",
    name: "São Paulo",
    admin1: "São Paulo",
    admin1Code: "SP",
    country: "BR",
    lat: -23.5505,
    lon: -46.6333,
    tz: "America/Sao_Paulo",
  },
  tromso: {
    id: "t:tromso",
    name: "Tromsø",
    admin1: "Troms",
    country: "NO",
    lat: 69.6492,
    lon: 18.9553,
    tz: "Europe/Oslo",
  },
};
const deps = {
  getPlace: (id: string) => Object.values(places).find((p) => p.id === id),
  today: { year: 2026, month: 10, day: 30 },
  tzdbVersion: "teste",
};

function chartFor(input: BirthDataInput) {
  const r = normalizeBirthData(input, deps);
  if (r.status !== "ok") throw new Error(JSON.stringify(r));
  return buildChartView(r.birth, swissEphemeris);
}

// 12/05/1990 14:30 em São Paulo = 17:30 UTC (caso "sao-paulo-1990" do JPL DE421).
const sp1990 = { date: "12/05/1990", placeId: "t:sp" } as const;

describe("cadeia completa: horário local → UTC → motor (vs. referências independentes)", () => {
  const chart = chartFor({
    ...sp1990,
    time: { precision: "exact", value: "14:30" },
  });
  const r = ref("sao-paulo-1990");

  it("usa o instante UTC esperado", () => {
    expect(chart.parameters.instantUtc).toBe("1990-05-12T17:30:00Z");
  });

  it.each(BODIES)("%s coincide com o JPL DE421", (body) => {
    const b = chart.bodies.find((x) => x.body === body)!;
    expect(angularSeparation(b.longitude, r.bodies[body].lon)).toBeLessThan(
      (body === "moon" ? 36 : 18) * ARCSEC,
    );
  });

  it("Ascendente, Meio do Céu e cúspides coincidem com o oráculo", () => {
    expect(angularSeparation(chart.angles!.asc.longitude, r.asc)).toBeLessThan(
      0.01,
    );
    expect(angularSeparation(chart.angles!.mc.longitude, r.mc)).toBeLessThan(
      0.01,
    );
    chart.houses!.cusps.forEach((c, i) =>
      expect(angularSeparation(c.longitude, r.placidus_cusps![i])).toBeLessThan(
        1 / 60,
      ),
    );
  });

  it("orienta a mandala pelo Ascendente e não marca intervalos", () => {
    expect(chart.orientation).toEqual({
      kind: "ascendant",
      longitude: chart.angles!.asc.longitude,
    });
    expect(
      chart.bodies.every((b) => b.range === null && b.house !== null),
    ).toBe(true);
    expect(chart.aspects.every((a) => !a.uncertain)).toBe(true);
  });
});

describe("horário desconhecido", () => {
  const chart = chartFor({ ...sp1990, time: { precision: "unknown" } });

  it("não apresenta Ascendente, Meio do Céu nem casas; orienta por 0° Áries", () => {
    expect(chart.angles).toBeNull();
    expect(chart.houses).toBeNull();
    expect(chart.orientation).toEqual({ kind: "aries", longitude: 0 });
    expect(chart.bodies.every((b) => b.house === null)).toBe(true);
    expect(
      chart.aspects.some(
        (a) => ["asc", "mc"].includes(a.a) || ["asc", "mc"].includes(a.b),
      ),
    ).toBe(false);
  });

  it("dá a cada corpo o intervalo percorrido no dia local (Lua ≈ 12–15°)", () => {
    const moon = chart.bodies.find((b) => b.body === "moon")!;
    expect(moon.range!.width).toBeGreaterThan(11);
    expect(moon.range!.width).toBeLessThan(16);
    // A posição de referência (meio-dia) está dentro do intervalo.
    const into = (moon.longitude - moon.range!.start + 360) % 360;
    expect(into).toBeLessThanOrEqual(moon.range!.width);
    expect(chart.parameters.window).toEqual({
      startUtc: "1990-05-12T03:00:00Z",
      endUtc: "1990-05-13T02:59:59Z",
    });
  });
});

describe("horário aproximado (± 60 min)", () => {
  const chart = chartFor({
    ...sp1990,
    time: { precision: "approximate", value: "14:30", marginMinutes: 60 },
  });

  it("ângulos como intervalos e casas não determinadas", () => {
    expect(chart.angles!.asc.range!.width).toBeGreaterThan(20);
    expect(chart.houses).toBeNull();
    expect(chart.unavailable.houses).toBe("BIRTH_TIME_APPROXIMATE");
    expect(
      chart.aspects.some(
        (a) => ["asc", "mc"].includes(a.a) || ["asc", "mc"].includes(a.b),
      ),
    ).toBe(false);
  });

  it("a casa de cada corpo só é afirmada se for a mesma nos dois extremos", () => {
    for (const b of chart.bodies) {
      if (b.houseVaries) expect(b.house).toBeNull();
      else expect(b.house).not.toBeNull();
    }
  });
});

describe("latitude polar", () => {
  it("mantém Ascendente e Meio do Céu, sem casas Placidus", () => {
    const chart = chartFor({
      date: "21/12/1999",
      time: { precision: "exact", value: "13:00" },
      placeId: "t:tromso",
    });
    expect(chart.houses).toBeNull();
    expect(chart.angles).not.toBeNull();
    expect(chart.unavailable.houses).toBe("PLACIDUS_UNDEFINED");
    expect(chart.orientation.kind).toBe("ascendant");
  });
});

describe("longitudeRange", () => {
  it("segue o sentido do movimento e detecta mudança de signo", () => {
    expect(longitudeRange(10, 12)).toMatchObject({
      start: 10,
      end: 12,
      width: 2,
      crossesSign: false,
    });
    expect(longitudeRange(28, 33)).toMatchObject({
      width: 5,
      crossesSign: true,
    });
    expect(longitudeRange(359, 1)).toMatchObject({
      start: 359,
      end: 1,
      width: 2,
      crossesSign: true,
    });
    // Retrógrado: de 12 para 10 → arco de 10 a 12.
    expect(longitudeRange(12, 10)).toMatchObject({
      start: 10,
      end: 12,
      width: 2,
    });
  });
});
