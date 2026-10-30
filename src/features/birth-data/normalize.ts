import type { ResolvedInstant } from "../birth-time/types";
import {
  addMinutesToLocal,
  clockBoundInstant,
  isValidTimeZone,
  localDayBounds,
  resolveLocalTime,
  toInstant,
} from "../birth-time/zoned-time";
import { toSummary } from "../places/search";
import type { PlaceRecord } from "../places/types";
import {
  APPROXIMATE_MARGINS,
  type AmbiguityOption,
  type BirthDataInput,
  type Issue,
  type NormalizationResult,
  type NormalizedTime,
  type Warning,
} from "./contract";
import { ISSUE_MESSAGES } from "./messages";
import {
  parseBrazilianDate,
  parseTime24,
  type LocalDate,
  type LocalTime,
} from "./parse";

export type NormalizeDeps = {
  getPlace: (id: string) => PlaceRecord | undefined;
  /** Data de hoje (limite para datas futuras). */
  today: LocalDate;
  tzdbVersion: string;
};

const pad = (n: number) => String(n).padStart(2, "0");
const formatDate = (d: LocalDate) => `${pad(d.day)}/${pad(d.month)}/${d.year}`;
const formatTime = (t: LocalTime) => `${pad(t.hour)}:${pad(t.minute)}`;

function issue(
  field: Issue["field"],
  code: Issue["code"],
  extra?: Partial<Issue>,
): Issue {
  return { field, code, message: ISSUE_MESSAGES[code], ...extra };
}

/** Instante físico deslocado em minutos, lido no mesmo fuso. */
function shiftInstant(
  timeZone: string,
  base: ResolvedInstant,
  minutes: number,
): ResolvedInstant {
  return toInstant(timeZone, base.epochMs + minutes * 60_000);
}

function describeOccurrence(
  occurrence: "earlier" | "later",
  instant: ResolvedInstant,
) {
  const order =
    occurrence === "earlier" ? "Primeira ocorrência" : "Segunda ocorrência";
  const kind =
    instant.daylightSaving === true
      ? " — ainda no horário de verão"
      : instant.daylightSaving === false
        ? " — já no horário padrão"
        : "";
  return `${order} (${instant.offsetLabel})${kind}`;
}

function instantWarnings(
  instant: ResolvedInstant,
  localDate: LocalDate,
  place: PlaceRecord,
): Warning[] {
  const warnings: Warning[] = [];
  if (localDate.year < 1970) {
    warnings.push({
      code: "TZDB_PRE_1970",
      message:
        "Para datas anteriores a 1970, a base IANA pode não refletir todas as regras locais. Confira o deslocamento aplicado.",
    });
  }
  if (place.country === "BR" && localDate.year < 1990) {
    warnings.push({
      code: "BRAZIL_PRE_1990_SOURCE",
      message:
        "As regras brasileiras anteriores a 1990 na base IANA vêm de fontes secundárias; diferenças locais entre estados podem não estar representadas.",
    });
  }
  if (instant.offsetSeconds % 60 !== 0) {
    warnings.push({
      code: "LOCAL_MEAN_TIME",
      message: `Nesta data ainda valia a hora média local (${instant.offsetLabel}), anterior à adoção dos fusos padronizados.`,
    });
  }
  if (instant.daylightSaving === true) {
    warnings.push({
      code: "DAYLIGHT_SAVING",
      message: `Horário de verão vigente nesta data e local (${instant.offsetLabel}).`,
    });
  }
  const utcDate = new Date(instant.epochMs);
  if (
    utcDate.getUTCFullYear() !== localDate.year ||
    utcDate.getUTCMonth() + 1 !== localDate.month ||
    utcDate.getUTCDate() !== localDate.day
  ) {
    warnings.push({
      code: "UTC_DATE_DIFFERS",
      message: `Em UTC, este instante cai em ${pad(utcDate.getUTCDate())}/${pad(utcDate.getUTCMonth() + 1)}/${utcDate.getUTCFullYear()}.`,
    });
  }
  return warnings;
}

