import { describe, expect, it } from "vitest";

import {
  getFramingHints,
  MAX_FILE_BYTES,
  validateImageDimensions,
  validateImageFile,
} from "./image-validation";

const file = (name: string, type: string, size = 1000) => ({
  name,
  type,
  size,
});

describe("validateImageFile", () => {
  it("aceita formatos de imagem comuns", () => {
    for (const type of [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
    ]) {
      expect(validateImageFile(file("palma", type)).ok).toBe(true);
    }
  });

  it("usa a extensão quando o navegador não informa o tipo", () => {
    expect(validateImageFile(file("palma.JPG", "")).ok).toBe(true);
    expect(validateImageFile(file("palma.txt", ""))).toMatchObject({
      ok: false,
      code: "unsupported-type",
    });
  });

  it("recusa tipos não suportados", () => {
    expect(validateImageFile(file("doc.pdf", "application/pdf"))).toMatchObject(
      {
        ok: false,
        code: "unsupported-type",
      },
    );
    expect(validateImageFile(file("a.gif", "image/gif")).ok).toBe(false);
  });

  it("recusa arquivos vazios ou grandes demais", () => {
    expect(validateImageFile(file("a.jpg", "image/jpeg", 0))).toMatchObject({
      code: "empty",
    });
    expect(
      validateImageFile(file("a.jpg", "image/jpeg", MAX_FILE_BYTES + 1)),
    ).toMatchObject({ code: "too-large" });
  });
});

describe("validateImageDimensions", () => {
  it("exige resolução mínima no lado menor", () => {
    expect(validateImageDimensions(1080, 1440).ok).toBe(true);
    expect(validateImageDimensions(500, 1440)).toMatchObject({
      code: "too-small",
    });
  });
});

describe("getFramingHints", () => {
  it("sugere foto vertical quando a imagem está na horizontal", () => {
    expect(getFramingHints(1920, 1080)).toHaveLength(1);
    expect(getFramingHints(1080, 1920)).toHaveLength(0);
  });
});
