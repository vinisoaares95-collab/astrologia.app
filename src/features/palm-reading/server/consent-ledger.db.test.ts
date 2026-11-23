// @vitest-environment node
/**
 * Registro de consentimento com PostgreSQL REAL (03G.3, Bloco 2).
 *
 * Só roda com SIDERA_TEST_DATABASE_URL apontando para um servidor LOCAL (o
 * teste recusa outros hosts). Cada execução cria um banco novo, com nome
 * aleatório, aplica as migrações do zero (`prisma migrate deploy`, que não
 * apaga nada) e remove só esse banco no fim. Sem dados reais.
 *
 *   SIDERA_TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:54329/postgres \
 *     npm test -- consent-ledger.db
 */
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PrismaClient } from "@/generated/prisma/client";

import {
  createPrismaConsentLedger,
  LEASE_MS,
  type ConsentLedger,
} from "./consent-ledger";
import {
  ledgerContract,
  newRequest,
  recordConsent,
  RETENTION_DAYS,
  T0,
} from "./consent-ledger.contract";
import { handlerLedgerSuite } from "./handlers.ledger.suite";

const URL_ = process.env.SIDERA_TEST_DATABASE_URL;
const local = (u: string) =>
  ["127.0.0.1", "localhost", "::1"].includes(new URL(u).hostname);
const enabled = Boolean(URL_ && local(URL_));
if (URL_ && !local(URL_))
  throw new Error(
    "SIDERA_TEST_DATABASE_URL precisa ser um banco local descartável.",
  );

// Banco exclusivo desta execução, criado e removido pelo próprio teste.
const DB_NAME = `sidera_t_${randomBytes(6).toString("hex")}`;
const testUrl = () => {
  const u = new URL(URL_!);
  u.pathname = `/${DB_NAME}`;
  return u.toString();
};
const clients: PrismaClient[] = [];
const client = () => {
  const c = new PrismaClient({
    adapter: new PrismaPg({ connectionString: testUrl() }),
  });
  clients.push(c);
  return c;
};
let db: PrismaClient;
const ledgerOf = (c: PrismaClient): ConsentLedger =>
  createPrismaConsentLedger(c, { retentionDays: RETENTION_DAYS });
const truncate = () =>
  db.$executeRawUnsafe(
    'TRUNCATE "PalmSharedResult", "PalmConsentUse", "PalmConsentRecord" CASCADE',
  );

