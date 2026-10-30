import { describe, expect, it } from "vitest";

import type { BirthDataInput } from "./contract";
import { validateBirthData } from "./validate-birth-data";

const today = new Date(2026, 9, 30);
const valid: Pick<BirthDataInput, "date" | "time" | "placeId"> = {
  date: "12/05/1990",
  time: { precision: "exact", value: "14:30" },
  placeId: "ibge:2611606",
};

describe("validateBirthData", () => {
  it("aceita dados completos no padrão brasileiro", () => {
    expect(validateBirthData(valid, today)).toEqual({});
  });

  it("dispensa o horário quando a pessoa não sabe", () => {
    expect(
      validateBirthData({ ...valid, time: { precision: "unknown" } }, today),
    ).toEqual({});
  });

  it("valida o horário também no modo aproximado", () => {
    const errors = validateBirthData(
      {
        ...valid,
        time: { precision: "approximate", value: "9:3", marginMinutes: 30 },
      },
      today,
    );
    expect(errors.time).toMatch(/HH:MM/);
  });

  it("aponta campos ausentes, inclusive a cidade não selecionada", () => {
    const errors = validateBirthData(
      { date: "", time: { precision: "exact", value: "" }, placeId: null },
      today,
    );
    expect(Object.keys(errors).sort()).toEqual(["date", "place", "time"]);
    expect(errors.place).toMatch(/Selecione a cidade/);
  });

  it("interpreta a data como dia/mês, nunca mês/dia", () => {
    expect(validateBirthData({ ...valid, date: "13/04/1990" }, today)).toEqual(
      {},
    );
    expect(
      validateBirthData({ ...valid, date: "04/13/1990" }, today).date,
    ).toMatch(/não existe/);
  });

  it("recusa formatos incompletos, datas inexistentes, futuras ou muito antigas", () => {
    expect(
      validateBirthData({ ...valid, date: "12/05/90" }, today).date,
    ).toMatch(/DD\/MM\/AAAA/);
    expect(
      validateBirthData({ ...valid, date: "30/02/1990" }, today).date,
    ).toMatch(/não existe/);
    expect(
      validateBirthData({ ...valid, date: "01/01/2027" }, today).date,
    ).toMatch(/futuro/);
    expect(
      validateBirthData({ ...valid, date: "01/01/1850" }, today).date,
    ).toMatch(/1900/);
  });

  it("aceita horário de 24 horas e recusa valores inválidos", () => {
    const at = (value: string) =>
      validateBirthData(
        { ...valid, time: { precision: "exact", value } },
        today,
      ).time;
    expect(at("23:59")).toBeUndefined();
    expect(at("00:00")).toBeUndefined();
    expect(at("24:00")).toMatch(/HH:MM/);
    expect(at("9:30")).toMatch(/HH:MM/);
  });
});
