import "server-only";

/**
 * Quando o registro de consentimento vale (Fase 03G.3, Bloco 2).
 *
 * - **Produção: bloqueado.** `CONSENT_LEDGER_PRODUCTION_READY` só muda num
 *   commit futuro, depois da retenção jurídica (D1), do banco de produção
 *   (D7) e da aprovação de ativação. Enquanto bloqueado, a leitura das mãos
 *   responde 503 em produção: não há recibo sem registro e o modo sem
 *   registro não é aceito lá.
 * - Fora de produção:
 *   - sem `SIDERA_CONSENT_LEDGER`: modo anterior, sem registro (recibo só
 *     assinado) — desenvolvimento e avaliações;
 *   - `SIDERA_CONSENT_LEDGER=postgres`: exige `DATABASE_URL` e
 *     `SIDERA_CONSENT_RETENTION_DAYS` (inteiro, 1–3650). Sem padrão: o prazo
 *     é decisão jurídica; seis meses não é presumido;
 *   - `SIDERA_SHARED_RESULTS=1` (só com o registro): resultado compartilhado
 *     entre instâncias por até 10 min (D8). Também bloqueado em produção
 *     (backups e textos de privacidade pendentes).
 */
type Env = Record<string, string | undefined>;

export const CONSENT_LEDGER_PRODUCTION_READY = false;
export const SHARED_RESULTS_PRODUCTION_READY = false;
export const MAX_RETENTION_DAYS = 3650;

export type ConsentLedgerConfig =
  | { mode: "off" }
  | { mode: "blocked"; reason: string }
  | {
      mode: "postgres";
      databaseUrl: string;
      retentionDays: number;
      sharedResults: boolean;
    };

export function readConsentLedgerConfig(
  env: Env = process.env,
): ConsentLedgerConfig {
  const production = env.NODE_ENV === "production";
  if (production && !CONSENT_LEDGER_PRODUCTION_READY)
    return {
      mode: "blocked",
      reason: "registro de consentimento ainda não habilitado em produção",
    };
  const wanted = env.SIDERA_CONSENT_LEDGER?.trim();
  if (!wanted)
    return production
      ? { mode: "blocked", reason: "produção exige o registro" }
      : { mode: "off" };
  if (wanted !== "postgres")
    return { mode: "blocked", reason: "SIDERA_CONSENT_LEDGER inválido" };
  const databaseUrl = env.DATABASE_URL?.trim();
  if (!databaseUrl) return { mode: "blocked", reason: "DATABASE_URL ausente" };
  const raw = env.SIDERA_CONSENT_RETENTION_DAYS?.trim() ?? "";
  const retentionDays = /^\d+$/.test(raw) ? Number(raw) : NaN;
  if (!(retentionDays >= 1 && retentionDays <= MAX_RETENTION_DAYS))
    return {
      mode: "blocked",
      reason: "SIDERA_CONSENT_RETENTION_DAYS ausente ou inválido (decisão D1)",
    };
  const sharedResults =
    env.SIDERA_SHARED_RESULTS === "1" &&
    (!production || SHARED_RESULTS_PRODUCTION_READY);
  return { mode: "postgres", databaseUrl, retentionDays, sharedResults };
}
