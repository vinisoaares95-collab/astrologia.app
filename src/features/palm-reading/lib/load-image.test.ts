import { describe, expect, it, vi } from "vitest";

import { loadLocalPhoto, type LoadDeps } from "./load-image";
import type { PreparedImage } from "./prepare-image";

/** Arquivo com tamanho declarado (sem alocar megabytes no teste). */
function fakeFile(name = "palma.jpg", type = "image/jpeg", size = 4_000_000) {
  const f = new File([new Uint8Array(8)], name, { type });
  Object.defineProperty(f, "size", { value: size });
  return f;
}

const gray = (value: number, w = 32, h = 32) => ({
  data: new Uint8ClampedArray(w * h).map((_, i) =>
    i % 5 === 0 ? value - 60 : value,
  ),
  width: w,
  height: h,
});

function deps(over: Partial<LoadDeps> = {}) {
  const release = vi.fn();
  const prepared: PreparedImage = {
    blob: new Blob([new Uint8Array(900_000)], { type: "image/jpeg" }),
    width: 1652,
    height: 2212,
    quality: 0.92,
    gray: gray(150),
  };
  const d: LoadDeps = {
    decode: vi.fn(async () => ({
      source: {} as CanvasImageSource,
      width: 3024,
      height: 4032,
      release,
    })),
    prepare: vi.fn(async () => prepared),
    createUrl: vi.fn(() => "blob:preparada"),
    ...over,
  };
  return { d, release, prepared };
}

describe("loadLocalPhoto (tudo no navegador)", () => {
  it("valida, reprocessa e devolve só a imagem preparada", async () => {
    const { d, release, prepared } = deps();
    const r = await loadLocalPhoto(fakeFile(), d);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(d.prepare).toHaveBeenCalledWith(expect.anything(), 3024, 4032);
    // A URL de pré-visualização é a da foto PREPARADA (sem metadados).
    expect(d.createUrl).toHaveBeenCalledWith(prepared.blob);
    expect(r.photo).toMatchObject({
      url: "blob:preparada",
      width: 1652,
      height: 2212,
      sizeBytes: 900_000,
      original: { width: 3024, height: 4032, sizeBytes: 4_000_000 },
      metadataRemoved: true,
    });
    expect(release).toHaveBeenCalled();
  });

  it("formato incompatível nem chega a ser decodificado", async () => {
    const { d } = deps();
    const r = await loadLocalPhoto(fakeFile("a.pdf", "application/pdf"), d);
    expect(r).toMatchObject({ ok: false, code: "unsupported-type" });
    expect(d.decode).not.toHaveBeenCalled();
  });

  it("falha de decodificação (ex.: HEIC fora do Safari)", async () => {
    const { d } = deps({
      decode: vi.fn(async () => {
        throw new Error("x");
      }),
    });
    expect(
      await loadLocalPhoto(fakeFile("a.heic", "image/heic"), d),
    ).toMatchObject({ ok: false, code: "decode-failed" });
  });

  it("resolução baixa é recusada antes do reprocessamento", async () => {
    const release = vi.fn();
    const { d } = deps({
      decode: vi.fn(async () => ({
        source: {} as CanvasImageSource,
        width: 480,
        height: 640,
        release,
      })),
    });
    expect(await loadLocalPhoto(fakeFile(), d)).toMatchObject({
      ok: false,
      code: "too-small",
    });
    expect(d.prepare).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalled();
  });

  it("erro no canvas e foto grande demais têm mensagens próprias", async () => {
    const broken = deps({
      prepare: vi.fn(async () => {
        throw new Error("canvas");
      }),
    });
    expect(await loadLocalPhoto(fakeFile(), broken.d)).toMatchObject({
      code: "processing-failed",
    });
    expect(broken.release).toHaveBeenCalled();
    const big = deps({ prepare: vi.fn(async () => null) });
    expect(await loadLocalPhoto(fakeFile(), big.d)).toMatchObject({
      code: "prepared-too-large",
    });
  });

  it("avisos de qualidade vêm da imagem preparada", async () => {
    const { d, prepared } = deps();
    prepared.gray = gray(35);
    const r = await loadLocalPhoto(fakeFile(), d);
    expect(r.ok && r.photo.quality.map((q) => q.code)).toContain("too-dark");
  });
});
