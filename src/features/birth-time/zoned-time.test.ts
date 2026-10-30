// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";

import reference from "./__fixtures__/zoneinfo-reference.json";
import {
  formatOffset,
  localDayBounds,
  resolveLocalTime,
  toLocalDateTime,
} from "./zoned-time";

const local = (l: number[]) => ({
  year: l[0],
  month: l[1],
  day: l[2],
  hour: l[3],
  minute: l[4],
});

type ExpectedInstant = { utc: string; offsetSeconds: number };
type Expected =
  | ({ kind: "unique" } & ExpectedInstant)
  | { kind: "ambiguous"; earlier: ExpectedInstant; later: ExpectedInstant }
  | { kind: "nonexistent" };

const cases = reference.cases as unknown as {
  id: string;
  note: string;
  timeZone: string;
  local: number[];
  expected: Expected;
}[];

describe("resolveLocalTime vs. referência independente (Python zoneinfo + tzdata)", () => {
  it.each(cases)("$id — $note", (c) => {
    const r = resolveLocalTime(local(c.local), c.timeZone);
    const e = c.expected;
    expect(r.kind).toBe(e.kind);
    if (r.kind === "unique" && e.kind === "unique") {
      expect(r.instant.utc).toBe(e.utc);
      expect(r.instant.offsetSeconds).toBe(e.offsetSeconds);
    }
    if (r.kind === "ambiguous" && e.kind === "ambiguous") {
      expect([r.earlier.utc, r.later.utc]).toEqual([
        e.earlier.utc,
        e.later.utc,
      ]);
      expect([r.earlier.offsetSeconds, r.later.offsetSeconds]).toEqual([
        e.earlier.offsetSeconds,
        e.later.offsetSeconds,
      ]);
    }
  });
});

describe("horário de verão (três estados)", () => {
  const dst = (l: number[], tz: string) => {
    const r = resolveLocalTime(local(l), tz);
    if (r.kind !== "unique") throw new Error("esperado único");
    return r.instant.daylightSaving;
  };

  it("identifica horário de verão e horário padrão", () => {
    expect(dst([1986, 1, 15, 12, 0], "America/Sao_Paulo")).toBe(true);
    expect(dst([1986, 7, 15, 12, 0], "America/Sao_Paulo")).toBe(false);
    expect(dst([2001, 9, 30, 0, 20], "America/New_York")).toBe(true);
  });

  it("não confunde mudança de fuso padrão com horário de verão (Acre, 2008)", () => {
    expect(dst([2008, 6, 25, 12, 0], "America/Rio_Branco")).toBe(false);
  });

  it("declara indeterminado quando a base não tem essa informação", () => {
    expect(dst([1910, 1, 1, 12, 0], "America/Sao_Paulo")).toBeNull();
    expect(dst([1963, 12, 15, 12, 0], "America/Sao_Paulo")).toBeNull();
  });
});

