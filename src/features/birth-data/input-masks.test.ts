import { describe, expect, it } from "vitest";

import { maskDateBR, maskTime24 } from "./input-masks";

describe("maskDateBR", () => {
  it("formata progressivamente como DD/MM/AAAA", () => {
    expect(maskDateBR("1")).toBe("1");
    expect(maskDateBR("140")).toBe("14/0");
    expect(maskDateBR("14031")).toBe("14/03/1");
    expect(maskDateBR("14031992")).toBe("14/03/1992");
  });

  it("ignora caracteres não numéricos e excesso de dígitos", () => {
    expect(maskDateBR("14-03-1992")).toBe("14/03/1992");
    expect(maskDateBR("140319921")).toBe("14/03/1992");
  });
});

describe("maskTime24", () => {
  it("formata como HH:MM", () => {
    expect(maskTime24("9")).toBe("9");
    expect(maskTime24("093")).toBe("09:3");
    expect(maskTime24("0930")).toBe("09:30");
    expect(maskTime24("21h45")).toBe("21:45");
  });
});
