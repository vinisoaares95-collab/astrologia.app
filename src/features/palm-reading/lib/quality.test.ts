import { describe, expect, it } from "vitest";

import { measureQuality, qualityHints } from "./quality";

const W = 64;
const H = 64;

/** Imagem sintética em tons de cinza a partir de uma função (x, y). */
const image = (f: (x: number, y: number) => number) => {
  const data = new Uint8ClampedArray(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) data[y * W + x] = f(x, y);
  return data;
};

/** "Palma" de tom médio com linhas finas escuras: nítida e bem iluminada. */
const sharpPalm = image((x, y) =>
  (x + 2 * y) % 9 === 0 || (3 * x - y + 64) % 13 === 0 ? 70 : 150 + (x % 7) * 8,
);
/** Média 5 × 5 (borrado). */
const blur = (src: Uint8ClampedArray) => {
  const out = new Uint8ClampedArray(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let s = 0;
      let n = 0;
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) {
          const xx = Math.min(W - 1, Math.max(0, x + dx));
          const yy = Math.min(H - 1, Math.max(0, y + dy));
          s += src[yy * W + xx];
          n++;
        }
      out[y * W + x] = s / n;
    }
  return out;
};
/** A mesma cena, bem fora de foco (três passadas de borrado). */
const blurred = blur(blur(blur(sharpPalm)));

const codes = (data: Uint8ClampedArray) =>
  qualityHints(measureQuality(data, W, H)).map((h) => h.code);

describe("verificações locais de qualidade (heurísticas)", () => {
  it("foto nítida e bem iluminada não gera avisos", () => {
    expect(codes(sharpPalm)).toEqual([]);
  });

  it("a mesma foto borrada gera aviso de foco", () => {
    const sharp = measureQuality(sharpPalm, W, H).sharpness;
    const soft = measureQuality(blurred, W, H).sharpness;
    expect(soft).toBeLessThan(sharp / 4);
    expect(codes(blurred)).toContain("maybe-blurry");
  });

  it("foto escura: aviso de luz (sem acusar foco, que fica pouco confiável)", () => {
    const dark = image((x) => 10 + (x % 3) * 8);
    expect(codes(dark)).toContain("too-dark");
    expect(codes(dark)).not.toContain("maybe-blurry");
  });

  it("foto estourada: clara demais", () => {
    expect(codes(image((x) => 230 + (x % 4) * 6))).toContain("too-bright");
  });

  it("reflexo localizado: aviso de reflexo", () => {
    const glare = image((x, y) =>
      x > 44 && y > 44 ? 255 : sharpPalm[y * W + x],
    );
    expect(codes(glare)).toContain("glare");
  });

  it("baixo contraste", () => {
    expect(codes(image((x) => 128 + (x % 2)))).toContain("low-contrast");
  });

  it("as mensagens são avisos, nunca garantias", () => {
    const hints = qualityHints(measureQuality(blurred, W, H));
    for (const h of hints) expect(h.message).not.toMatch(/garant|certeza/iu);
  });

  it("recusa imagem vazia", () => {
    expect(() => measureQuality([], 0, 0)).toThrow();
  });
});
