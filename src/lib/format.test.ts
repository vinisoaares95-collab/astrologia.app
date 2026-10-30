import { describe, expect, it } from "vitest";

import { formatBRL, formatFileSize } from "./format";

describe("formatBRL", () => {
  it("formata centavos em reais", () => {
    expect(formatBRL(3990)).toBe("R$ 39,90");
    expect(formatBRL(1490)).toBe("R$ 14,90");
    expect(formatBRL(0)).toBe("R$ 0,00");
  });
});

describe("formatFileSize", () => {
  it("usa a unidade adequada", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(3.5 * 1024 * 1024)).toBe("3,5 MB");
  });
});
