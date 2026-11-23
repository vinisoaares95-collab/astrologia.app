/**
 * Contrato do registro de consentimento (03G.3, Bloco 2), executado contra
 * a implementação em memória (sempre) e a PostgreSQL (com banco de teste).
 * Não é um arquivo de teste: é importado por *.test.ts.
 */
import { randomBytes } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";

import {
  LEASE_MS,
  receiptHashOf,
  requestHashOf,
  SETTLED_USE_TTL_MS,
  SHARED_RESULT_TTL_MS,
  type ConsentLedger,
} from "./consent-ledger";

export const T0 = Date.UTC(2026, 10, 23, 12, 0, 0, 789);
export const RETENTION_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;
const MAX = 3;

export const newReceipt = () =>
  receiptHashOf(randomBytes(16).toString("base64url"));
export const newRequest = () =>
  requestHashOf(randomBytes(18).toString("base64url"));

export async function recordConsent(ledger: ConsentLedger, at = T0) {
  const receiptHash = newReceipt();
  await ledger.record({
    receiptHash,
    consentVersion: "03g3.1",
    purposes: ["PALM_READING"],
    adultDeclared: true,
    acceptedAt: at,
    receiptExpiresAt: at + 30 * 60 * 1000,
  });
  return receiptHash;
}

export function ledgerContract(
  name: string,
  make: () => Promise<ConsentLedger> | ConsentLedger,
) {
  describe(`registro de consentimento — contrato (${name})`, () => {
    let ledger: ConsentLedger;
    beforeEach(async () => {
      ledger = await make();
    });
    const begin = (receiptHash: string, requestHash: string, now = T0 + 1000) =>
      ledger.begin({ receiptHash, requestHash, now, maxUses: MAX });

    it("autoriza até o limite; o mesmo pedido não consome duas vezes", async () => {
      const c = await recordConsent(ledger);
      const r1 = newRequest();
      const a = await begin(c, r1);
      expect(a).toMatchObject({ kind: "authorized", remaining: 2 });
      expect(await begin(c, r1)).toMatchObject({
        kind: "in_progress",
        remaining: 2,
      });
      expect(await begin(c, newRequest())).toMatchObject({
        kind: "authorized",
        remaining: 1,
      });
      expect(await begin(c, newRequest())).toMatchObject({
        kind: "authorized",
        remaining: 0,
      });
      expect(await begin(c, newRequest())).toEqual({
        kind: "exhausted",
        remaining: 0,
      });
    });

    it("consentimento inexistente, vencido ou revogado não autoriza", async () => {
      expect(await begin(newReceipt(), newRequest())).toEqual({
        kind: "consent_invalid",
      });
      const c = await recordConsent(ledger);
      expect(await begin(c, newRequest(), T0 + 31 * 60 * 1000)).toEqual({
        kind: "consent_invalid",
      });
      await ledger.revoke({ receiptHash: c, now: T0 + 2000 });
      await ledger.revoke({ receiptHash: c, now: T0 + 3000 }); // idempotente
      expect(await begin(c, newRequest())).toEqual({ kind: "consent_invalid" });
    });

    it("conclusão: pedido repetido vê 'completed', sem nova autorização", async () => {
      const c = await recordConsent(ledger);
      const r = newRequest();
      const a = await begin(c, r);
      if (a.kind !== "authorized") throw new Error(a.kind);
      expect(
        await ledger.complete({
          useId: a.useId,
          leaseId: a.leaseId,
          now: T0 + 5000,
        }),
      ).toBe("completed");
      expect(await begin(c, r)).toMatchObject({
        kind: "completed",
        useId: a.useId,
        remaining: 2,
      });
      // Concluir de novo não muda nada.
      expect(
        await ledger.complete({
          useId: a.useId,
          leaseId: a.leaseId,
          now: T0 + 6000,
        }),
      ).toBe("lost");
    });

    it("devolução: só a primeira vale; o crédito volta; o mesmo pedido pode tentar de novo", async () => {
      const c = await recordConsent(ledger);
      const r = newRequest();
      const a = await begin(c, r);
      if (a.kind !== "authorized") throw new Error(a.kind);
      expect(
        await ledger.refund({
          useId: a.useId,
          leaseId: a.leaseId,
          now: T0 + 2000,
        }),
      ).toBe(true);
      expect(
        await ledger.refund({
          useId: a.useId,
          leaseId: a.leaseId,
          now: T0 + 2001,
        }),
      ).toBe(false);
      const again = await begin(c, r, T0 + 3000);
      expect(again).toMatchObject({ kind: "authorized", remaining: 2 });
      // O lease antigo não conclui nem devolve a nova autorização.
      expect(
        await ledger.complete({
          useId: a.useId,
          leaseId: a.leaseId,
          now: T0 + 4000,
        }),
      ).toBe("lost");
    });

    it("tentativa órfã (instância caiu): devolvida uma vez e retomada pelo mesmo pedido", async () => {
      const c = await recordConsent(ledger);
      const r = newRequest();
      const a = await begin(c, r);
      if (a.kind !== "authorized") throw new Error(a.kind);
      const later = T0 + 1000 + LEASE_MS + 1;
      const b = await begin(c, r, later);
      expect(b).toMatchObject({ kind: "authorized", remaining: 2 }); // contagem não dobrou
      if (b.kind !== "authorized") throw new Error(b.kind);
      expect(b.leaseId).not.toBe(a.leaseId);
      expect(
        await ledger.complete({
          useId: a.useId,
          leaseId: a.leaseId,
          now: later + 1,
        }),
      ).toBe("lost");
      expect(
        await ledger.refund({
          useId: a.useId,
          leaseId: a.leaseId,
          now: later + 1,
        }),
      ).toBe(false);
      expect(
        await ledger.complete({
          useId: b.useId,
          leaseId: b.leaseId,
          now: later + 2,
        }),
      ).toBe("completed");
    });

    it("limpeza devolve órfãs uma vez só", async () => {
      const c = await recordConsent(ledger);
      const a = await begin(c, newRequest());
      if (a.kind !== "authorized") throw new Error(a.kind);
      const later = T0 + 1000 + LEASE_MS + 1;
      expect((await ledger.purge({ now: later })).orphansRefunded).toBe(1);
      expect((await ledger.purge({ now: later + 1 })).orphansRefunded).toBe(0);
      expect(await begin(c, newRequest(), later + 2)).toMatchObject({
        remaining: 2,
      });
    });

    it("revogado durante o processamento: conclusão descarta o resultado compartilhado", async () => {
      const c = await recordConsent(ledger);
      const a = await begin(c, newRequest());
      if (a.kind !== "authorized") throw new Error(a.kind);
      await ledger.revoke({ receiptHash: c, now: T0 + 2000 });
      expect(
        await ledger.complete({
          useId: a.useId,
          leaseId: a.leaseId,
          now: T0 + 3000,
          shared: { x: 1 },
        }),
      ).toBe("revoked");
      expect(
        await ledger.sharedResult({ useId: a.useId, now: T0 + 3001 }),
      ).toBeNull();
    });

    it("resultado compartilhado: idêntico, até 10 min, depois apagado", async () => {
      const c = await recordConsent(ledger);
      const a = await begin(c, newRequest());
      if (a.kind !== "authorized") throw new Error(a.kind);
      const payload = {
        status: "complete",
        chapters: [
          {
            number: 6,
            title: "Título com acentuação — e símbolos ✦",
            sections: [],
          },
        ],
        disclaimer: "Leitura simbólica.",
      };
      await ledger.complete({
        useId: a.useId,
        leaseId: a.leaseId,
        now: T0 + 2000,
        shared: payload,
      });
      expect(
        await ledger.sharedResult({
          useId: a.useId,
          now: T0 + 2000 + SHARED_RESULT_TTL_MS - 1,
        }),
      ).toEqual(payload);
      expect(
        await ledger.sharedResult({
          useId: a.useId,
          now: T0 + 2000 + SHARED_RESULT_TTL_MS,
        }),
      ).toBeNull();
      const report = await ledger.purge({
        now: T0 + 2000 + SHARED_RESULT_TTL_MS,
      });
      expect(report.sharedResultsDeleted).toBe(1);
    });

    it("retenção: o registro sai depois do prazo configurado (sem padrão)", async () => {
      const c = await recordConsent(ledger);
      const a = await begin(c, newRequest(), T0 + 1000);
      if (a.kind !== "authorized") throw new Error(a.kind);
      await ledger.complete({
        useId: a.useId,
        leaseId: a.leaseId,
        now: T0 + 2000,
      });
      // Uso assentado sai em 24 h; o registro só depois do prazo.
      const day = await ledger.purge({
        now: T0 + 2000 + SETTLED_USE_TTL_MS + 1,
      });
      expect(day).toMatchObject({ usesDeleted: 1, recordsDeleted: 0 });
      const end = T0 + 1000 + RETENTION_DAYS * DAY;
      expect((await ledger.purge({ now: end - 2000 })).recordsDeleted).toBe(0);
      expect((await ledger.purge({ now: end + 1000 })).recordsDeleted).toBe(1);
      expect(await begin(c, newRequest(), end + 2000)).toEqual({
        kind: "consent_invalid",
      });
    });
  });
}
