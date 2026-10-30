import type { ResolvedInstant } from "../birth-time/types";
import type { LocalDate, LocalTime } from "./parse";

const pad = (n: number) => String(n).padStart(2, "0");

export const formatLocalDate = (d: LocalDate) =>
  `${pad(d.day)}/${pad(d.month)}/${d.year}`;
export const formatLocalTime = (t: LocalTime) =>
  `${pad(t.hour)}:${pad(t.minute)}`;

/** "1910-01-01T15:06:28Z" → "01/01/1910 15:06:28 UTC" (segundos só quando existem). */
export function formatUtc(instant: ResolvedInstant): string {
  const [date, time] = instant.utc.replace("Z", "").split("T");
  const [y, m, d] = date.split("-");
  const [hh, mm, ss] = time.split(":");
  return `${d}/${m}/${y} ${hh}:${mm}${ss && ss !== "00" ? `:${ss}` : ""} UTC`;
}

export function describeOffset(instant: ResolvedInstant): string {
  const kind =
    instant.daylightSaving === true
      ? "horário de verão"
      : instant.daylightSaving === false
        ? "horário padrão"
        : "tipo de horário indeterminado na base";
  return `${instant.offsetLabel} (${kind})`;
}
