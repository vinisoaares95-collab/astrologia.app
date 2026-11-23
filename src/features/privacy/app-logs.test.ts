// @vitest-environment node
/**
 * Logs controlados pelo código da aplicação (Fase 03G.3).
 *
 * Alcance: só o que o código do Sidera escreve (`console.*`). Os registros
 * da hospedagem (acesso, proxy, plataforma) NÃO são cobertos aqui: a
 * hospedagem não foi definida e precisa ser verificada à parte
 * (docs/privacidade/06-verificacoes-03g2.md, seção 5, H3/H4).
 *
 * Duas camadas:
 * 1. Estática: todo `console.*` fora de testes está numa lista revisada; um
 *    novo exige revisão (e atualizar a lista).
 * 2. Execução: os caminhos que podem registrar, alimentados com valores
 *    marcadores (foto, corpo, recibo, dados de nascimento, segredos), não
 *    deixam nenhum marcador sair no console.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ROOT = join(__dirname, "..", "..");

/** `console.*` revisados: arquivo → quantas chamadas e o que registram. */
const REVIEWED_CONSOLE_CALLS: Record<string, { count: number; logs: string }> =
  {
    "features/natal-chart/actions.ts": {
      count: 1,
      logs: "só o nome do tipo do erro inesperado do cálculo",
    },
    "features/birth-data/server-normalize.ts": {
      count: 1,
      logs: "só as versões da base de fusos (em uso e esperada)",
    },
  };

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory())
      return name === "generated" ? [] : sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name)
      ? [path]
      : [];
  });
}

