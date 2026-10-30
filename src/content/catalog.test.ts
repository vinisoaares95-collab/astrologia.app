import { describe, expect, it } from "vitest";

import { mainProduct, orderBumps } from "./catalog";
import { reportParts } from "./report-chapters";

describe("catálogo", () => {
  it("mantém os preços de teste definidos", () => {
    expect(mainProduct.priceCents).toBe(3990);
    expect(orderBumps.map((b) => b.priceCents)).toEqual([1490, 1990]);
  });

  it("usa slugs únicos", () => {
    const slugs = [mainProduct, ...orderBumps].map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("estrutura do relatório", () => {
  it("tem três partes e nove capítulos numerados em sequência", () => {
    expect(reportParts).toHaveLength(3);
    const numbers = reportParts.flatMap((p) => p.chapters.map((c) => c.number));
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});
