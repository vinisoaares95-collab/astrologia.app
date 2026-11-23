import "server-only";

/**
 * A leitura do relatório integrado é só demonstração interna (Fase 04A):
 * exige SIDERA_REPORT_DEMO=1 no servidor. O relatório completo continua
 * restrito ao ambiente interno até a decisão de licenciamento do motor
 * astrológico (AGPL; docs/fase-04a-licenca-motor.md) e a definição dos
 * capítulos 8 e 9.
 */
export function isReportDemoEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.SIDERA_REPORT_DEMO === "1";
}
