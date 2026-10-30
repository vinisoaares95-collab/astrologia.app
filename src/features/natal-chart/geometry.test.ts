import { describe, expect, it } from "vitest";

import { angularSeparation } from "../astrology/domain/zodiac";
import {
  WHEEL,
  annularSectorPath,
  layoutGlyphs,
  longitudeAtPoint,
  pointAt,
  screenAngle,
} from "./geometry";

const C = WHEEL.center;

describe("orientação", () => {
  it("o ponto de orientação fica às 9 h (lado esquerdo)", () => {
    const asc = 174.75;
    expect(screenAngle(asc, asc)).toBe(180);
    const p = pointAt(asc, 100, asc);
    expect(p.x).toBeCloseTo(C - 100, 9);
    expect(p.y).toBeCloseTo(C, 9);
  });

  it("a longitude cresce no sentido anti-horário: +90° fica embaixo, −90° em cima", () => {
    const asc = 10;
    expect(pointAt(asc + 90, 100, asc)).toMatchObject({
      x: expect.closeTo(C, 9),
      y: expect.closeTo(C + 100, 9),
    });
    expect(pointAt(asc - 90, 100, asc)).toMatchObject({
      x: expect.closeTo(C, 9),
      y: expect.closeTo(C - 100, 9),
    });
    expect(pointAt(asc + 180, 100, asc).x).toBeCloseTo(C + 100, 9); // Descendente à direita
  });

  it("sem horário, 0° de Áries fica às 9 h e Câncer (90°) embaixo", () => {
    expect(pointAt(0, 100, 0).x).toBeCloseTo(C - 100, 9);
    expect(pointAt(90, 100, 0).y).toBeCloseTo(C + 100, 9);
  });

  it("ida e volta: o ponto desenhado devolve a mesma longitude", () => {
    for (const orientation of [0, 33.3, 174.75, 359.9]) {
      for (let lon = 0; lon < 360; lon += 7.3) {
        const back = longitudeAtPoint(
          pointAt(lon, 250, orientation),
          orientation,
        );
        expect(angularSeparation(back, lon)).toBeLessThan(1e-9);
      }
    }
  });
});

describe("setores anelares", () => {
  it("usa arco pequeno para 30° e grande acima de 180°, no sentido anti-horário (sweep 0)", () => {
    expect(annularSectorPath(400, 300, 0, 30, 0)).toMatch(/A400 400 0 0 0 /);
    expect(annularSectorPath(400, 300, 0, 200, 0)).toMatch(/A400 400 0 1 0 /);
  });

  it("começa no ponto da longitude inicial", () => {
    const path = annularSectorPath(400, 300, 30, 60, 0);
    const [, x, y] = /^M([\d.]+) ([\d.]+)/.exec(path)!.map(Number);
    expect(angularSeparation(longitudeAtPoint({ x, y }, 0), 30)).toBeLessThan(
      0.01,
    );
  });
});

describe("afastamento de símbolos próximos", () => {
  const bodies = [
    { id: "sun", longitude: 100 },
    { id: "mercury", longitude: 101 },
    { id: "venus", longitude: 102.5 },
    { id: "mars", longitude: 250 },
    { id: "moon", longitude: 359.5 },
    { id: "jupiter", longitude: 0.5 },
  ];
  const placed = layoutGlyphs(bodies, 8);

  it("mantém a posição real intacta", () => {
    for (const b of bodies) {
      expect(placed.find((p) => p.id === b.id)!.longitude).toBe(b.longitude);
    }
  });

  it("garante a distância mínima entre símbolos e preserva a ordem zodiacal", () => {
    const display = placed.map((p) => p.displayLongitude);
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        expect(
          angularSeparation(display[i], display[j]),
        ).toBeGreaterThanOrEqual(8 - 1e-6);
      }
    }
    const order = (ids: string[]) => ids.join(",");
    const byTrue = [...placed]
      .sort((a, b) => a.longitude - b.longitude)
      .map((p) => p.id);
    expect(order(byTrue)).toBe("jupiter,sun,mercury,venus,mars,moon");
    // Ordem preservada também no grupo que atravessa 0° (Lua 359,5° antes de Júpiter 0,5°).
    const moon = placed.find((p) => p.id === "moon")!.displayLongitude;
    const jupiter = placed.find((p) => p.id === "jupiter")!.displayLongitude;
    expect((jupiter - moon + 360) % 360).toBeCloseTo(8, 6);
  });

  it("centraliza cada grupo na média das posições reais e limita o deslocamento", () => {
    const group = placed.filter((p) =>
      ["sun", "mercury", "venus"].includes(p.id),
    );
    const mean =
      group.reduce((s, p) => s + p.displayLongitude, 0) / group.length;
    expect(mean).toBeCloseTo((100 + 101 + 102.5) / 3, 6);
    for (const p of placed)
      expect(
        angularSeparation(p.displayLongitude, p.longitude),
      ).toBeLessThanOrEqual(8);
    expect(placed.find((p) => p.id === "mars")!.displayLongitude).toBe(250); // isolado: não se move
  });

  it("dez corpos em conjunção ficam separados sem perder a ordem", () => {
    const stellium = Array.from({ length: 10 }, (_, i) => ({
      id: `b${i}`,
      longitude: 120 + i * 0.3,
    }));
    const out = layoutGlyphs(stellium, 7);
    const display = out.map((p) => p.displayLongitude);
    display
      .slice(1)
      .forEach((d, i) => expect(d - display[i]).toBeCloseTo(7, 6));
  });
});
