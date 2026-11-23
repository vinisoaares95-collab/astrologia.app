import "server-only";

/**
 * Registro de consentimento EM MEMÓRIA — só para testes unitários.
 *
 * Não é solução de produção: não sobrevive a reinício, não é compartilhado
 * entre instâncias. Recusa ser criado com NODE_ENV=production. Segue o mesmo
 * contrato do registro PostgreSQL; os testes de contrato rodam contra os dois
 * (consent-ledger.contract.ts).
 */
import { randomBytes } from "node:crypto";

import {
  LEASE_MS,
  SETTLED_USE_TTL_MS,
  SHARED_RESULT_TTL_MS,
  toSeconds,
  type ConsentLedger,
  type ConsentRecordInput,
  type LedgerOptions,
} from "./consent-ledger";

type Record_ = ConsentRecordInput & {
  id: string;
  analysesUsed: number;
  lastUsedAt: number | null;
  revokedAt: number | null;
  deleteAfter: number;
};
type Use = {
  id: string;
  consentId: string;
  requestHash: string;
  state: "PENDING" | "COMPLETED" | "REFUNDED";
  leaseId: string;
  leaseUntil: number;
  settledAt: number | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function createMemoryConsentLedger(
  options: LedgerOptions,
  env: Record<string, string | undefined> = process.env,
): ConsentLedger & { snapshot(): { records: Record_[]; uses: Use[] } } {
  if (env.NODE_ENV === "production")
    throw new Error("Registro em memória não é permitido em produção.");
  const records = new Map<string, Record_>(); // por receiptHash
  const uses = new Map<string, Use>();
  const shared = new Map<string, { payload: unknown; expiresAt: number }>();
  const id = () => randomBytes(12).toString("hex");
  const retain = (ms: number) =>
    toSeconds(ms + options.retentionDays * DAY_MS).getTime();
  const byId = (consentId: string) =>
    [...records.values()].find((r) => r.id === consentId);

  return {
    async record(input) {
      if (records.has(input.receiptHash)) throw new Error("duplicado");
      records.set(input.receiptHash, {
        ...input,
        acceptedAt: toSeconds(input.acceptedAt).getTime(),
        id: id(),
        analysesUsed: 0,
        lastUsedAt: null,
        revokedAt: null,
        deleteAfter: retain(input.acceptedAt),
      });
    },
    async begin({ receiptHash, requestHash, now, maxUses }) {
      const c = records.get(receiptHash);
      if (!c || c.revokedAt !== null || c.receiptExpiresAt <= now)
        return { kind: "consent_invalid" };
      const left = () => Math.max(0, maxUses - c.analysesUsed);
      const use = [...uses.values()].find(
        (u) => u.consentId === c.id && u.requestHash === requestHash,
      );
      if (use?.state === "COMPLETED")
        return { kind: "completed", useId: use.id, remaining: left() };
      if (use?.state === "PENDING") {
        if (use.leaseUntil > now)
          return { kind: "in_progress", useId: use.id, remaining: left() };
        use.state = "REFUNDED";
        use.settledAt = now;
        c.analysesUsed = Math.max(0, c.analysesUsed - 1);
      }
      if (c.analysesUsed >= maxUses) return { kind: "exhausted", remaining: 0 };
      const leaseId = randomBytes(16).toString("hex");
      const next: Use = use ?? {
        id: id(),
        consentId: c.id,
        requestHash,
        state: "PENDING",
        leaseId,
        leaseUntil: 0,
        settledAt: null,
      };
      Object.assign(next, {
        state: "PENDING",
        leaseId,
        leaseUntil: now + LEASE_MS,
        settledAt: null,
      });
      uses.set(next.id, next);
      c.analysesUsed += 1;
      c.lastUsedAt = toSeconds(now).getTime();
      c.deleteAfter = Math.max(c.deleteAfter, retain(now));
      return { kind: "authorized", useId: next.id, leaseId, remaining: left() };
    },
    async complete({ useId, leaseId, now, shared: payload }) {
      const u = uses.get(useId);
      if (!u || u.state !== "PENDING" || u.leaseId !== leaseId) return "lost";
      u.state = "COMPLETED";
      u.settledAt = now;
      if (byId(u.consentId)?.revokedAt !== null) return "revoked";
      if (payload !== undefined)
        shared.set(useId, { payload, expiresAt: now + SHARED_RESULT_TTL_MS });
      return "completed";
    },
    async refund({ useId, leaseId, now }) {
      const u = uses.get(useId);
      if (!u || u.state !== "PENDING" || u.leaseId !== leaseId) return false;
      u.state = "REFUNDED";
      u.settledAt = now;
      const c = byId(u.consentId);
      if (c && c.analysesUsed > 0) c.analysesUsed -= 1;
      return true;
    },
    async sharedResult({ useId, now }) {
      const s = shared.get(useId);
      return s && s.expiresAt > now ? s.payload : null;
    },
    async revoke({ receiptHash, now }) {
      const c = records.get(receiptHash);
      if (!c || c.revokedAt !== null) return;
      c.revokedAt = toSeconds(now).getTime();
      c.deleteAfter = Math.max(c.deleteAfter, retain(now));
    },
    async purge({ now, limit = 500 }) {
      let orphansRefunded = 0;
      for (const u of uses.values())
        if (
          u.state === "PENDING" &&
          u.leaseUntil < now &&
          orphansRefunded < limit
        ) {
          u.state = "REFUNDED";
          u.settledAt = now;
          const c = byId(u.consentId);
          if (c && c.analysesUsed > 0) c.analysesUsed -= 1;
          orphansRefunded++;
        }
      let sharedResultsDeleted = 0;
      for (const [k, v] of shared)
        if (v.expiresAt <= now) {
          shared.delete(k);
          sharedResultsDeleted++;
        }
      let usesDeleted = 0;
      for (const [k, u] of uses)
        if (
          u.state !== "PENDING" &&
          (u.settledAt ?? now) < now - SETTLED_USE_TTL_MS
        ) {
          uses.delete(k);
          shared.delete(k);
          usesDeleted++;
        }
      let recordsDeleted = 0;
      for (const [k, c] of records)
        if (c.deleteAfter < now) {
          records.delete(k);
          for (const [uk, u] of uses)
            if (u.consentId === c.id) {
              uses.delete(uk);
              shared.delete(uk);
            }
          recordsDeleted++;
        }
      return {
        orphansRefunded,
        sharedResultsDeleted,
        usesDeleted,
        recordsDeleted,
      };
    },
    snapshot: () => ({
      records: [...records.values()].map((r) => ({ ...r })),
      uses: [...uses.values()].map((u) => ({ ...u })),
    }),
  };
}
