import { describe, expect, it } from "vitest";

import { validateBirthData } from "./validate-birth-data";

const today = new Date(2026, 9, 30);
const valid = {
  date: "1990-05-12",
  time: "14:30",
  unknownTime: false,
  place: "Recife",
};

describe("validateBirthData", () => {
  it("aceita dados completos", () => {
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

  it("recusa datas inexistentes, futuras ou muito antigas", () => {
    expect(
      validateBirthData({ ...valid, date: "1990-02-30" }, today).date,
    ).toMatch(/não existe/);
    expect(
      validateBirthData({ ...valid, date: "2027-01-01" }, today).date,
    ).toMatch(/futuro/);
    expect(
      validateBirthData({ ...valid, date: "1850-01-01" }, today).date,
    ).toMatch(/1900/);
  });
});
