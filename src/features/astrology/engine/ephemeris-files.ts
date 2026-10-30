/**
 * Arquivos de efemérides do Swiss Ephemeris usados pelo motor.
 *
 * Origem: https://github.com/aloistr/swisseph/tree/master/ephe
 * Licença: a mesma do Swiss Ephemeris (AGPL-3.0 ou Professional).
 * Os arquivos NÃO são versionados no repositório; `npm run ephe:fetch`
 * baixa e confere o SHA-256 abaixo.
 */
export const EPHEMERIS_FILES = [
  {
    name: "sepl_18.se1",
    description: "Planetas, 1800–2399",
    bytes: 484061,
    sha256: "ca1393ceab3a44fbc895887cf789c68819ae6a1cbc9b22225872dbe4ccd99a66",
  },
  {
    name: "semo_18.se1",
    description: "Lua, 1800–2399",
    bytes: 1304771,
    sha256: "1ca07bd67c24374d77226180c20a4f9996cba013697894810518e7eb582ca4f7",
  },
] as const;

export const EPHEMERIS_SOURCE =
  "https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/";

/** Faixa coberta pelos arquivos `_18` (anos inclusivos). */
export const EPHEMERIS_YEARS = { from: 1800, to: 2399 } as const;
