// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

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

describe("normalizeBirthAction com base de fusos diferente da validada", () => {
  it("bloqueia a conversão em vez de produzir resultado divergente", async () => {
    vi.resetModules();
    vi.doMock("../birth-time/tzdb", () => ({
      TZDB_EXPECTED_VERSION: "2026f",
      isExpectedTzdb: () => false,
      runtimeTzdbVersion: () => "2025b",
    }));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { normalizeBirthAction: action } = await import("./actions");
    const r = await action({
      date: "12/05/1990",
      time: { precision: "exact", value: "14:30" },
      placeId: "ibge:2611606",
    });
    expect(r.status === "invalid" && r.issues[0].code).toBe(
      "TZDB_VERSION_MISMATCH",
    );
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("2025b"));
    spy.mockRestore();
    vi.doUnmock("../birth-time/tzdb");
  });
});