/**
 * Normaliza os dados de nascimento: valida, resolve a localidade escolhida e
 * converte o horário local em UTC pelas regras históricas da IANA tzdb.
 * Não chama o motor astrológico e não persiste nada.
 */
export function normalizeBirthData(
  input: BirthDataInput,
  deps: NormalizeDeps,
): NormalizationResult {
  const issues: Issue[] = [];

  const date = parseBrazilianDate(input.date, deps.today);
  if (!date.ok) issues.push(issue("date", date.issue));

  let time: LocalTime | null = null;
  if (input.time.precision !== "unknown") {
    const parsed = parseTime24(input.time.value);
    if (parsed.ok) time = parsed.value;
    else issues.push(issue("time", parsed.issue));
    if (
      input.time.precision === "approximate" &&
      !(APPROXIMATE_MARGINS as readonly number[]).includes(
        input.time.marginMinutes,
      )
    ) {
      issues.push(issue("time", "MARGIN_INVALID"));
    }
  }

  let place: PlaceRecord | undefined;
  if (!input.placeId) issues.push(issue("place", "PLACE_REQUIRED"));
  else {
    place = deps.getPlace(input.placeId);
    if (!place) issues.push(issue("place", "PLACE_NOT_FOUND"));
    else if (!place.tz || !isValidTimeZone(place.tz)) {
      const candidates = place.tzCandidates?.length
        ? ` As fronteiras indicam mais de um fuso (${place.tzCandidates.join(", ")}); escolha uma cidade próxima com fuso definido.`
        : "";
      issues.push(
        issue("place", "PLACE_INCOMPLETE", {
          message: ISSUE_MESSAGES.PLACE_INCOMPLETE + candidates,
        }),
      );
    }
  }

  if (issues.length > 0 || !date.ok || !place?.tz) {
    return { status: "invalid", issues };
  }

  const timeZone = place.tz;
  const localDate = date.value;

  // Datas civis inteiras puladas (ex.: 30/12/2011 em Samoa) não são datas de
  // nascimento possíveis — vale para qualquer precisão de horário.
  const bounds = localDayBounds(localDate, timeZone);
  if (!bounds) {
    return {
      status: "invalid",
      issues: [
        issue("date", "DATE_NONEXISTENT_IN_ZONE", {
          message: `${formatDate(localDate)} não existiu no calendário civil de ${place.name}: os relógios saltaram o dia inteiro numa mudança de fuso.`,
        }),
      ],
    };
  }

  const summary = { ...toSummary(place), timeZone };
  const provenance = {
    tzdbVersion: deps.tzdbVersion,
    placeSource: place.id.startsWith("ibge:")
      ? ("IBGE" as const)
      : ("GeoNames" as const),
  };

  let normalizedTime: NormalizedTime;
  const warnings: Warning[] = [];

  if (input.time.precision === "unknown") {
    const noon = resolveLocalTime(
      { ...localDate, hour: 12, minute: 0 },
      timeZone,
    );
    const noonReference =
      noon.kind === "unique"
        ? noon.instant
        : noon.kind === "ambiguous"
          ? noon.earlier
          : (() => {
              const shifted = resolveLocalTime(noon.shiftedLocal, timeZone);
              return shifted.kind === "unique"
                ? shifted.instant
                : shifted.kind === "ambiguous"
                  ? shifted.earlier
                  : bounds.start;
            })();
    normalizedTime = {
      precision: "unknown",
      dayStart: bounds.start,
      dayEndExclusive: bounds.endExclusive,
      noonReference,
    };
    warnings.push(
      ...instantWarnings(noonReference, localDate, place).filter(
        (w) => w.code !== "UTC_DATE_DIFFERS" && w.code !== "DAYLIGHT_SAVING",
      ),
    );
    warnings.push({
      code: "UNKNOWN_TIME_NOON_REFERENCE",
      message:
        "Sem horário, Ascendente, Meio do Céu e casas não serão calculados. Posições planetárias usarão o meio-dia local como referência declarada.",
    });
    return {
      status: "ok",
      birth: {
        place: summary,
        localDate,
        time: normalizedTime,
        warnings,
        provenance,
      },
    };
  }

  const local = { ...localDate, ...time! };
  const resolution = resolveLocalTime(local, timeZone);

  if (resolution.kind === "nonexistent") {
    const s = resolution.shiftedLocal;
    return {
      status: "invalid",
      issues: [
        issue("time", "TIME_NONEXISTENT", {
          message: `Em ${formatDate(localDate)}, em ${place.name}, os relógios avançaram ${resolution.gapMinutes} minutos (de ${resolution.offsetBeforeLabel} para ${resolution.offsetAfterLabel}); o horário ${formatTime(time!)} não existiu. Confira a certidão: o horário equivalente seria ${formatTime(s)}.`,
          suggestion: formatTime(s),
        }),
      ],
    };
  }

  let instant: ResolvedInstant;
  if (resolution.kind === "ambiguous") {
    if (!input.occurrence) {
      return {
        status: "needs-choice",
        localTime: `${formatDate(localDate)} ${formatTime(time!)}`,
        options: [
          {
            occurrence: "earlier",
            instant: resolution.earlier,
            description: describeOccurrence("earlier", resolution.earlier),
          },
          {
            occurrence: "later",
            instant: resolution.later,
            description: describeOccurrence("later", resolution.later),
          },
        ] satisfies [AmbiguityOption, AmbiguityOption],
      };
    }
    instant =
      input.occurrence === "earlier" ? resolution.earlier : resolution.later;
    warnings.push({
      code: "AMBIGUITY_RESOLVED_BY_USER",
      message: `O horário ${formatTime(time!)} ocorreu duas vezes nesta data; foi usada a ${input.occurrence === "earlier" ? "primeira" : "segunda"} ocorrência, conforme indicado.`,
    });
  } else {
    instant = resolution.instant;
  }
  warnings.unshift(...instantWarnings(instant, localDate, place));

  if (input.time.precision === "exact") {
    normalizedTime = { precision: "exact", local: time!, instant };
  } else {
    const margin = input.time.marginMinutes;
    // Extremos pelo horário de RELÓGIO (inclui ocorrências duplicadas e
    // lacunas), nunca menores que a janela física de ±margem.
    const clockEarliest = clockBoundInstant(
      addMinutesToLocal(local, -margin),
      timeZone,
      "earliest",
    );
    const clockLatest = clockBoundInstant(
      addMinutesToLocal(local, margin),
      timeZone,
      "latest",
    );
    const physicalEarliest = shiftInstant(timeZone, instant, -margin);
    const physicalLatest = shiftInstant(timeZone, instant, margin);
    const earliest =
      clockEarliest.epochMs < physicalEarliest.epochMs
        ? clockEarliest
        : physicalEarliest;
    const latest =
      clockLatest.epochMs > physicalLatest.epochMs
        ? clockLatest
        : physicalLatest;
    if (
      earliest.offsetSeconds !== latest.offsetSeconds ||
      latest.epochMs - earliest.epochMs !== 2 * margin * 60_000
    ) {
      warnings.push({
        code: "APPROXIMATE_RANGE_HAS_TRANSITION",
        message:
          "Há uma mudança de horário dentro da janela informada; o intervalo em UTC foi ampliado para cobrir todas as leituras possíveis do relógio.",
      });
    }
    normalizedTime = {
      precision: "approximate",
      local: time!,
      marginMinutes: margin,
      instant,
      earliest,
      latest,
    };
  }

  return {
    status: "ok",
    birth: {
      place: summary,
      localDate,
      time: normalizedTime,
      warnings,
      provenance,
    },
  };
}
