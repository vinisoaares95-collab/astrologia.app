import { describe, expect, it } from "vitest";

import {
  angularSeparation,
  distanceToSignBoundary,
  houseOf,
  normalizeDegrees,
  toZodiacPosition,
} from "./zodiac";

describe("normalizeDegrees / angularSeparation", () => {
  it("normaliza para 0 ≤ x < 360", () => {
    expect(normalizeDegrees(-30)).toBe(330);
    expect(normalizeDegrees(720)).toBe(0);
    expect(normalizeDegrees(359.5)).toBe(359.5);
  });

  it("mede a menor distância, atravessando 0° Áries", () => {
    expect(angularSeparation(350, 10)).toBe(20);
    expect(angularSeparation(10, 190)).toBe(180);
    expect(angularSeparation(100, 100)).toBe(0);
  });
});

describe("toZodiacPosition", () => {
  it("converte longitude em signo, grau e minuto", () => {
    expect(toZodiacPosition(0)).toMatchObject({
      sign: "aries",
      degree: 0,
      minute: 0,
    });
    expect(toZodiacPosition(51.723)).toMatchObject({
      sign: "taurus",
      degree: 21,
      minute: 43,
    });
    expect(toZodiacPosition(359.99639)).toMatchObject({
      sign: "pisces",
      degree: 29,
      minute: 59,
    });
  });

  it("trunca em vez de arredondar (nunca empurra para o signo seguinte)", () => {
    expect(toZodiacPosition(29.9999)).toMatchObject({
      sign: "aries",
      degree: 29,
      minute: 59,
    });
    expect(toZodiacPosition(-0.0001)).toMatchObject({
      sign: "pisces",
      degree: 29,
      minute: 59,
    });
  });

  it("mede a distância até o limite de signo", () => {
    expect(distanceToSignBoundary(359.99639)).toBeCloseTo(0.00361, 5);
    expect(distanceToSignBoundary(45)).toBe(15);
  });
});

describe("houseOf", () => {
  // Cúspides fictícias atravessando 0° (casa 4 contém 0°).
  const cusps = [270, 300, 330, 350, 20, 50, 90, 120, 150, 170, 200, 230];

  it("encontra a casa, inclusive no intervalo que cruza 0°", () => {
    expect(houseOf(275, cusps)).toBe(1);
    expect(houseOf(355, cusps)).toBe(4);
    expect(houseOf(5, cusps)).toBe(4);
    expect(houseOf(240, cusps)).toBe(12);
  });

  it("usa intervalo semiaberto: a cúspide pertence à própria casa", () => {
    expect(houseOf(300, cusps)).toBe(2);
    expect(houseOf(269.999, cusps)).toBe(12);
  });

  it("exige 12 cúspides", () => {
    expect(() => houseOf(10, [0, 30])).toThrow();
  });
});
