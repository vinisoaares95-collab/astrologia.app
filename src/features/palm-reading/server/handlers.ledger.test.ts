// @vitest-environment node
/** Endpoints com o registro em memória (sem banco); ver também *.db.test.ts. */
import { describe, expect, it } from "vitest";

import { readPalmAnalysisConfig } from "./config";
import { createMemoryConsentLedger } from "./consent-ledger-memory";
import { RETENTION_DAYS } from "./consent-ledger.contract";
import { handleAnalysis, handleConsent, handleRevoke } from "./handlers";
import { handlerLedgerSuite, instance } from "./handlers.ledger.suite";

handlerLedgerSuite("memória", async () => {
  const shared = createMemoryConsentLedger({ retentionDays: RETENTION_DAYS });
  return { a: shared, b: shared };
});

describe("registro bloqueado (produção nesta fase)", () => {
  it("consentimento, análise e revogação respondem 503", async () => {
    const deps = {
      ...instance(createMemoryConsentLedger({ retentionDays: 1 }), {
        clock: { t: 0 },
      }),
      consentLedger: { status: "blocked" as const },
      config: readPalmAnalysisConfig({ SIDERA_PALM_ANALYSIS_ENABLED: "1" }),
    };
    const req = (path: string) =>
      new Request(`http://localhost:3000${path}`, {
        method: "POST",
        headers: { origin: "http://localhost:3000", host: "localhost:3000" },
      });
    expect((await handleConsent(req("/c"), deps)).status).toBe(503);
    expect((await handleAnalysis(req("/a"), deps)).status).toBe(503);
    expect((await handleRevoke(req("/r"), deps)).status).toBe(503);
    expect(deps.visionCalls()).toBe(0);
  });
});