describe("casos documentados em legislação (fonte independente da base de dados)", () => {
  it("Decreto 91.698/1985: horário de verão de 02/11/1985 a 15/03/1986", () => {
    const start = resolveLocalTime(
      local([1985, 11, 2, 0, 30]),
      "America/Sao_Paulo",
    );
    expect(start).toMatchObject({ kind: "nonexistent", gapMinutes: 60 });
    if (start.kind === "nonexistent") {
      expect(start.shiftedLocal).toMatchObject({ hour: 1, minute: 30 });
      expect(start.offsetBeforeLabel).toBe("UTC−03:00");
      expect(start.offsetAfterLabel).toBe("UTC−02:00");
    }
    const end = resolveLocalTime(
      local([1986, 3, 14, 23, 30]),
      "America/Sao_Paulo",
    );
    expect(end.kind).toBe("ambiguous");
    if (end.kind === "ambiguous") {
      expect(end.earlier.daylightSaving).toBe(true);
      expect(end.later.daylightSaving).toBe(false);
    }
  });

  it("Decreto 9.772/2019: sem horário de verão a partir de 2019", () => {
    const r = resolveLocalTime(
      local([2019, 12, 15, 12, 0]),
      "America/Sao_Paulo",
    );
    expect(r).toMatchObject({
      kind: "unique",
      instant: { offsetLabel: "UTC−03:00", daylightSaving: false },
    });
  });

  it("Lei 11.662/2008: Acre passa de UTC−5 para UTC−4 em 24/06/2008", () => {
    expect(
      resolveLocalTime(local([2008, 6, 24, 0, 30]), "America/Rio_Branco").kind,
    ).toBe("nonexistent");
    expect(
      resolveLocalTime(local([2008, 6, 24, 1, 30]), "America/Rio_Branco"),
    ).toMatchObject({
      kind: "unique",
      instant: { offsetLabel: "UTC−04:00", daylightSaving: false },
    });
  });

  it("não aplica o deslocamento atual a nascimentos antigos (hora média local de São Paulo)", () => {
    const r = resolveLocalTime(local([1910, 1, 1, 12, 0]), "America/Sao_Paulo");
    expect(r).toMatchObject({
      kind: "unique",
      instant: { offsetLabel: "UTC−03:06:28", utc: "1910-01-01T15:06:28Z" },
    });
  });
});

describe("localDayBounds", () => {
  it("começa o dia depois do salto quando a meia-noite não existiu", () => {
    const b = localDayBounds(
      { year: 1985, month: 11, day: 2 },
      "America/Sao_Paulo",
    );
    expect(b.start.utc).toBe("1985-11-02T03:00:00Z"); // 01:00 local, UTC−2
    expect(b.endExclusive.utc).toBe("1985-11-03T02:00:00Z");
  });

  it("dia comum tem 24 h", () => {
    const b = localDayBounds(
      { year: 1990, month: 5, day: 12 },
      "America/Recife",
    );
    expect(b.endExclusive.epochMs - b.start.epochMs).toBe(24 * 3_600_000);
  });

  it("dia de fim do horário de verão tem 25 h", () => {
    const b = localDayBounds(
      { year: 1986, month: 3, day: 14 },
      "America/Sao_Paulo",
    );
    expect(b.endExclusive.epochMs - b.start.epochMs).toBe(25 * 3_600_000);
  });
});

describe("formatação e ida e volta", () => {
  it("formata deslocamentos, inclusive com segundos", () => {
    expect(formatOffset(-10800)).toBe("UTC−03:00");
    expect(formatOffset(19800)).toBe("UTC+05:30");
    expect(formatOffset(-11188)).toBe("UTC−03:06:28");
  });

  it("converte o instante de volta para o mesmo horário local", () => {
    const r = resolveLocalTime(
      local([1995, 11, 5, 23, 30]),
      "America/Sao_Paulo",
    );
    if (r.kind !== "unique") throw new Error("esperado único");
    expect(toLocalDateTime("America/Sao_Paulo", r.instant.epochMs)).toEqual(
      local([1995, 11, 5, 23, 30]),
    );
  });
});

describe("independência do fuso do computador", () => {
  const original = process.env.TZ;
  afterEach(() => {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  });

  it.each(["UTC", "Pacific/Kiritimati", "America/Los_Angeles", "Asia/Kolkata"])(
    "resultado idêntico com TZ=%s",
    (tz) => {
      process.env.TZ = tz;
      expect(new Date(0).getTimezoneOffset()).toBeTypeOf("number");
      const r = resolveLocalTime(
        local([1986, 1, 15, 14, 30]),
        "America/Recife",
      );
      expect(r).toMatchObject({
        kind: "unique",
        instant: { utc: "1986-01-15T16:30:00Z" },
      });
      expect(
        localDayBounds({ year: 1985, month: 11, day: 2 }, "America/Sao_Paulo")
          .start.utc,
      ).toBe("1985-11-02T03:00:00Z");
    },
  );
});