describe.skipIf(!enabled)("PostgreSQL real", () => {
  let admin: PrismaClient;
  beforeAll(async () => {
    admin = new PrismaClient({
      adapter: new PrismaPg({ connectionString: URL_! }),
    });
    await admin.$executeRawUnsafe(`CREATE DATABASE "${DB_NAME}"`);
    execFileSync("npx", ["prisma", "migrate", "deploy"], {
      env: { ...process.env, DATABASE_URL: testUrl() },
      stdio: "pipe",
    });
    db = client();
  }, 120_000);
  afterAll(async () => {
    await Promise.all(clients.map((c) => c.$disconnect()));
    // Só o banco criado por esta execução (nome aleatório acima).
    await admin.$executeRawUnsafe(
      `DROP DATABASE IF EXISTS "${DB_NAME}" WITH (FORCE)`,
    );
    await admin.$disconnect();
  }, 60_000);

  describe("modelo e migração", () => {
    it("migração aplicada do zero; colunas só as previstas (sem foto, IP, nascimento ou mão)", async () => {
      const cols = async (table: string) =>
        (
          await db.$queryRaw<{ column_name: string }[]>`
            SELECT column_name FROM information_schema.columns
             WHERE table_name = ${table} ORDER BY column_name`
        ).map((r) => r.column_name);
      expect(await cols("PalmConsentRecord")).toEqual(
        [
          "acceptedAt",
          "adultDeclared",
          "analysesUsed",
          "consentVersion",
          "deleteAfter",
          "id",
          "lastUsedAt",
          "purposes",
          "receiptExpiresAt",
          "receiptHash",
          "revokedAt",
        ].sort(),
      );
      expect(await cols("PalmConsentUse")).toEqual(
        [
          "consentId",
          "createdAt",
          "id",
          "leaseId",
          "leaseUntil",
          "requestHash",
          "settledAt",
          "state",
        ].sort(),
      );
      expect(await cols("PalmSharedResult")).toEqual([
        "expiresAt",
        "payload",
        "useId",
      ]);
      // Nenhuma coluna de IP, foto, mão, nascimento, local ou navegador.
      for (const column of [
        ...(await cols("PalmConsentRecord")),
        ...(await cols("PalmConsentUse")),
      ])
        expect([
          column,
          /^ip$|ip(address)?$|photo|foto|image|hand|^mao|birth|nascimento|place|agent/i.test(
            column,
          ),
        ]).toEqual([column, false]);
      const migrations = await db.$queryRaw<{ n: bigint }[]>`
        SELECT count(*) AS n FROM "_prisma_migrations" WHERE finished_at IS NOT NULL`;
      expect(Number(migrations[0].n)).toBeGreaterThanOrEqual(1);
    });

    it("horário de aceite em UTC com segundos; restrições do banco recusam valores inválidos", async () => {
      await truncate();
      const ledger = ledgerOf(db);
      const h = await recordConsent(ledger, T0); // T0 tem 789 ms
      const [row] = await db.$queryRaw<
        { acceptedAt: Date; purposes: string[] }[]
      >`
        SELECT "acceptedAt", "purposes"::text[] AS purposes FROM "PalmConsentRecord" WHERE "receiptHash" = ${h}`;
      expect(row.acceptedAt.toISOString()).toBe("2026-11-23T12:00:00.000Z");
      expect(row.purposes).toEqual(["PALM_READING"]);
      await expect(
        db.$executeRaw`UPDATE "PalmConsentRecord" SET "analysesUsed" = -1 WHERE "receiptHash" = ${h}`,
      ).rejects.toThrow();
      await expect(
        db.$executeRaw`UPDATE "PalmConsentRecord" SET "purposes" = '{}' WHERE "receiptHash" = ${h}`,
      ).rejects.toThrow();
      await expect(
        db.$executeRaw`UPDATE "PalmConsentRecord" SET "receiptHash" = ${"x".repeat(64)} WHERE "receiptHash" = ${h}`,
      ).rejects.toThrow();
      await expect(recordConsent(ledger)).resolves.toBeTruthy();
      await expect(
        ledger.record({
          receiptHash: h,
          consentVersion: "03g3.1",
          purposes: ["PALM_READING"],
          adultDeclared: true,
          acceptedAt: T0,
          receiptExpiresAt: T0 + 1,
        }),
      ).rejects.toThrow(); // mesmo recibo duas vezes
    });
  });

  ledgerContract("PostgreSQL", async () => {
    await truncate();
    return ledgerOf(db);
  });

  describe("concorrência real (várias conexões, como várias instâncias)", () => {
    const pools = () => Array.from({ length: 4 }, () => ledgerOf(client()));
    let ledgers: ConsentLedger[] = [];
    beforeAll(() => {
      ledgers = pools();
    });
    const pick = (i: number) => ledgers[i % ledgers.length];
    const used = async (h: string) =>
      (
        await db.$queryRaw<{ analysesUsed: number }[]>`
          SELECT "analysesUsed" FROM "PalmConsentRecord" WHERE "receiptHash" = ${h}`
      )[0].analysesUsed;

    it("12 pedidos diferentes ao mesmo tempo: exatamente 3 autorizados", async () => {
      await truncate();
      const h = await recordConsent(pick(0));
      const all = await Promise.all(
        Array.from({ length: 12 }, (_, i) =>
          pick(i).begin({
            receiptHash: h,
            requestHash: newRequest(),
            now: T0 + 1000,
            maxUses: 3,
          }),
        ),
      );
      expect(all.filter((r) => r.kind === "authorized")).toHaveLength(3);
      expect(all.filter((r) => r.kind === "exhausted")).toHaveLength(9);
      expect(await used(h)).toBe(3);
    });

    it("o mesmo pedido 10 vezes ao mesmo tempo: 1 autorizado, 9 em andamento", async () => {
      await truncate();
      const h = await recordConsent(pick(0));
      const r = newRequest();
      const all = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          pick(i).begin({
            receiptHash: h,
            requestHash: r,
            now: T0 + 1000,
            maxUses: 3,
          }),
        ),
      );
      expect(all.filter((x) => x.kind === "authorized")).toHaveLength(1);
      expect(all.filter((x) => x.kind === "in_progress")).toHaveLength(9);
      expect(await used(h)).toBe(1);
    });

    it("devolução simultânea: uma só", async () => {
      await truncate();
      const h = await recordConsent(pick(0));
      const a = await pick(0).begin({
        receiptHash: h,
        requestHash: newRequest(),
        now: T0 + 1000,
        maxUses: 3,
      });
      if (a.kind !== "authorized") throw new Error(a.kind);
      const all = await Promise.all(
        Array.from({ length: 6 }, (_, i) =>
          pick(i).refund({
            useId: a.useId,
            leaseId: a.leaseId,
            now: T0 + 2000,
          }),
        ),
      );
      expect(all.filter(Boolean)).toHaveLength(1);
      expect(await used(h)).toBe(0);
    });

    it("órfã disputada por limpeza e retomadas ao mesmo tempo: devolvida uma vez", async () => {
      await truncate();
      const h = await recordConsent(pick(0));
      const r = newRequest();
      await pick(0).begin({
        receiptHash: h,
        requestHash: r,
        now: T0 + 1000,
        maxUses: 3,
      });
      const later = T0 + 1000 + LEASE_MS + 1;
      const results = await Promise.all([
        pick(1).purge({ now: later }),
        pick(2).begin({
          receiptHash: h,
          requestHash: r,
          now: later,
          maxUses: 3,
        }),
        pick(3).begin({
          receiptHash: h,
          requestHash: r,
          now: later,
          maxUses: 3,
        }),
        pick(0).purge({ now: later }),
      ]);
      const begins = results.slice(1, 3) as Awaited<
        ReturnType<ConsentLedger["begin"]>
      >[];
      expect(begins.filter((x) => x.kind === "authorized")).toHaveLength(1);
      // Uma tentativa ativa, contada uma vez: nada devolvido em dobro nem negativo.
      expect(await used(h)).toBe(1);
      const states = await db.$queryRaw<{ state: string }[]>`
        SELECT u."state"::text AS state FROM "PalmConsentUse" u
          JOIN "PalmConsentRecord" c ON c."id" = u."consentId" WHERE c."receiptHash" = ${h}`;
      expect(states.map((s) => s.state)).toEqual(["PENDING"]);
    });

    it("revogação no meio de autorizações simultâneas: depois dela, nada mais é autorizado", async () => {
      await truncate();
      const h = await recordConsent(pick(0));
      const ops = await Promise.all([
        ...Array.from({ length: 3 }, (_, i) =>
          pick(i).begin({
            receiptHash: h,
            requestHash: newRequest(),
            now: T0 + 1000,
            maxUses: 3,
          }),
        ),
        pick(3).revoke({ receiptHash: h, now: T0 + 1000 }),
      ]);
      const authorized = ops.filter(
        (
          x,
        ): x is Extract<
          Awaited<ReturnType<ConsentLedger["begin"]>>,
          { kind: "authorized" }
        > =>
          typeof x === "object" &&
          x !== null &&
          "kind" in x &&
          x.kind === "authorized",
      );
      for (const a of authorized)
        expect(
          await pick(0).complete({
            useId: a.useId,
            leaseId: a.leaseId,
            now: T0 + 2000,
            shared: { x: 1 },
          }),
        ).toBe("revoked");
      expect(
        await pick(1).begin({
          receiptHash: h,
          requestHash: newRequest(),
          now: T0 + 3000,
          maxUses: 3,
        }),
      ).toEqual({ kind: "consent_invalid" });
      const shared = await db.$queryRaw<
        { n: bigint }[]
      >`SELECT count(*) AS n FROM "PalmSharedResult"`;
      expect(Number(shared[0].n)).toBe(0);
    });

    it("nenhuma transação fica aberta entre autorizar e concluir", async () => {
      await truncate();
      const h = await recordConsent(pick(0));
      const a = await pick(0).begin({
        receiptHash: h,
        requestHash: newRequest(),
        now: T0 + 1000,
        maxUses: 3,
      });
      expect(a.kind).toBe("authorized");
      const open = await db.$queryRaw<{ n: bigint }[]>`
        SELECT count(*) AS n FROM pg_stat_activity
         WHERE datname = current_database() AND state LIKE 'idle in transaction%'`;
      expect(Number(open[0].n)).toBe(0);
    });
  });

  handlerLedgerSuite("PostgreSQL, duas instâncias", async () => {
    await truncate();
    return { a: ledgerOf(client()), b: ledgerOf(client()) };
  });

  it("banco fora do ar: a autorização falha (o endpoint responde 503)", async () => {
    const down = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: "postgresql://postgres@127.0.0.1:1/nada",
      }),
    });
    clients.push(down);
    await expect(
      ledgerOf(down).begin({
        receiptHash: "0".repeat(64),
        requestHash: newRequest(),
        now: T0,
        maxUses: 3,
      }),
    ).rejects.toThrow();
  });
});
