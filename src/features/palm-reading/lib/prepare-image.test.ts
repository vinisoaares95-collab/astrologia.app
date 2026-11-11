import { describe, expect, it } from "vitest";

import {
  encodeWithinLimit,
  jpegMetadataSegments,
  MAX_LONG_EDGE_PX,
  MAX_VISUAL_TOKENS,
  targetDimensions,
  visualTokens,
} from "./prepare-image";

describe("targetDimensions (limites oficiais de visão)", () => {
  it.each([
    [4032, 3024], // foto típica de celular, 12 MP
    [3024, 4032],
    [4000, 6000],
    [8000, 6000],
    [2576, 2576],
  ])("%i×%i cabe em 2 576 px e 4 784 tokens, na mesma proporção", (w, h) => {
    const t = targetDimensions(w, h);
    expect(Math.max(t.width, t.height)).toBeLessThanOrEqual(MAX_LONG_EDGE_PX);
    expect(visualTokens(t.width, t.height)).toBeLessThanOrEqual(
      MAX_VISUAL_TOKENS,
    );
    expect(t.width / t.height).toBeCloseTo(w / h, 2);
    // Aproveita o limite: não reduz mais do que o necessário (≥ 97%).
    expect(visualTokens(t.width, t.height)).toBeGreaterThan(
      MAX_VISUAL_TOKENS * 0.97,
    );
  });

  it("retrato 3:4 de 12 MP fica com ~1 650 × 2 200 px", () => {
    const t = targetDimensions(3024, 4032);
    expect(t.width).toBeGreaterThan(1600);
    expect(t.height).toBeGreaterThan(2150);
    expect(t.scaled).toBe(true);
  });

  it("nunca amplia imagens pequenas", () => {
    expect(targetDimensions(1080, 1440)).toEqual({
      width: 1080,
      height: 1440,
      scaled: false,
    });
  });

  it("recusa dimensões inválidas", () => {
    expect(() => targetDimensions(0, 100)).toThrow();
  });
});

/** JPEG mínimo com os segmentos pedidos (só cabeçalhos). */
function jpeg(...segments: [number, string][]) {
  const parts: number[] = [0xff, 0xd8];
  for (const [marker, text] of segments) {
    const payload = [...text].map((c) => c.charCodeAt(0));
    const length = payload.length + 2;
    parts.push(0xff, marker, length >> 8, length & 0xff, ...payload);
  }
  parts.push(0xff, 0xda, 0x00, 0x02, 0xff, 0xd9);
  return new Uint8Array(parts);
}

describe("jpegMetadataSegments", () => {
  it("encontra EXIF, XMP e IPTC", () => {
    const bytes = jpeg(
      [0xe0, "JFIF\0"],
      [0xe1, "Exif\0\0GPS..."],
      [0xe1, "http://ns.adobe.com/xap/1.0/\0<x/>"],
      [0xed, "Photoshop 3.0\0"],
    );
    expect(jpegMetadataSegments(bytes)).toEqual(["EXIF", "XMP", "IPTC"]);
  });

  it("um JPEG só com JFIF não tem metadados", () => {
    expect(jpegMetadataSegments(jpeg([0xe0, "JFIF\0"]))).toEqual([]);
  });

  it("perfil de cor (ICC) não é tratado como metadado pessoal", () => {
    expect(jpegMetadataSegments(jpeg([0xe2, "ICC_PROFILE\0"]))).toEqual([]);
  });
});

describe("encodeWithinLimit (compressão)", () => {
  const blobOf = (size: number) => new Blob([new Uint8Array(size)]);

  it("usa a maior qualidade quando cabe", async () => {
    const qualities: number[] = [];
    const r = await encodeWithinLimit(async (q) => {
      qualities.push(q);
      return blobOf(1000);
    }, 2000);
    expect(r?.quality).toBe(0.92);
    expect(qualities).toEqual([0.92]);
  });

  it("desce em passos pequenos e nunca abaixo de 0,85", async () => {
    const qualities: number[] = [];
    const sizes: Record<string, number> = {
      0.92: 3000,
      0.88: 2500,
      0.85: 1500,
    };
    const r = await encodeWithinLimit(async (q) => {
      qualities.push(q);
      return blobOf(sizes[q]);
    }, 2000);
    expect(r?.quality).toBe(0.85);
    expect(qualities).toEqual([0.92, 0.88, 0.85]);
  });

  it("se nem 0,85 couber, pede outra foto (null)", async () => {
    expect(await encodeWithinLimit(async () => blobOf(5000), 2000)).toBeNull();
  });

  it("falha do codificador vira erro", async () => {
    await expect(encodeWithinLimit(async () => null, 2000)).rejects.toThrow();
  });
});
