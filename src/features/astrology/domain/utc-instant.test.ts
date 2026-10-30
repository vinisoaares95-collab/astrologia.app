import { describe, expect, it } from "vitest";

import { utcInstantFromIso } from "./utc-instant";

describe("utcInstantFromIso", () => {
  it("preserva os segundos da hora média local", () => {
    expect(utcInstantFromIso("1910-01-01T15:06:28Z")).toEqual({
      year: 1910,
      month: 1,
      day: 1,
      hour: 15,
      minute: 6,
      second: 28,
    });
  });

  it("preserva frações de segundo", () => {
    expect(utcInstantFromIso("2020-06-15T12:34:56.25Z").second).toBe(56.25);
  });

  it.each([
    "1910-01-01 15:06:28",
    "1910-01-01T15:06Z",
    "1910-01-01T15:06:28-03:00",
    "",
  ])("recusa formato não UTC ou incompleto: %s", (iso) => {
    expect(() => utcInstantFromIso(iso)).toThrow(
      expect.objectContaining({ code: "INVALID_DATE" }),
    );
  });
});
