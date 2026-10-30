// @vitest-environment node
import { describe, expect, it } from "vitest";

import brazil from "../places/data/places-br.json";
import world from "../places/data/places-world.json";
import type { PlaceRecord } from "../places/types";
import type { BirthDataInput, NormalizationResult } from "./contract";
import { normalizeBirthData } from "./normalize";

const all = [...(brazil as PlaceRecord[]), ...(world as PlaceRecord[])];
const byId = new Map(all.map((p) => [p.id, p]));
const idOf = (name: string, region: string) => {
  const p = all.find(
    (x) => x.name === name && (x.admin1Code ?? x.country) === region,
  );
  if (!p) throw new Error(`${name}/${region} ausente`);
  return p.id;
};

const deps = {
  getPlace: (id: string) => byId.get(id),
  today: { year: 2026, month: 10, day: 30 },
  tzdbVersion: "teste",
};

const exact = (
  date: string,
  time: string,
  placeId: string | null,
  extra?: Partial<BirthDataInput>,
) =>
  normalizeBirthData(
    { date, time: { precision: "exact", value: time }, placeId, ...extra },
    deps,
  );

function ok(result: NormalizationResult) {
  if (result.status !== "ok")
    throw new Error(`esperado ok, veio ${JSON.stringify(result)}`);
  return result.birth;
}

