import "server-only";

/**
 * O Swiss Ephemeris está sob AGPL até a decisão de licenciamento: o cálculo
 * só roda em desenvolvimento interno, com SIDERA_INTERNAL_ENGINE=1 no
 * servidor. Sem a variável (padrão em qualquer deploy), nada é calculado.
 */
export function isInternalEngineEnabled(): boolean {
  return process.env.SIDERA_INTERNAL_ENGINE === "1";
}
