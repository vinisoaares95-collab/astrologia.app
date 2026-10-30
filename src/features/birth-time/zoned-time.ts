import type {
  LocalDateTime,
  LocalTimeResolution,
  ResolvedInstant,
} from "./types";

/*
 * Conversão de horário local para UTC com as regras históricas da IANA tzdb,
 * via `Intl` (ICU embutido no Node). Sempre com o fuso EXPLÍCITO: o resultado
 * não depende do fuso do computador que executa o código.
 */

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      era: "short",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    formatters.set(timeZone, f);
  }
  return f;
}

/** Verifica se o identificador IANA é reconhecido pelo runtime. */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    formatterFor(timeZone);
    return true;
  } catch {
    return false;
  }
}

/** Deslocamento (segundos) do fuso no instante dado. */
export function offsetSecondsAt(timeZone: string, epochMs: number): number {
  const t = Math.floor(epochMs / 1000) * 1000;
  const parts: Record<string, string> = {};
  for (const p of formatterFor(timeZone).formatToParts(new Date(t))) {
    parts[p.type] = p.value;
  }
  let year = Number(parts.year);
  if (parts.era === "BC") year = 1 - year;
  const wall = Date.UTC(
    year,
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return Math.round((wall - t) / 1000);
}

export function formatOffset(seconds: number): string {
  const sign = seconds < 0 ? "−" : "+";
  const abs = Math.abs(seconds);
  const h = String(Math.floor(abs / 3600)).padStart(2, "0");
  const m = String(Math.floor((abs % 3600) / 60)).padStart(2, "0");
  const s = abs % 60;
  return `UTC${sign}${h}:${m}${s ? `:${String(s).padStart(2, "0")}` : ""}`;
}

function wallMs({ year, month, day, hour, minute }: LocalDateTime): number {
  const d = new Date(0);
  d.setUTCFullYear(year, month - 1, day);
  d.setUTCHours(hour, minute, 0, 0);
  return d.getTime();
}

const nameFormatters = new Map<string, Intl.DateTimeFormat>();

/**
 * Horário de verão pelo nome longo do fuso no ICU (en-US). Não usa
 * heurística de deslocamento: mudanças de fuso padrão (ex.: Acre, 2008)
 * não podem ser confundidas com horário de verão.
 */
function daylightSavingAt(timeZone: string, epochMs: number): boolean | null {
  let f = nameFormatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "long" });
    nameFormatters.set(timeZone, f);
  }
  const name =
    f.formatToParts(new Date(epochMs)).find((p) => p.type === "timeZoneName")
      ?.value ?? "";
  if (/\b(Summer|Daylight)\b/.test(name)) return true;
  if (/^GMT[+-]/.test(name) || name === "GMT") return null;
  return false;
}

/** Instante resolvido (deslocamento e horário de verão) para um epoch dado. */
export function toInstant(timeZone: string, epochMs: number): ResolvedInstant {
  const offsetSeconds = offsetSecondsAt(timeZone, epochMs);
  return {
    utc: new Date(epochMs).toISOString().replace(".000Z", "Z"),
    epochMs,
    offsetSeconds,
    offsetLabel: formatOffset(offsetSeconds),
    daylightSaving: daylightSavingAt(timeZone, epochMs),
  };
}

const HOUR = 3_600_000;

/**
 * Resolve um horário local num fuso IANA.
 * Testa todos os deslocamentos vigentes num raio de 48 h e mantém os que
 * reproduzem exatamente o horário informado.
 */
