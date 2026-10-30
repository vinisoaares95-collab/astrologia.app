// @vitest-environment node
import { describe, expect, it } from "vitest";

import { normalizeBirthAction } from "./actions";

describe("normalizeBirthAction (entrada não confiável)", () => {
  it.each([
    null,
    "texto",
    {},
    { date: 1, time: {}, placeId: null },
    { date: "12/05/1990", time: { precision: "exact" }, placeId: null },
  ])("recusa formato inesperado %#", async (raw) => {
    const r = await normalizeBirthAction(raw);
    expect(r.status).toBe("invalid");
  });

  it("normaliza uma entrada válida usando a base real", async () => {
    const r = await normalizeBirthAction({
      date: "12/05/1990",
      time: { precision: "exact", value: "14:30" },
      placeId: "ibge:2611606",
    });
    expect(r).toMatchObject({
      status: "ok",
      birth: { place: { name: "Recife" } },
    });
  });
});
