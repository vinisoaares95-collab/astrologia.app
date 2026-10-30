import { describe, expect, it } from "vitest";

import { findAspects } from "./aspects";

describe("findAspects", () => {
  it("detecta aspectos dentro do orbe e ignora os de fora", () => {
    const aspects = findAspects([
      { point: "mars", longitude: 10, speed: 0.5 },
      { point: "jupiter", longitude: 96, speed: 0.1 }, // 86° de Marte: quadratura, orbe 4°
      { point: "saturn", longitude: 140, speed: 0.05 }, // 130° de Marte e 44° de Júpiter: nada
    ]);
    expect(aspects).toHaveLength(1);
    expect(aspects[0]).toMatchObject({
      a: "mars",
      b: "jupiter",
      type: "square",
      exactAngle: 90,
    });
    expect(aspects[0].orb).toBeCloseTo(4, 10);
  });

  it("aplica o bônus de 2° para Sol e Lua", () => {
    const withSun = findAspects([
      { point: "sun", longitude: 0, speed: 1 },
      { point: "venus", longitude: 129, speed: 1.2 }, // trígono com orbe 9° (7 + 2)
    ]);
    expect(withSun).toHaveLength(1);
    const withoutSun = findAspects([
      { point: "mars", longitude: 0, speed: 1 },
      { point: "venus", longitude: 129, speed: 1.2 },
    ]);
    expect(withoutSun).toHaveLength(0);
  });

  it("limita a 5° os aspectos com ângulos e não liga ASC ao MC", () => {
    const aspects = findAspects([
      { point: "asc", longitude: 100, speed: null },
      { point: "mc", longitude: 10, speed: null },
      { point: "moon", longitude: 106, speed: 13 }, // conjunção a 6° do ASC: fora
      { point: "venus", longitude: 14, speed: 1 }, // conjunção a 4° do MC: dentro
    ]);
    // ASC–Lua (6°) e MC–Lua (orbe 6° da quadratura) ficam de fora do limite de 5°.
    expect(aspects.map((a) => `${a.a}-${a.b}-${a.type}`)).toEqual([
      "asc-venus-square",
      "mc-venus-conjunction",
      "moon-venus-square",
    ]);
    expect(aspects[0].applying).toBeNull();
    expect(aspects[1].applying).toBeNull();
  });

  it("indica se o aspecto é aplicativo ou separativo", () => {
    const [applying] = findAspects([
      { point: "moon", longitude: 95, speed: 13 },
      { point: "saturn", longitude: 0, speed: 0 }, // 95° e aumentando: separativo
    ]);
    expect(applying.type).toBe("square");
    expect(applying.applying).toBe(false);
    const [closing] = findAspects([
      { point: "moon", longitude: 85, speed: 13 },
      { point: "saturn", longitude: 0, speed: 0 },
    ]);
    expect(closing.applying).toBe(true);
  });
});
