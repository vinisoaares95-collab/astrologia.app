import "server-only";

/**
 * Acesso à leitura do relatório integrado — só ambiente interno.
 *
 * - SIDERA_REPORT_READING=1: leitura da JORNADA REAL (Fase 04B), com o que já
 *   está integrado (capítulos 6 e 7 da prévia). Não é o relatório completo.
 * - SIDERA_REPORT_DEMO=1: cenários de EXEMPLO (`?cenario=`, Fase 04A).
 *
 * As duas são independentes e nunca se misturam: com `?cenario=`, só
 * exemplos; sem ele, só a jornada. Sem nenhuma, a rota responde 404 (proxy).
 * O relatório completo segue restrito até a licença do motor astrológico
 * (docs/fase-04a-licenca-motor.md) e a definição dos capítulos 8 e 9.
 */
type Env = Record<string, string | undefined>;

export function isReportDemoEnabled(env: Env = process.env): boolean {
  return env.SIDERA_REPORT_DEMO === "1";
}

export function isReportReadingEnabled(env: Env = process.env): boolean {
  return env.SIDERA_REPORT_READING === "1";
}