const CONSOLE_CALL =
  /\bconsole\.(log|info|warn|error|debug|trace|dir|table)\s*\(/g;

describe("logs da aplicação: inventário estático", () => {
  const files = sourceFiles(ROOT).map((f) => ({
    rel: relative(ROOT, f).replaceAll("\\", "/"),
    text: readFileSync(f, "utf8"),
  }));

  it("só os console.* revisados existem fora dos testes", () => {
    const found: Record<string, number> = {};
    for (const { rel, text } of files) {
      const n = [...text.matchAll(CONSOLE_CALL)].length;
      if (n) found[rel] = n;
    }
    expect(found).toEqual(
      Object.fromEntries(
        Object.entries(REVIEWED_CONSOLE_CALLS).map(([k, v]) => [k, v.count]),
      ),
    );
  });

  it("a leitura das mãos (servidor, visão, capítulos) não tem nenhum console.*", () => {
    const palm = files.filter((f) =>
      f.rel.startsWith("features/palm-reading/"),
    );
    expect(palm.length).toBeGreaterThan(10);
    for (const { rel, text } of palm)
      expect([rel, [...text.matchAll(CONSOLE_CALL)].length]).toEqual([rel, 0]);
  });

  it("o cliente do banco não registra consultas nem parâmetros (Prisma sem `log`)", () => {
    const db = files.find((f) => f.rel === "lib/db.ts");
    expect(db?.text).toMatch(/new PrismaClient\(/);
    expect(db?.text).not.toMatch(/\blog\s*:/);
    for (const { rel, text } of files.filter((f) =>
      /consent-ledger/.test(f.rel),
    ))
      expect([rel, /\$on\(|\blog\s*:/.test(text)]).toEqual([rel, false]);
  });

  it("nenhum console.* recebe ambiente, pedido, corpo, recibo ou entrada", () => {
    const risky =
      /\bconsole\.\w+\s*\([^;]*\b(process\.env|request|req|body|bytes|photo|image|token|receipt|secret|apiKey|raw|input|birth|place)\b/;
    for (const { rel, text } of files)
      expect([rel, risky.test(text)]).toEqual([rel, false]);
  });
});

// ── Execução, com marcadores ────────────────────────────────────────────

const MARK = {
  secret: "SEGREDO-MARCADOR-0123456789abcdef0123456789",
  apiKey: "MARCADOR-CHAVE-API-nao-real",
  date: "13/07/1987",
  time: "04:56",
  placeId: "ibge:2611606", // Recife
  placeName: "Recife",
};

let logged: string[] = [];
beforeEach(() => {
  logged = [];
  for (const m of ["log", "info", "warn", "error", "debug", "trace"] as const)
    vi.spyOn(console, m).mockImplementation((...args: unknown[]) => {
      logged.push(
        args
          .map((a) =>
            a instanceof Error
              ? `${a.name} ${a.message} ${a.stack ?? ""}`
              : typeof a === "string"
                ? a
                : JSON.stringify(a),
          )
          .join(" "),
      );
    });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  vi.doUnmock("../birth-time/tzdb");
  vi.doUnmock("../natal-chart/build-chart");
  vi.unstubAllEnvs();
});

const leaks = (values: string[]) =>
  logged.filter((line) => values.some((v) => line.includes(v)));

describe("logs da aplicação: execução", () => {
  it("leitura das mãos: consentimento, análise e falha do provedor não registram nada", async () => {
    vi.stubEnv("SIDERA_CONSENT_SECRET", MARK.secret);
    vi.stubEnv("SIDERA_CLIENT_KEY_SECRET", MARK.secret);
    vi.stubEnv("SIDERA_ANTHROPIC_API_KEY", MARK.apiKey);
    const { handleConsent, handleAnalysis, defaultLimits, CONSENT_HEADER } =
      await import("../palm-reading/server/handlers");
    const { readPalmAnalysisConfig } =
      await import("../palm-reading/server/config");
    const { createClientKeyer } =
      await import("../palm-reading/server/client-key");
    const { createMockVisionProvider } =
      await import("../palm-reading/vision/mock-provider");
    const { createMockPalmTextProvider } =
      await import("../palm-reading/chapters/mock-text-provider");
    const { syntheticJpeg } = await import("../palm-reading/server/test-jpeg");
    const { CONSENT_VERSION } = await import("../palm-reading/consent");
    const { AiProviderError } = await import("../interpretation/ai/contract");

    const failing = {
      id: "falha",
      model: "x",
      analyze: async () => {
        throw new AiProviderError("timeout", `falhou ${MARK.apiKey}`);
      },
    };
    const make = (provider: unknown) => ({
      config: readPalmAnalysisConfig({ SIDERA_PALM_ANALYSIS_ENABLED: "1" }),
      secret: Buffer.from(MARK.secret),
      clientKey: createClientKeyer({
        secret: Buffer.from(MARK.secret),
        source: { kind: "untrusted-dev" },
      }),
      now: () => Date.now(),
      provider: () => provider as never,
      textProvider: () => createMockPalmTextProvider(["valid"]),
      limits: defaultLimits(),
      cache: new Map(),
    });
    const headers = {
      origin: "http://localhost:3000",
      host: "localhost:3000",
      "x-forwarded-for": "203.0.113.77",
    };
    const photo = syntheticJpeg(1200, 1600);
    const photoB64 = Buffer.from(photo).toString("base64").slice(100, 160);

    for (const provider of [createMockVisionProvider(["clear"]), failing]) {
      const d = make(provider);
      const consent = await handleConsent(
        new Request(
          "http://localhost:3000/api/leitura-das-maos/consentimento",
          {
            method: "POST",
            headers: { ...headers, "content-type": "application/json" },
            body: JSON.stringify({
              version: CONSENT_VERSION,
              adult: true,
              analysis: true,
              hand: "left",
            }),
          },
        ),
        d,
      );
      const { token } = (await consent.json()) as { token: string };
      expect(token).toBeTruthy();
      const res = await handleAnalysis(
        new Request("http://localhost:3000/api/leitura-das-maos/analise", {
          method: "POST",
          headers: {
            ...headers,
            "content-type": "image/jpeg",
            [CONSENT_HEADER]: token,
          },
          body: photo as BodyInit,
        }),
        d,
      );
      expect([200, 503]).toContain(res.status);
      // Pedido malformado também não registra nada.
      await handleAnalysis(
        new Request("http://localhost:3000/api/leitura-das-maos/analise", {
          method: "POST",
          headers: {
            ...headers,
            "content-type": "image/jpeg",
            [CONSENT_HEADER]: token,
          },
          body: new TextEncoder().encode("não é jpeg"),
        }),
        d,
      );
      expect(
        leaks([token, photoB64, MARK.secret, MARK.apiKey, "203.0.113.77"]),
      ).toEqual([]);
    }
    expect(logged).toEqual([]);
  });

  it("dados de nascimento: falha da base de fusos registra só versões", async () => {
    vi.doMock("../birth-time/tzdb", () => ({
      TZDB_EXPECTED_VERSION: "2026f",
      isExpectedTzdb: () => false,
      runtimeTzdbVersion: () => "2025b",
    }));
    const { normalizeBirthAction } = await import("../birth-data/actions");
    await normalizeBirthAction({
      date: MARK.date,
      time: { precision: "exact", value: MARK.time },
      placeId: MARK.placeId,
    });
    expect(logged.length).toBe(1);
    expect(
      leaks([MARK.date, MARK.time, MARK.placeId, MARK.placeName, "1987"]),
    ).toEqual([]);
  });

  it("mapa natal: erro inesperado registra só o tipo, nunca a mensagem", async () => {
    vi.stubEnv("SIDERA_INTERNAL_ENGINE", "1");
    vi.doMock("../natal-chart/build-chart", () => ({
      buildChartView: () => {
        throw new TypeError(`quebrou com ${MARK.date} ${MARK.time} Recife`);
      },
    }));
    const { computeChartAction } = await import("../natal-chart/actions");
    const r = await computeChartAction({
      date: MARK.date,
      time: { precision: "exact", value: MARK.time },
      placeId: MARK.placeId,
    });
    expect(r.status).toBe("engine-error");
    expect(logged).toEqual([expect.stringContaining("TypeError")]);
    expect(leaks([MARK.date, MARK.time, MARK.placeName])).toEqual([]);
  });

  it("dados de nascimento válidos: nada registrado", async () => {
    const { normalizeBirthAction } = await import("../birth-data/actions");
    const r = await normalizeBirthAction({
      date: MARK.date,
      time: { precision: "exact", value: MARK.time },
      placeId: MARK.placeId,
    });
    expect(r).toMatchObject({ status: "ok" });
    expect(logged).toEqual([]);
  });

  it("registro de consentimento: aceite, análise, pedido repetido, revogação e falhas do banco não registram nada", async () => {
    const { createMemoryConsentLedger } =
      await import("../palm-reading/server/consent-ledger-memory");
    const suite = await import("../palm-reading/server/handlers.ledger.suite");
    const ledger = createMemoryConsentLedger({ retentionDays: 30 });
    const clock = { t: Date.UTC(2026, 10, 23, 12) };
    const one = suite.instance(ledger, { clock, shared: true });
    const broken = suite.instance(
      {
        ...ledger,
        begin: async () => {
          throw new Error(`falha ${MARK.secret}`);
        },
      },
      { clock },
    );
    const c = await suite.consent(one);
    const token = c.body.token as string;
    const k = suite.key();
    await suite.analyze(one, token, k);
    await suite.analyze(one, token, k);
    await suite.analyze(broken, token, suite.key());
    await suite.revoke(one, token);
    await suite.analyze(one, token, suite.key());
    expect(leaks([token, k, MARK.secret])).toEqual([]);
    expect(logged).toEqual([]);
  });
});
