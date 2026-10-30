/** Leitura dos campos no padrão brasileiro (compartilhada por cliente e servidor). */

export type LocalDate = { year: number; month: number; day: number };
export type LocalTime = { hour: number; minute: number };

export const MIN_BIRTH_YEAR = 1900;

export type DateIssue =
  | "DATE_REQUIRED"
  | "DATE_FORMAT"
  | "DATE_NONEXISTENT"
  | "DATE_BEFORE_MIN"
  | "DATE_FUTURE";
export type TimeIssue = "TIME_REQUIRED" | "TIME_FORMAT";

/** "DD/MM/AAAA" → data de calendário. `today` é a data local de referência. */
export function parseBrazilianDate(
  value: string,
  today: LocalDate,
): { ok: true; value: LocalDate } | { ok: false; issue: DateIssue } {
  const text = value.trim();
  if (!text) return { ok: false, issue: "DATE_REQUIRED" };
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!match) return { ok: false, issue: "DATE_FORMAT" };
  const [day, month, year] = match.slice(1).map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return { ok: false, issue: "DATE_NONEXISTENT" };
  }
  if (year < MIN_BIRTH_YEAR) return { ok: false, issue: "DATE_BEFORE_MIN" };
  const asNumber = (d: LocalDate) => d.year * 10000 + d.month * 100 + d.day;
  if (asNumber({ year, month, day }) > asNumber(today)) {
    return { ok: false, issue: "DATE_FUTURE" };
  }
  return { ok: true, value: { year, month, day } };
}

/** "HH:MM" (24 h) → horário. */
export function parseTime24(
  value: string,
): { ok: true; value: LocalTime } | { ok: false; issue: TimeIssue } {
  const text = value.trim();
  if (!text) return { ok: false, issue: "TIME_REQUIRED" };
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(text);
  if (!match) return { ok: false, issue: "TIME_FORMAT" };
  return {
    ok: true,
    value: { hour: Number(match[1]), minute: Number(match[2]) },
  };
}

export function localDateOf(date: Date): LocalDate {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}