describe("normalizeBirthData", () => {
  it("cidade brasileira comum: UTC, fuso e coordenadas", () => {
    const birth = ok(exact("12/05/1990", "14:30", idOf("Recife", "PE")));
    expect(birth.place).toMatchObject({
      label: "Recife — PE, Brasil",
      timeZone: "America/Recife",
    });
    expect(birth.time).toMatchObject({
      precision: "exact",
      local: { hour: 14, minute: 30 },
      instant: { utc: "1990-05-12T17:30:00Z", offsetLabel: "UTC−03:00" },
    });
    expect(birth.provenance.placeSource).toBe("IBGE");
  });

  it("homônimas: cada escolha leva a um fuso e a um instante diferentes", () => {
    const pi = ok(exact("15/01/2015", "12:00", idOf("Bom Jesus", "PI")));
    const rs = ok(exact("15/01/2015", "12:00", idOf("Bom Jesus", "RS")));
    expect(pi.place.timeZone).toBe("America/Fortaleza");
    expect(rs.place.timeZone).toBe("America/Sao_Paulo");
    expect(pi.time.precision === "exact" && pi.time.instant.utc).toBe(
      "2015-01-15T15:00:00Z",
    );
    expect(rs.time.precision === "exact" && rs.time.instant.utc).toBe(
      "2015-01-15T14:00:00Z",
    ); // horário de verão no RS
  });

  it("mudança histórica de fuso no Brasil (Acre, 2008)", () => {
    const before = ok(exact("23/06/2008", "12:00", idOf("Rio Branco", "AC")));
    const after = ok(exact("25/06/2008", "12:00", idOf("Rio Branco", "AC")));
    expect(
      before.time.precision === "exact" && before.time.instant.offsetLabel,
    ).toBe("UTC−05:00");
    expect(
      after.time.precision === "exact" && after.time.instant.offsetLabel,
    ).toBe("UTC−04:00");
  });

  it("horário de verão vigente gera aviso", () => {
    const birth = ok(exact("15/01/1986", "14:30", idOf("Recife", "PE")));
    expect(birth.warnings.map((w) => w.code)).toContain("DAYLIGHT_SAVING");
  });

  it("início do horário de verão: horário inexistente é recusado com sugestão, sem ajuste automático", () => {
    const r = exact("02/11/1985", "00:30", idOf("São Paulo", "SP"));
    expect(r.status).toBe("invalid");
    if (r.status === "invalid") {
      expect(r.issues[0]).toMatchObject({
        field: "time",
        code: "TIME_NONEXISTENT",
        suggestion: "01:30",
      });
      expect(r.issues[0].message).toContain("não existiu");
    }
  });

  it("fim do horário de verão: horário duplicado exige escolha", () => {
    const sp = idOf("São Paulo", "SP");
    const r = exact("14/03/1986", "23:30", sp);
    expect(r.status).toBe("needs-choice");
    if (r.status !== "needs-choice") return;
    expect(r.options.map((o) => o.instant.offsetLabel)).toEqual([
      "UTC−02:00",
      "UTC−03:00",
    ]);
    expect(r.options[0].description).toContain("Primeira ocorrência");
    expect(r.options[1].description).toContain("horário padrão");

    const later = ok(exact("14/03/1986", "23:30", sp, { occurrence: "later" }));
    expect(later.time.precision === "exact" && later.time.instant.utc).toBe(
      "1986-03-15T02:30:00Z",
    );
    expect(later.warnings.map((w) => w.code)).toContain(
      "AMBIGUITY_RESOLVED_BY_USER",
    );
  });

  it("nascimento em outro país", () => {
    const birth = ok(exact("30/09/2001", "00:20", idOf("New York City", "US")));
    expect(birth.place.label).toBe("New York City — New York, Estados Unidos");
    expect(birth.time.precision === "exact" && birth.time.instant.utc).toBe(
      "2001-09-30T04:20:00Z",
    );
    expect(birth.provenance.placeSource).toBe("GeoNames");
  });

  it("mudança de data na conversão para UTC", () => {
    const birth = ok(exact("05/11/1995", "23:30", idOf("São Paulo", "SP")));
    expect(birth.time.precision === "exact" && birth.time.instant.utc).toBe(
      "1995-11-06T01:30:00Z",
    );
    expect(
      birth.warnings.find((w) => w.code === "UTC_DATE_DIFFERS")?.message,
    ).toContain("06/11/1995");
  });

  it("datas anteriores a 1970 e hora média local geram avisos", () => {
    const birth = ok(exact("01/01/1910", "12:00", idOf("São Paulo", "SP")));
    const codes = birth.warnings.map((w) => w.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        "TZDB_PRE_1970",
        "BRAZIL_PRE_1990_SOURCE",
        "LOCAL_MEAN_TIME",
      ]),
    );
    expect(
      birth.time.precision === "exact" && birth.time.instant.offsetLabel,
    ).toBe("UTC−03:06:28");
  });

  it.each([
    ["", "DATE_REQUIRED"],
    ["1990-05-12", "DATE_FORMAT"],
    ["30/02/1990", "DATE_NONEXISTENT"],
    ["01/01/1899", "DATE_BEFORE_MIN"],
    ["31/10/2026", "DATE_FUTURE"],
  ])("data inválida %s → %s", (date, code) => {
    const r = exact(date, "12:00", idOf("Recife", "PE"));
    expect(r.status === "invalid" && r.issues.map((i) => i.code)).toContain(
      code,
    );
  });

  it("horário inválido", () => {
    const r = exact("12/05/1990", "24:00", idOf("Recife", "PE"));
    expect(r.status === "invalid" && r.issues[0].code).toBe("TIME_FORMAT");
  });

  it("horário desconhecido: dia local em UTC e meio-dia de referência, sem instante exato", () => {
    const r = normalizeBirthData(
      {
        date: "02/11/1985",
        time: { precision: "unknown" },
        placeId: idOf("São Paulo", "SP"),
      },
      deps,
    );
    const birth = ok(r);
    expect(birth.time.precision).toBe("unknown");
    if (birth.time.precision !== "unknown") return;
    expect(birth.time.dayStart.utc).toBe("1985-11-02T03:00:00Z"); // meia-noite não existiu
    expect(birth.time.noonReference.utc).toBe("1985-11-02T14:00:00Z");
    expect("instant" in birth.time).toBe(false);
    expect(birth.warnings.map((w) => w.code)).toContain(
      "UNKNOWN_TIME_NOON_REFERENCE",
    );
  });

  it("horário aproximado: janela em UTC", () => {
    const birth = ok(
      normalizeBirthData(
        {
          date: "12/05/1990",
          time: { precision: "approximate", value: "14:30", marginMinutes: 30 },
          placeId: idOf("Recife", "PE"),
        },
        deps,
      ),
    );
    expect(birth.time).toMatchObject({
      precision: "approximate",
      marginMinutes: 30,
      earliest: { utc: "1990-05-12T17:00:00Z" },
      latest: { utc: "1990-05-12T18:00:00Z" },
    });
  });

  it("horário aproximado com mudança de horário na janela: amplia e avisa", () => {
    const birth = ok(
      normalizeBirthData(
        {
          date: "14/03/1986",
          time: { precision: "approximate", value: "22:30", marginMinutes: 60 },
          placeId: idOf("São Paulo", "SP"),
        },
        deps,
      ),
    );
    expect(birth.warnings.map((w) => w.code)).toContain(
      "APPROXIMATE_RANGE_HAS_TRANSITION",
    );
    // Relógio de 21:30 (UTC−2) até a SEGUNDA ocorrência de 23:30 (UTC−3).
    expect(birth.time).toMatchObject({
      earliest: { utc: "1986-03-14T23:30:00Z", offsetLabel: "UTC−02:00" },
      latest: { utc: "1986-03-15T02:30:00Z", offsetLabel: "UTC−03:00" },
    });
  });

  it("margem de horário aproximado inválida", () => {
    const r = normalizeBirthData(
      {
        date: "12/05/1990",
        time: {
          precision: "approximate",
          value: "14:30",
          marginMinutes: 45 as never,
        },
        placeId: idOf("Recife", "PE"),
      },
      deps,
    );
    expect(r.status === "invalid" && r.issues[0].code).toBe("MARGIN_INVALID");
  });

  it("localidade não selecionada, inexistente ou sem informação suficiente", () => {
    const none = exact("12/05/1990", "14:30", null);
    expect(none.status === "invalid" && none.issues[0].code).toBe(
      "PLACE_REQUIRED",
    );
    const missing = exact("12/05/1990", "14:30", "ibge:0");
    expect(missing.status === "invalid" && missing.issues[0].code).toBe(
      "PLACE_NOT_FOUND",
    );
    const kashgar = exact("12/05/1990", "14:30", idOf("Kashgar", "CN"));
    expect(kashgar.status === "invalid" && kashgar.issues[0]).toMatchObject({
      code: "PLACE_INCOMPLETE",
    });
    expect(kashgar.status === "invalid" && kashgar.issues[0].message).toContain(
      "Asia/Urumqi",
    );
  });

  it("reúne todos os problemas de uma vez", () => {
    const r = exact("", "", null);
    expect(r.status === "invalid" && r.issues.map((i) => i.field)).toEqual([
      "date",
      "time",
      "place",
    ]);
  });
});
