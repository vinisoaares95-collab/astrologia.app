/**
 * Controle da versão da base de fusos (IANA tzdb).
 *
 * A versão esperada é fixada aqui e carregada a partir de `tzdata/<versão>`
 * (veja tzdata/README.md). Se o runtime estiver com outra versão, os cálculos
 * de horário são BLOQUEADOS em vez de produzirem resultados diferentes sem aviso.
 */
export const TZDB_EXPECTED_VERSION = "2026f";

/** Versão efetivamente usada pelo ICU do processo atual. */
export function runtimeTzdbVersion(): string {
  return process.versions.tz ?? "desconhecida";
}

export function isExpectedTzdb(): boolean {
  return runtimeTzdbVersion() === TZDB_EXPECTED_VERSION;
}
