// @vitest-environment node
import { describe, expect, it } from "vitest";

import { listTransitions } from "./transitions";
import {
  TZDB_EXPECTED_VERSION,
  isExpectedTzdb,
  runtimeTzdbVersion,
} from "./tzdb";
import { resolveLocalTime } from "./zoned-time";

const BRAZIL_ZONES = [
  "America/Araguaina",
  "America/Bahia",
  "America/Belem",
  "America/Boa_Vista",
  "America/Campo_Grande",
  "America/Cuiaba",
  "America/Eirunepe",
  "America/Fortaleza",
  "America/Maceio",
  "America/Manaus",
  "America/Noronha",
  "America/Porto_Velho",
  "America/Recife",
  "America/Rio_Branco",
  "America/Santarem",
  "America/Sao_Paulo",
];

describe("versão da base de fusos", () => {
  it("o processo usa a versão fixada (tzdata/README.md)", () => {
    // Se falhar: o comando não passou por scripts/with-tzdata.mjs ou o Node
    // mudou a base embutida. Revise as diferenças com `npm run tz:diff`.
    expect(runtimeTzdbVersion()).toBe(TZDB_EXPECTED_VERSION);
    expect(isExpectedTzdb()).toBe(true);
  });
});

describe("regressão: transições dos 16 fusos brasileiros (1900–2030)", () => {
  it("nenhuma transição muda sem revisão explícita", async () => {
    const data = Object.fromEntries(
      BRAZIL_ZONES.map((zone) => [
        zone,
        listTransitions(zone, Date.UTC(1900, 0, 1), Date.UTC(2031, 0, 1)).map(
          (t) => `${t.at} ${t.fromOffsetSeconds}→${t.toOffsetSeconds}`,
        ),
      ]),
    );
    // Para aceitar uma mudança intencional: `npm test -- -u` e revisar o diff.
    await expect(JSON.stringify(data, null, 1) + "\n").toMatchFileSnapshot(
      "./__fixtures__/brazil-transitions.json",
    );
  });

  it("o horário de verão brasileiro termina em 2019 em todos os fusos", () => {
    for (const zone of BRAZIL_ZONES) {
      const after2019 = listTransitions(
        zone,
        Date.UTC(2019, 6, 1),
        Date.UTC(2031, 0, 1),
      );
      expect(after2019, zone).toEqual([]);
    }
  });
});

describe("correções da tzdb 2026f (NEWS: Brasil 1965 e 1966)", () => {
  const sp = (y: number, mo: number, d: number, h: number, mi: number) =>
    resolveLocalTime(
      { year: y, month: mo, day: d, hour: h, minute: mi },
      "America/Sao_Paulo",
    );

  it("31/03/1965 ainda estava no horário de verão (antes: UTC−3; agora: UTC−2)", () => {
    expect(sp(1965, 3, 31, 12, 0)).toMatchObject({
      kind: "unique",
      instant: { offsetLabel: "UTC−02:00" },
    });
  });

  it("o fim do verão de 1966 ocorreu à 01:00 de 01/03", () => {
    expect(sp(1966, 3, 1, 0, 30).kind).toBe("ambiguous");
    expect(sp(1966, 3, 1, 1, 30)).toMatchObject({
      kind: "unique",
      instant: { offsetLabel: "UTC−03:00" },
    });
  });
});
