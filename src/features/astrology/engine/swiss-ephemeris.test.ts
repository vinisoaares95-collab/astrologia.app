// @vitest-environment node
import * as Astronomy from "astronomy-engine";
import { describe, expect, it } from "vitest";

import reference from "../__fixtures__/de421-reference.json";
import { BODIES, type Body } from "../domain/types";
import { angularSeparation } from "../domain/zodiac";
import { swissEphemeris } from "./swiss-ephemeris";

/*
 * Validação contra referências INDEPENDENTES do Swiss Ephemeris:
 * - JPL DE421 via Skyfield (planetas) — ver scripts/reference/;
 * - fórmulas clássicas de ASC/MC/Placidus implementadas em Python (oráculo);
 * - Astronomy Engine (algoritmo próprio, ±1′) como checagem cruzada.
 * Tolerâncias aprovadas na Fase 02A (docs/fase-02a-motor-astrologico.md).
 */

const ARCSEC = 1 / 3600;
const TOLERANCE = {
  planet: 18 * ARCSEC, // Sol a Plutão vs. JPL
  moon: 36 * ARCSEC, // Lua vs. JPL
  angle: 0.01, // ASC e MC vs. oráculo
  cusp: 1 / 60, // cúspides Placidus vs. oráculo
  astronomyEngine: 1 / 60, // checagem cruzada (limite declarado da biblioteca)
};

type Case = (typeof reference.cases)[number];

function instantOf(c: Case) {
  const [year, month, day, hour, minute, second = 0] = c.utc;
  return { year, month, day, hour, minute, second };
}

const ASTRONOMY_BODY: Record<Body, Astronomy.Body> = {
  sun: Astronomy.Body.Sun,
  moon: Astronomy.Body.Moon,
  mercury: Astronomy.Body.Mercury,
  venus: Astronomy.Body.Venus,
  mars: Astronomy.Body.Mars,
  jupiter: Astronomy.Body.Jupiter,
  saturn: Astronomy.Body.Saturn,
  uranus: Astronomy.Body.Uranus,
  neptune: Astronomy.Body.Neptune,
  pluto: Astronomy.Body.Pluto,
};

describe.each(reference.cases)("$id", (c) => {
  const jd = swissEphemeris.julianDay(instantOf(c));

  it("usa a mesma escala de tempo que a referência (ΔT coerente)", () => {
    expect(Math.abs((jd.tt - jd.ut) * 86400 - c.delta_t_seconds)).toBeLessThan(
      1.5,
    );
  });

  it.each(BODIES)("%s coincide com JPL DE421", (body) => {
    const p = swissEphemeris.bodyPosition(jd.ut, body);
    const ref = c.bodies[body];
    const tol = body === "moon" ? TOLERANCE.moon : TOLERANCE.planet;
    expect(angularSeparation(p.longitude, ref.lon)).toBeLessThan(tol);
    expect(Math.abs(p.latitude - ref.lat)).toBeLessThan(tol);
  });

  it.each(BODIES)("%s coincide com o Astronomy Engine (±1′)", (body) => {
    const p = swissEphemeris.bodyPosition(jd.ut, body);
    const [y, mo, d, h, mi, sec = 0] = c.utc;
    const time = Astronomy.MakeTime(
      new Date(Date.UTC(y, mo - 1, d, h, mi, sec)),
    );
    const ecl = Astronomy.Ecliptic(
      Astronomy.GeoVector(ASTRONOMY_BODY[body], time, true),
    );
    expect(angularSeparation(p.longitude, ecl.elon)).toBeLessThan(
      TOLERANCE.astronomyEngine,
    );
  });

  it("Ascendente, Meio do Céu e cúspides coincidem com o oráculo", () => {
    const h = swissEphemeris.housesPlacidus(jd.ut, {
      latitude: c.lat,
      longitude: c.lon,
    });
    expect(angularSeparation(h.asc, c.asc)).toBeLessThan(TOLERANCE.angle);
    expect(angularSeparation(h.mc, c.mc)).toBeLessThan(TOLERANCE.angle);
    if (c.placidus_cusps === null) {
      expect(h.cusps).toBeNull();
    } else {
      expect(h.cusps).toHaveLength(12);
      h.cusps!.forEach((cusp, i) => {
        expect(angularSeparation(cusp, c.placidus_cusps![i])).toBeLessThan(
          TOLERANCE.cusp,
        );
      });
    }
  });
});

describe("precisão de segundos", () => {
  it("o dia juliano incorpora os segundos exatamente, sem arredondar", () => {
    const base = { year: 1910, month: 1, day: 1, hour: 15, minute: 6 };
    const without = swissEphemeris.julianDay(base);
    const withSeconds = swissEphemeris.julianDay({ ...base, second: 28 });
    const fractional = swissEphemeris.julianDay({ ...base, second: 28.5 });
    expect((withSeconds.ut - without.ut) * 86400).toBeCloseTo(28, 4);
    expect((fractional.ut - without.ut) * 86400).toBeCloseTo(28.5, 4);
  });

  it("ignorar os segundos da hora média local mudaria o Ascendente além da tolerância", () => {
    // Referência: DE421/oráculo no instante 1910-01-01 15:06:28 UT1.
    const ref = reference.cases.find(
      (c) => c.id === "sao-paulo-1910-lmt-segundos",
    )!;
    const location = { latitude: ref.lat, longitude: ref.lon };
    const exact = swissEphemeris.housesPlacidus(
      swissEphemeris.julianDay(instantOf(ref)).ut,
      location,
    );
    const truncated = swissEphemeris.housesPlacidus(
      swissEphemeris.julianDay({ ...instantOf(ref), second: 0 }).ut,
      location,
    );
    expect(angularSeparation(exact.asc, ref.asc)).toBeLessThan(TOLERANCE.angle);
    expect(angularSeparation(truncated.asc, ref.asc)).toBeGreaterThan(
      TOLERANCE.angle,
    );
  });
});

describe("erros e limites do motor", () => {
  it("recusa datas inexistentes", () => {
    expect(() =>
      swissEphemeris.julianDay({
        year: 1990,
        month: 2,
        day: 30,
        hour: 12,
        minute: 0,
      }),
    ).toThrow(expect.objectContaining({ code: "INVALID_DATE" }));
  });

  it("não devolve cúspides de outro sistema acima do círculo polar", () => {
    const jd = swissEphemeris.julianDay({
      year: 1999,
      month: 12,
      day: 21,
      hour: 12,
      minute: 0,
    });
    const h = swissEphemeris.housesPlacidus(jd.ut, {
      latitude: 78.22,
      longitude: 15.65,
    });
    expect(h.cusps).toBeNull();
    expect(Number.isFinite(h.asc) && Number.isFinite(h.mc)).toBe(true);
  });

  it("falha explicitamente quando os arquivos de efemérides não existem", async () => {
    const previous = process.env.SIDERA_EPHE_PATH;
    process.env.SIDERA_EPHE_PATH = "/caminho/inexistente";
    try {
      expect(() => swissEphemeris.bodyPosition(2448024.23, "moon")).toThrow(
        expect.objectContaining({ code: "EPHEMERIS_FILES_MISSING" }),
      );
    } finally {
      if (previous === undefined) delete process.env.SIDERA_EPHE_PATH;
      else process.env.SIDERA_EPHE_PATH = previous;
    }
  });
});
