import "server-only";

/**
 * Registro persistente de consentimento (Fase 03G.3, Bloco 2).
 * Especificação: docs/privacidade/09-bloco2-especificacao.md e
 * docs/privacidade/10-bloco2-implementacao.md.
 *
 * - Guarda só o hash do código do recibo, a versão, as finalidades, a
 *   declaração de idade, horários (UTC, segundos), a contagem e a revogação.
 *   Nunca foto, IP, dados de nascimento ou características das mãos.
 * - Cada tentativa tem uma linha técnica (`PalmConsentUse`) com o hash de
 *   uma chave de idempotência aleatória do aparelho e um "lease": só quem
 *   recebeu a autorização conclui ou devolve; uma tentativa PENDING com
 *   lease vencido é órfã (a instância caiu) e é devolvida uma única vez.
 * - Toda operação que muda a contagem trava antes a linha do consentimento
 *   (`SELECT … FOR UPDATE`), sempre nessa ordem (consentimento → uso), em
 *   transações curtas. Nenhuma transação fica aberta durante a chamada ao
 *   provedor: autorizar e concluir são transações separadas.
 */
import { createHash, randomBytes } from "node:crypto";

import type { PrismaClient } from "@/generated/prisma/client";

export type ConsentPurpose = "PALM_READING" | "INTERNATIONAL_TRANSFER";

/** Tentativa órfã depois disto (prazo total da análise: 55 s). */
export const LEASE_MS = 2 * 60 * 1000;
/** Linhas de uso concluídas ou devolvidas saem depois disto (técnico). */
export const SETTLED_USE_TTL_MS = 24 * 60 * 60 * 1000;
/** Resultado compartilhado (D8): no máximo isto. */
export const SHARED_RESULT_TTL_MS = 10 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

export const receiptHashOf = (nonce: string) =>
  createHash("sha256")
    .update(`sidera:consent-receipt:v1:${nonce}`)
    .digest("hex");
export const requestHashOf = (key: string) =>
  createHash("sha256")
    .update(`sidera:analysis-request:v1:${key}`)
    .digest("hex");

/** Chave de idempotência aceita (gerada no aparelho, aleatória). */
export const REQUEST_KEY = /^[A-Za-z0-9_-]{22,64}$/;

/** Horário com segundos (sem milissegundos), como guardado no registro. */
export const toSeconds = (ms: number) => new Date(Math.floor(ms / 1000) * 1000);

export type ConsentRecordInput = {
  receiptHash: string;
  consentVersion: string;
  purposes: ConsentPurpose[];
  adultDeclared: true;
  acceptedAt: number;
  receiptExpiresAt: number;
};

export type BeginResult =
  | { kind: "authorized"; useId: string; leaseId: string; remaining: number }
  | { kind: "in_progress"; useId: string; remaining: number }
  | { kind: "completed"; useId: string; remaining: number }
  | { kind: "exhausted"; remaining: 0 }
  /** Inexistente, revogado ou vencido. */
  | { kind: "consent_invalid" };

export type CompleteResult =
  /** Concluída; o resultado pode ser entregue. */
  | "completed"
  /** Revogado durante o processamento: concluída, resultado descartado. */
  | "revoked"
  /** O lease não é mais deste pedido (tido como órfão e retomado). */
  | "lost";

export type PurgeReport = {
  orphansRefunded: number;
  sharedResultsDeleted: number;
  usesDeleted: number;
  recordsDeleted: number;
};

export interface ConsentLedger {
  record(input: ConsentRecordInput): Promise<void>;
  begin(input: {
    receiptHash: string;
    requestHash: string;
    now: number;
    maxUses: number;
  }): Promise<BeginResult>;
  complete(input: {
    useId: string;
    leaseId: string;
    now: number;
    /** Resultado compartilhado (D8), quando habilitado. */
    shared?: unknown;
  }): Promise<CompleteResult>;
  /** Devolve a tentativa (falha técnica). true só na primeira vez. */
  refund(input: {
    useId: string;
    leaseId: string;
    now: number;
  }): Promise<boolean>;
  /** Resultado compartilhado ainda válido de uma tentativa concluída. */
  sharedResult(input: { useId: string; now: number }): Promise<unknown | null>;
  /** Idempotente; vale imediatamente para todas as instâncias. */
  revoke(input: { receiptHash: string; now: number }): Promise<void>;
  purge(input: { now: number; limit?: number }): Promise<PurgeReport>;
}

