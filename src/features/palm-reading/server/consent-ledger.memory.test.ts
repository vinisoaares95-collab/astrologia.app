// @vitest-environment node
import { describe, expect, it } from "vitest";

import { readConsentLedgerConfig } from "./consent-ledger-config";
import { ledgerContract, RETENTION_DAYS } from "./consent-ledger.contract";
import { createMemoryConsentLedger } from "./consent-ledger-memory";

ledgerContract("memória, só testes", () =>
  createMemoryConsentLedger({ retentionDays: RETENTION_DAYS }),
);

describe("registro em memória", () => {
  it("recusa produção", () => {
    expect(() =>
      createMemoryConsentLedger(
        { retentionDays: 1 },
        { NODE_ENV: "production" },
      ),
    ).toThrow(/produção/);
  });
});

describe("configuração do registro", () => {
  const ok = {
    SIDERA_CONSENT_LEDGER: "postgres",
    DATABASE_URL: "postgresql://x@localhost/db",
    SIDERA_CONSENT_RETENTION_DAYS: "30",
  };

  it("produção: bloqueado nesta fase, mesmo com tudo configurado", () => {
    expect(
      readConsentLedgerConfig({ ...ok, NODE_ENV: "production" }),
    ).toMatchObject({
      mode: "blocked",
    });
    expect(readConsentLedgerConfig({ NODE_ENV: "production" })).toMatchObject({
      mode: "blocked",
    });
  });

  it("fora de produção: sem a variável, modo anterior", () => {
    expect(readConsentLedgerConfig({})).toEqual({ mode: "off" });
  });

  it("retenção sem padrão: ausente ou inválida bloqueia", () => {
    for (const days of [undefined, "", "0", "-1", "6m", "180.5", "3651"])
      expect(
        readConsentLedgerConfig({ ...ok, SIDERA_CONSENT_RETENTION_DAYS: days }),
      ).toMatchObject({ mode: "blocked" });
  });

  it("sem DATABASE_URL ou com valor desconhecido: bloqueia", () => {
    expect(readConsentLedgerConfig({ ...ok, DATABASE_URL: "" })).toMatchObject({
      mode: "blocked",
    });
    expect(
      readConsentLedgerConfig({ ...ok, SIDERA_CONSENT_LEDGER: "memory" }),
    ).toMatchObject({ mode: "blocked" });
  });

  it("completo: ativo; resultado compartilhado só se pedido", () => {
    expect(readConsentLedgerConfig(ok)).toEqual({
      mode: "postgres",
      databaseUrl: ok.DATABASE_URL,
      retentionDays: 30,
      sharedResults: false,
    });
    expect(
      readConsentLedgerConfig({ ...ok, SIDERA_SHARED_RESULTS: "1" }),
    ).toMatchObject({ sharedResults: true });
  });
});