export function resolveLocalTime(
  local: LocalDateTime,
  timeZone: string,
): LocalTimeResolution {
  const wall = wallMs(local);
  const offsets = new Set<number>();
  for (let k = -8; k <= 8; k++) {
    offsets.add(offsetSecondsAt(timeZone, wall + k * 6 * HOUR));
  }

  const valid = [...offsets]
    .map((o) => wall - o * 1000)
    .filter((t) => wall - offsetSecondsAt(timeZone, t) * 1000 === t)
    .sort((a, b) => a - b);
  const unique = [...new Set(valid)];

  if (unique.length === 1) {
    return { kind: "unique", instant: toInstant(timeZone, unique[0]) };
  }
  if (unique.length >= 2) {
    return {
      kind: "ambiguous",
      earlier: toInstant(timeZone, unique[0]),
      later: toInstant(timeZone, unique[unique.length - 1]),
    };
  }

  // Lacuna: o relógio pulou de (deslocamento menor) para (maior).
  const sorted = [...offsets].sort((a, b) => a - b);
  const before = sorted[0];
  const after = sorted[sorted.length - 1];
  const shifted = new Date(wall + (after - before) * 1000);
  return {
    kind: "nonexistent",
    gapMinutes: Math.round((after - before) / 60),
    shiftedLocal: {
      year: shifted.getUTCFullYear(),
      month: shifted.getUTCMonth() + 1,
      day: shifted.getUTCDate(),
      hour: shifted.getUTCHours(),
      minute: shifted.getUTCMinutes(),
    },
    offsetBeforeSeconds: before,
    offsetAfterSeconds: after,
    offsetBeforeLabel: formatOffset(before),
    offsetAfterLabel: formatOffset(after),
  };
}

/** Soma minutos a um horário de relógio (aritmética de calendário, sem fuso). */
export function addMinutesToLocal(
  local: LocalDateTime,
  minutes: number,
): LocalDateTime {
  const shifted = new Date(wallMs(local) + minutes * 60_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

/**
 * Limite conservador de uma janela de relógio: o instante mais cedo
 * (`earliest`) ou mais tarde (`latest`) em que o relógio pode ter marcado
 * aquele horário — considerando horários duplicados e lacunas.
 */
export function clockBoundInstant(
  local: LocalDateTime,
  timeZone: string,
  side: "earliest" | "latest",
): ResolvedInstant {
  const r = resolveLocalTime(local, timeZone);
  if (r.kind === "unique") return r.instant;
  if (r.kind === "ambiguous") return side === "earliest" ? r.earlier : r.later;
  const wall = wallMs(local);
  const offset =
    side === "earliest" ? r.offsetAfterSeconds : r.offsetBeforeSeconds;
  return toInstant(timeZone, wall - offset * 1000);
}

/**
 * Primeiro instante de um dia local e o primeiro instante do dia seguinte.
 * Se a meia-noite não existiu (início do horário de verão no Brasil), o dia
 * começa logo após o salto; se ocorreu duas vezes, na primeira ocorrência.
 * Devolve `null` quando o dia civil inteiro não existiu naquele fuso
 * (ex.: 30/12/2011 em Samoa, 31/12/1994 em Kiritimati).
 */
export function localDayBounds(
  date: { year: number; month: number; day: number },
  timeZone: string,
): { start: ResolvedInstant; endExclusive: ResolvedInstant } | null {
  const startOf = (d: { year: number; month: number; day: number }) => {
    const r = resolveLocalTime({ ...d, hour: 0, minute: 0 }, timeZone);
    if (r.kind === "unique") return r.instant.epochMs;
    if (r.kind === "ambiguous") return r.earlier.epochMs;
    const s = r.shiftedLocal;
    const shifted = resolveLocalTime(s, timeZone);
    if (shifted.kind === "nonexistent") {
      throw new Error("Lacuna de horário inesperadamente longa.");
    }
    return shifted.kind === "unique"
      ? shifted.instant.epochMs
      : shifted.earlier.epochMs;
  };
  const next = new Date(Date.UTC(date.year, date.month - 1, date.day + 1));
  const start = startOf(date);
  const end = startOf({
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
  });
  // Dia sem nenhum instante: o relógio saltou o dia inteiro.
  if (end <= start) return null;
  return {
    start: toInstant(timeZone, start),
    endExclusive: toInstant(timeZone, end),
  };
}

/** O dia civil existiu naquele fuso? */
export function localDateExists(
  date: { year: number; month: number; day: number },
  timeZone: string,
): boolean {
  return localDayBounds(date, timeZone) !== null;
}

/** Lê o horário local de um instante (para exibir datas de conferência). */
export function toLocalDateTime(
  timeZone: string,
  epochMs: number,
): LocalDateTime {
  const local = new Date(epochMs + offsetSecondsAt(timeZone, epochMs) * 1000);
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth() + 1,
    day: local.getUTCDate(),
    hour: local.getUTCHours(),
    minute: local.getUTCMinutes(),
  };
}