export type LedgerOptions = {
  /** Prazo de retenção (decisão jurídica D1); sem valor padrão. */
  retentionDays: number;
};

const deleteAfterFrom = (ms: number, retentionDays: number) =>
  toSeconds(ms + retentionDays * DAY_MS);

const newLeaseId = () => randomBytes(16).toString("hex");

type ConsentRow = {
  id: string;
  analysesUsed: number;
  revokedAt: Date | null;
  receiptExpiresAt: Date;
  deleteAfter: Date;
};

export function createPrismaConsentLedger(
  db: PrismaClient,
  options: LedgerOptions,
): ConsentLedger {
  if (!(Number.isInteger(options.retentionDays) && options.retentionDays > 0))
    throw new Error("Prazo de retenção do registro inválido.");
  const retain = (ms: number) => deleteAfterFrom(ms, options.retentionDays);
  const later = (a: Date, b: Date) => (a > b ? a : b);

  return {
    async record(input) {
      await db.palmConsentRecord.create({
        data: {
          receiptHash: input.receiptHash,
          consentVersion: input.consentVersion,
          purposes: input.purposes,
          adultDeclared: input.adultDeclared,
          acceptedAt: toSeconds(input.acceptedAt),
          receiptExpiresAt: new Date(input.receiptExpiresAt),
          deleteAfter: retain(input.acceptedAt),
        },
      });
    },

    async begin({ receiptHash, requestHash, now, maxUses }) {
      return db.$transaction(async (tx) => {
        const [consent] = await tx.$queryRaw<ConsentRow[]>`
          SELECT "id", "analysesUsed", "revokedAt", "receiptExpiresAt", "deleteAfter"
            FROM "PalmConsentRecord" WHERE "receiptHash" = ${receiptHash}
             FOR UPDATE`;
        if (
          !consent ||
          consent.revokedAt ||
          consent.receiptExpiresAt.getTime() <= now
        )
          return { kind: "consent_invalid" } as const;
        let used = consent.analysesUsed;
        const left = () => Math.max(0, maxUses - used);

        const use = await tx.palmConsentUse.findUnique({
          where: {
            consentId_requestHash: { consentId: consent.id, requestHash },
          },
        });
        if (use?.state === "COMPLETED")
          return {
            kind: "completed",
            useId: use.id,
            remaining: left(),
          } as const;
        if (use?.state === "PENDING") {
          if (use.leaseUntil.getTime() > now)
            return {
              kind: "in_progress",
              useId: use.id,
              remaining: left(),
            } as const;
          // Órfã: a instância que a recebeu caiu. Devolvida uma única vez
          // (a linha do consentimento está travada).
          await tx.palmConsentUse.update({
            where: { id: use.id },
            data: { state: "REFUNDED", settledAt: new Date(now) },
          });
          used = Math.max(0, used - 1);
        }
        if (used >= maxUses) {
          if (used !== consent.analysesUsed)
            await tx.palmConsentRecord.update({
              where: { id: consent.id },
              data: { analysesUsed: used },
            });
          return { kind: "exhausted", remaining: 0 } as const;
        }
        const leaseId = newLeaseId();
        const lease = {
          state: "PENDING" as const,
          leaseId,
          leaseUntil: new Date(now + LEASE_MS),
          settledAt: null,
        };
        const authorized = use
          ? await tx.palmConsentUse.update({
              where: { id: use.id },
              data: lease,
            })
          : await tx.palmConsentUse.create({
              data: { consentId: consent.id, requestHash, ...lease },
            });
        used += 1;
        await tx.palmConsentRecord.update({
          where: { id: consent.id },
          data: {
            analysesUsed: used,
            lastUsedAt: toSeconds(now),
            deleteAfter: later(consent.deleteAfter, retain(now)),
          },
        });
        return {
          kind: "authorized",
          useId: authorized.id,
          leaseId,
          remaining: left(),
        } as const;
      });
    },

    async complete({ useId, leaseId, now, shared }) {
      return db.$transaction(async (tx) => {
        const [row] = await tx.$queryRaw<
          { revokedAt: Date | null; state: string; leaseId: string }[]
        >`
          SELECT c."revokedAt", u."state", u."leaseId"
            FROM "PalmConsentUse" u
            JOIN "PalmConsentRecord" c ON c."id" = u."consentId"
           WHERE u."id" = ${useId}
             FOR UPDATE OF c, u`;
        if (!row || row.state !== "PENDING" || row.leaseId !== leaseId)
          return "lost" as const;
        await tx.palmConsentUse.update({
          where: { id: useId },
          data: { state: "COMPLETED", settledAt: new Date(now) },
        });
        if (row.revokedAt) return "revoked" as const;
        if (shared !== undefined)
          await tx.palmSharedResult.create({
            data: {
              useId,
              payload: shared as object,
              expiresAt: new Date(now + SHARED_RESULT_TTL_MS),
            },
          });
        return "completed" as const;
      });
    },

    async refund({ useId, leaseId, now }) {
      return db.$transaction(async (tx) => {
        const [row] = await tx.$queryRaw<{ consentId: string }[]>`
          SELECT u."consentId"
            FROM "PalmConsentUse" u
            JOIN "PalmConsentRecord" c ON c."id" = u."consentId"
           WHERE u."id" = ${useId} AND u."state" = 'PENDING'
             AND u."leaseId" = ${leaseId}
             FOR UPDATE OF c, u`;
        if (!row) return false;
        await tx.palmConsentUse.update({
          where: { id: useId },
          data: { state: "REFUNDED", settledAt: new Date(now) },
        });
        await tx.$executeRaw`
          UPDATE "PalmConsentRecord" SET "analysesUsed" = "analysesUsed" - 1
           WHERE "id" = ${row.consentId} AND "analysesUsed" > 0`;
        return true;
      });
    },

    async sharedResult({ useId, now }) {
      const row = await db.palmSharedResult.findFirst({
        where: { useId, expiresAt: { gt: new Date(now) } },
        select: { payload: true },
      });
      return row?.payload ?? null;
    },

    async revoke({ receiptHash, now }) {
      // Mantém o registro até o prazo (D2, pendente de validação jurídica);
      // o prazo passa a contar também da revogação.
      await db.$executeRaw`
        UPDATE "PalmConsentRecord"
           SET "revokedAt" = ${toSeconds(now)},
               "deleteAfter" = GREATEST("deleteAfter", ${retain(now)})
         WHERE "receiptHash" = ${receiptHash} AND "revokedAt" IS NULL`;
    },

    async purge({ now, limit = 500 }) {
      const at = new Date(now);
      // 1. Órfãs: cada uma numa transação, com a mesma trava do begin.
      const stale = await db.palmConsentUse.findMany({
        where: { state: "PENDING", leaseUntil: { lt: at } },
        select: { id: true },
        take: limit,
      });
      let orphansRefunded = 0;
      for (const { id } of stale) {
        const refunded = await db.$transaction(async (tx) => {
          const [row] = await tx.$queryRaw<{ consentId: string }[]>`
            SELECT u."consentId"
              FROM "PalmConsentUse" u
              JOIN "PalmConsentRecord" c ON c."id" = u."consentId"
             WHERE u."id" = ${id} AND u."state" = 'PENDING'
               AND u."leaseUntil" < ${at}
               FOR UPDATE OF c, u`;
          if (!row) return false;
          await tx.palmConsentUse.update({
            where: { id },
            data: { state: "REFUNDED", settledAt: at },
          });
          await tx.$executeRaw`
            UPDATE "PalmConsentRecord" SET "analysesUsed" = "analysesUsed" - 1
             WHERE "id" = ${row.consentId} AND "analysesUsed" > 0`;
          return true;
        });
        if (refunded) orphansRefunded++;
      }
      // 2–4. Resultados vencidos, usos assentados há 24 h, registros vencidos.
      const sharedResultsDeleted = await db.$executeRaw`
        DELETE FROM "PalmSharedResult" WHERE "useId" IN (
          SELECT "useId" FROM "PalmSharedResult" WHERE "expiresAt" <= ${at} LIMIT ${limit})`;
      const usesDeleted = await db.$executeRaw`
        DELETE FROM "PalmConsentUse" WHERE "id" IN (
          SELECT "id" FROM "PalmConsentUse"
           WHERE "state" <> 'PENDING' AND "settledAt" < ${new Date(now - SETTLED_USE_TTL_MS)}
           LIMIT ${limit})`;
      const recordsDeleted = await db.$executeRaw`
        DELETE FROM "PalmConsentRecord" WHERE "id" IN (
          SELECT "id" FROM "PalmConsentRecord" WHERE "deleteAfter" < ${at} LIMIT ${limit})`;
      return {
        orphansRefunded,
        sharedResultsDeleted,
        usesDeleted,
        recordsDeleted,
      };
    },
  };
}
