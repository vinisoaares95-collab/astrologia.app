import { describe, expect, it } from "vitest";

import { describeOffset, formatUtc } from "./format";

const instant = (utc: string, daylightSaving: boolean | null) => ({
  utc,
  epochMs: Date.parse(utc),
  offsetSeconds: -7200,
  offsetLabel: "UTC−02:00",
  daylightSaving,
});

describe("formatação de instantes", () => {
  it("exibe a data UTC no padrão brasileiro, com segundos só quando existem", () => {
    expect(formatUtc(instant("1986-01-15T16:30:00Z", true))).toBe(
      "15/01/1986 16:30 UTC",
    );
    expect(formatUtc(instant("1910-01-01T15:06:28Z", null))).toBe(
      "01/01/1910 15:06:28 UTC",
    );
  });

  it("descreve o deslocamento e o tipo de horário", () => {
    expect(describeOffset(instant("1986-01-15T16:30:00Z", true))).toBe(
      "UTC−02:00 (horário de verão)",
    );
    expect(describeOffset(instant("1986-01-15T16:30:00Z", false))).toBe(
      "UTC−02:00 (horário padrão)",
    );
    expect(describeOffset(instant("1986-01-15T16:30:00Z", null))).toContain(
      "indeterminado",
    );
  });
});
