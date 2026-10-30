import "server-only";

import { existsSync } from "node:fs";
import path from "node:path";

import {
  calc_ut,
  constants as C,
  houses_ex2,
  set_ephe_path,
  utc_to_jd,
  version,
} from "sweph";

import type { Body, UtcInstant } from "../domain/types";
import { EPHEMERIS_FILES, EPHEMERIS_YEARS } from "./ephemeris-files";
import type { EphemerisProvider } from "./ephemeris-provider";
import { ChartError } from "./errors";

/*
 * Swiss Ephemeris via `sweph` (addon nativo N-API).
 *
 * LICENÇA: AGPL-3.0 sem a licença profissional da Astrodienst. Uso restrito a
 * desenvolvimento e testes internos — nenhum serviço público pode usar este
 * adapter antes de o licenciamento ser resolvido (decisão da Fase 02A).
 */

const BODY_IDS: Record<Body, number> = {
  sun: C.SE_SUN,
  moon: C.SE_MOON,
  mercury: C.SE_MERCURY,
  venus: C.SE_VENUS,
  mars: C.SE_MARS,
  jupiter: C.SE_JUPITER,
  saturn: C.SE_SATURN,
  uranus: C.SE_URANUS,
  neptune: C.SE_NEPTUNE,
  pluto: C.SE_PLUTO,
};

// Posição aparente geocêntrica, eclíptica/equinócio verdadeiros da data
// (padrão do Swiss Ephemeris) a partir dos arquivos .se1, com velocidade.
const CALC_FLAGS = C.SEFLG_SWIEPH | C.SEFLG_SPEED;

export function resolveEphemerisPath(): string {
  return process.env.SIDERA_EPHE_PATH ?? path.join(process.cwd(), "ephe");
}

let configuredPath: string | null = null;

function ensureConfigured() {
  const dir = resolveEphemerisPath();
  if (configuredPath === dir) return;
  const missing = EPHEMERIS_FILES.filter(
    // Os arquivos são incluídos explicitamente via outputFileTracingIncludes;
    // o comentário evita que o Turbopack rastreie o projeto inteiro.
    (f) =>
      !existsSync(
        /*turbopackIgnore: true*/ path.join(
          /*turbopackIgnore: true*/ dir,
          f.name,
        ),
      ),
  );
  if (missing.length > 0) {
    throw new ChartError(
      "EPHEMERIS_FILES_MISSING",
      `Arquivos de efemérides ausentes em ${dir}: ${missing
        .map((f) => f.name)
        .join(", ")}. Execute \`npm run ephe:fetch\`.`,
    );
  }
  set_ephe_path(dir);
  configuredPath = dir;
}

export const swissEphemeris: EphemerisProvider = {
  info: {
    engine: "swiss-ephemeris",
    engineVersion: version(),
    ephemeris: EPHEMERIS_FILES.map((f) => f.name).join("+"),
    supportedYears: EPHEMERIS_YEARS,
  },

  julianDay({ year, month, day, hour, minute }: UtcInstant) {
    const result = utc_to_jd(year, month, day, hour, minute, 0, C.SE_GREG_CAL);
    if (result.flag === C.ERR) {
      throw new ChartError("INVALID_DATE", result.error);
    }
    const [tt, ut] = result.data;
    return { ut, tt };
  },

  bodyPosition(jdUt, body) {
    ensureConfigured();
    const result = calc_ut(jdUt, BODY_IDS[body], CALC_FLAGS);
    if (result.flag === C.ERR) {
      throw new ChartError("ENGINE_FAILURE", result.error);
    }
    // Sem os arquivos, o Swiss Ephemeris cai silenciosamente para o modo
    // Moshier (menos preciso). Recusamos: a precisão precisa ser conhecida.
    if ((result.flag & C.SEFLG_SWIEPH) === 0) {
      throw new ChartError(
        "EPHEMERIS_FALLBACK",
        `Cálculo sem arquivos de efemérides (${result.error.trim()})`,
      );
    }
    const [longitude, latitude, , speed] = result.data;
    return { longitude, latitude, speed };
  },

  housesPlacidus(jdUt, { latitude, longitude }) {
    ensureConfigured();
    const result = houses_ex2(jdUt, 0, latitude, longitude, "P");
    const [asc, mc] = result.data.points;
    if (result.flag === C.ERR) {
      // Acima dos círculos polares o Swiss Ephemeris troca sozinho para
      // Porfírio. Essas cúspides NÃO são Placidus e não podem ser usadas.
      if (/polar circle/i.test(result.error)) {
        return { asc, mc, cusps: null };
      }
      throw new ChartError("ENGINE_FAILURE", result.error);
    }
    return { asc, mc, cusps: [...result.data.houses] };
  },
};
