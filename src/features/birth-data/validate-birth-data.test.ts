import { describe, expect, it } from "vitest";

import { validateBirthData } from "./validate-birth-data";

const today = new Date(2026, 9, 30);
const valid = {
  date: "12/05/1990",
  time: "14:30",
  unknownTime: false,
  place: "Recife",
};

describe("validateBirthData", () => {
  it("aceita dados completos no padrão brasileiro", () => {
    expect(validateBirthData(valid, today)).toEqual({});
  });

  it("dispensa o horário quando a pessoa não sabe", () => {
    expect(
      validateBirthData({ ...valid, time: "", unknownTime: true }, today),
    ).toEqual({});
  });

  it("aponta campos ausentes", () => {
    const errors = validateBirthData(
      { date: "", time: "", unknownTime: false, place: " " },
      today,
    );
    expect(Object.keys(errors).sort()).toEqual(["date", "place", "time"]);
  });

  it("interpreta a data como dia/mês, nunca mês/dia", () => {
    // 03/04 é 3 de abril; 13/04 é válido; 04/13 não existe.
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
      validateBirthData({ ...valid, date: "1990-05-12" }, today).date,
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
    expect(validateBirthData({ ...valid, time: "23:59" }, today)).toEqual({});
    expect(validateBirthData({ ...valid, time: "00:00" }, today)).toEqual({});
    expect(validateBirthData({ ...valid, time: "24:00" }, today).time).toMatch(
      /HH:MM/,
    );
    expect(validateBirthData({ ...valid, time: "9:30" }, today).time).toMatch(
      /HH:MM/,
    );
  });
});
