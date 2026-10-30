/**
 * Contrato da normalização dos dados de nascimento (Fase 02C).
 *
 * Responsabilidades separadas:
 * - localização: `features/places` (base e busca de cidades);
 * - tempo: `features/birth-time` (regras históricas IANA);
 * - cálculo: `features/astrology` (não é chamado aqui).
 * Nada é persistido.
 */
import type { ResolvedInstant } from "../birth-time/types";
import type { PlaceSummary } from "../places/types";
import type { LocalDate, LocalTime } from "./parse";

export const APPROXIMATE_MARGINS = [15, 30, 60, 120] as const;
export type ApproximateMargin = (typeof APPROXIMATE_MARGINS)[number];

/** Dados como a pessoa os forneceu. */
export type BirthDataInput = {
  date: string; // "DD/MM/AAAA"
  time:
    | { precision: "exact"; value: string } // "HH:MM"
    | {
        precision: "approximate";
        value: string;
        marginMinutes: ApproximateMargin;
      }
    | { precision: "unknown" };
  /** Id da localidade escolhida na busca; nunca um texto livre. */
  placeId: string | null;
  /**
   * Resposta da pessoa quando o horário local ocorreu duas vezes:
   * `earlier` = primeira ocorrência (ainda no horário de verão),
   * `later` = segunda ocorrência (já no horário padrão).
   */
  occurrence?: "earlier" | "later";
};

export type IssueCode =
  | "DATE_REQUIRED"
  | "DATE_FORMAT"
  | "DATE_NONEXISTENT"
  | "DATE_BEFORE_MIN"
  | "DATE_FUTURE"
  | "DATE_NONEXISTENT_IN_ZONE"
  | "TIME_REQUIRED"
  | "TIME_FORMAT"
  | "TIME_NONEXISTENT"
  | "MARGIN_INVALID"
  | "PLACE_REQUIRED"
  | "PLACE_NOT_FOUND"
  | "PLACE_INCOMPLETE"
  | "TZDB_VERSION_MISMATCH";

export type Issue = {
  field: "date" | "time" | "place";
  code: IssueCode;
  message: string;
  /** Para TIME_NONEXISTENT: horário equivalente após o salto, sugerido (não aplicado). */
  suggestion?: string;
};

export type WarningCode =
  | "TZDB_PRE_1970"
  | "BRAZIL_PRE_1990_SOURCE"
  | "LOCAL_MEAN_TIME"
  | "DAYLIGHT_SAVING"
  | "UTC_DATE_DIFFERS"
  | "AMBIGUITY_RESOLVED_BY_USER"
  | "APPROXIMATE_RANGE_HAS_TRANSITION"
  | "UNKNOWN_TIME_NOON_REFERENCE";

export type Warning = { code: WarningCode; message: string };

/** Precisão do horário depois da normalização. */
export type NormalizedTime =
  | { precision: "exact"; local: LocalTime; instant: ResolvedInstant }
  | {
      precision: "approximate";
      local: LocalTime;
      marginMinutes: ApproximateMargin;
      instant: ResolvedInstant; // horário informado
      earliest: ResolvedInstant;
      latest: ResolvedInstant;
    }
  | {
      precision: "unknown";
      /** Dia local completo em UTC (para intervalos como o da Lua). */
      dayStart: ResolvedInstant;
      dayEndExclusive: ResolvedInstant;
      /** Meio-dia local: convenção declarada para posições planetárias. */
      noonReference: ResolvedInstant;
    };

export type NormalizedBirth = {
  place: PlaceSummary & { timeZone: string };
  localDate: LocalDate;
  time: NormalizedTime;
  warnings: Warning[];
  provenance: {
    /** Versão da base IANA usada pelo runtime (ICU). */
    tzdbVersion: string;
    placeSource: "IBGE" | "GeoNames";
  };
};

export type AmbiguityOption = {
  occurrence: "earlier" | "later";
  instant: ResolvedInstant;
  description: string;
};

export type NormalizationResult =
  | { status: "ok"; birth: NormalizedBirth }
  /** Falta uma decisão da pessoa; nada foi escolhido automaticamente. */
  | {
      status: "needs-choice";
      localTime: string;
      options: [AmbiguityOption, AmbiguityOption];
    }
  | { status: "invalid"; issues: Issue[] };
