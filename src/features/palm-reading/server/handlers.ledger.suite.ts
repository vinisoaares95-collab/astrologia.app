/**
 * Endpoints com o registro de consentimento (03G.3, Bloco 2), executados
 * contra o registro em memória (sempre) e o PostgreSQL (com banco de teste).
 * Cada "instância" tem cache, deduplicação e limites próprios e compartilha
 * só o registro, como duas instâncias do servidor.
 * Não é um arquivo de teste: é importado por *.test.ts.
 */
import { describe, expect, it } from "vitest";

import { createMockPalmTextProvider } from "../chapters/mock-text-provider";
import { CONSENT_VERSION } from "../consent";
import { AiProviderError } from "../../interpretation/ai/contract";
import type { VisionProvider } from "../vision/contract";
import { createMockVisionProvider } from "../vision/mock-provider";
import { createClientKeyer } from "./client-key";
import { readPalmAnalysisConfig } from "./config";
import { LEASE_MS, type ConsentLedger } from "./consent-ledger";
import {
  CONSENT_HEADER,
  defaultLimits,
  handleAnalysis,
  handleConsent,
  handleRevoke,
  REQUEST_HEADER,
  type PalmApiDeps,
} from "./handlers";
import { syntheticJpeg } from "./test-jpeg";

const ORIGIN = "http://localhost:3000";
const SECRET = Buffer.alloc(32, 3);
const headers = { origin: ORIGIN, host: "localhost:3000" };

/** Provedor que só responde quando o teste abrir o portão. */
export function gatedProvider(outcome: "ok" | "fail" = "ok") {
  const inner = createMockVisionProvider(["clear"]);
  let open!: () => void;
  const gate = new Promise<void>((r) => (open = r));
  let calls = 0;
  let started!: () => void;
  const firstCall = new Promise<void>((r) => (started = r));
  const provider: VisionProvider = {
    id: "mock",
    model: "mock-vision",
    async analyze(request) {
      calls++;
      started();
      await gate;
      if (outcome === "fail")
        throw new AiProviderError("unavailable", "Falha simulada");
      return inner.analyze(request);
    },
  };
  return { provider, open, firstCall, calls: () => calls };
}

export type Clock = { t: number };

export function instance(
  ledger: ConsentLedger,
  options: {
    clock: Clock;
    shared?: boolean;
    provider?: VisionProvider;
  },
): PalmApiDeps & { visionCalls: () => number } {
  const fallback = createMockVisionProvider(["clear"]);
  const provider = options.provider ?? fallback;
  let calls = 0;
  const counted: VisionProvider = {
    ...provider,
    analyze: (r) => {
      calls++;
      return provider.analyze(r);
    },
  };
  return {
    config: readPalmAnalysisConfig({ SIDERA_PALM_ANALYSIS_ENABLED: "1" }),
    secret: SECRET,
    clientKey: createClientKeyer({
      secret: Buffer.alloc(32, 4),
      source: { kind: "untrusted-dev" },
    }),
    now: () => options.clock.t,
    provider: () => counted,
    textProvider: () => createMockPalmTextProvider(["valid"]),
    limits: defaultLimits(),
    cache: new Map(),
    consentLedger: {
      status: "active",
      ledger,
      sharedResults: options.shared ?? false,
    },
    visionCalls: () => calls,
  };
}

export async function consent(deps: PalmApiDeps) {
  const r = await handleConsent(
    new Request(`${ORIGIN}/api/leitura-das-maos/consentimento`, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({
        version: CONSENT_VERSION,
        adult: true,
        analysis: true,
        hand: "left",
      }),
    }),
    deps,
  );
  return {
    status: r.status,
    body: (await r.json()) as Record<string, unknown>,
  };
}

export function analyze(
  deps: PalmApiDeps,
  token: string,
  key: string,
  photo = syntheticJpeg(1200, 1600),
) {
  return handleAnalysis(
    new Request(`${ORIGIN}/api/leitura-das-maos/analise`, {
      method: "POST",
      headers: {
        ...headers,
        "content-type": "image/jpeg",
        [CONSENT_HEADER]: token,
        [REQUEST_HEADER]: key,
      },
      body: photo as BodyInit,
    }),
    deps,
  ).then(async (r) => ({
    status: r.status,
    retryAfter: r.headers.get("retry-after"),
    body: (await r.json()) as Record<string, unknown>,
  }));
}

export function revoke(deps: PalmApiDeps, token: string) {
  return handleRevoke(
    new Request(`${ORIGIN}/api/leitura-das-maos/consentimento/revogar`, {
      method: "POST",
      headers: { ...headers, [CONSENT_HEADER]: token },
    }),
    deps,
  );
}

let seq = 0;
export const key = () => `chave-de-teste-${String(++seq).padStart(12, "0")}`;

export function handlerLedgerSuite(
  name: string,
  make: () => Promise<{ a: ConsentLedger; b: ConsentLedger }>,
) {
  describe(`endpoints com registro (${name})`, () => {
    const setup = async (opts: { shared?: boolean } = {}) => {
      const { a, b } = await make();
      const clock = { t: Date.UTC(2026, 10, 23, 12, 0, 0) };
      return { a, b, clock, opts };
    };

    it("consentimento grava evidência antes do recibo; análise autorizada chama o provedor uma vez", async () => {
      const { a, clock } = await setup();
      const one = instance(a, { clock });
      const c = await consent(one);
      expect(c).toMatchObject({ status: 200, body: { remaining: 3 } });
      const k = key();
      const r = await analyze(one, c.body.token as string, k);
      expect(r).toMatchObject({ status: 200, body: { remaining: 2 } });
      // Mesmo pedido de novo: o resultado guardado, sem nova chamada nem crédito.
      const again = await analyze(one, c.body.token as string, k);
      expect(again).toMatchObject({ status: 200, body: { remaining: 2 } });
      expect(again.body.result).toEqual(r.body.result);
      expect(one.visionCalls()).toBe(1);
    });

    it("sem chave de idempotência válida: 400, nada consumido", async () => {
      const { a, clock } = await setup();
      const one = instance(a, { clock });
      const c = await consent(one);
      for (const k of [
        "",
        "curta",
        "x".repeat(65),
        "com espaço e acentuação ã",
      ])
        expect((await analyze(one, c.body.token as string, k)).status).toBe(
          400,
        );
      expect(one.visionCalls()).toBe(0);
    });

    it("outra instância não executa o mesmo pedido em andamento (409) e recebe o resultado compartilhado depois", async () => {
      const { a, b, clock } = await setup();
      const gate = gatedProvider();
      const one = instance(a, { clock, shared: true, provider: gate.provider });
      const two = instance(b, { clock, shared: true });
      const c = await consent(one);
      const k = key();
      const first = analyze(one, c.body.token as string, k);
      await gate.firstCall;
      const busy = await analyze(two, c.body.token as string, k);
      expect(busy).toMatchObject({
        status: 409,
        retryAfter: "5",
        body: { error: "analysis_in_progress", remaining: 2 },
      });
      expect(two.visionCalls()).toBe(0);
      gate.open();
      const done = await first;
      expect(done.status).toBe(200);
      const shared = await analyze(two, c.body.token as string, k);
      expect(shared).toMatchObject({ status: 200, body: { remaining: 2 } });
      expect(shared.body.result).toEqual(done.body.result); // exatamente o mesmo
      expect(two.visionCalls()).toBe(0);
    });

    it("sem resultado compartilhado: 410, sem nova análise automática", async () => {
      const { a, b, clock } = await setup();
      const one = instance(a, { clock });
      const two = instance(b, { clock });
      const c = await consent(one);
      const k = key();
      expect((await analyze(one, c.body.token as string, k)).status).toBe(200);
      const other = await analyze(two, c.body.token as string, k);
      expect(other).toMatchObject({
        status: 410,
        body: { error: "result_expired", remaining: 2 },
      });
      expect(two.visionCalls()).toBe(0);
    });

    it("resultado compartilhado vencido (10 min): 410", async () => {
      const { a, b, clock } = await setup();
      const one = instance(a, { clock, shared: true });
      const two = instance(b, { clock, shared: true });
      const c = await consent(one);
      const k = key();
      await analyze(one, c.body.token as string, k);
      clock.t += 10 * 60 * 1000;
      expect((await analyze(two, c.body.token as string, k)).status).toBe(410);
    });

    it("falha técnica devolve a tentativa; o mesmo pedido pode tentar de novo", async () => {
      const { a, clock } = await setup();
      const gate = gatedProvider("fail");
      gate.open();
      const one = instance(a, { clock, provider: gate.provider });
      const c = await consent(one);
      const k = key();
      const r = await analyze(one, c.body.token as string, k);
      expect(r).toMatchObject({
        status: 503,
        body: { error: "temporarily_unavailable", remaining: 3 },
      });
      const ok = instance(a, { clock });
      expect(await analyze(ok, c.body.token as string, k)).toMatchObject({
        status: 200,
        body: { remaining: 2 },
      });
    });

    it("pedidos simultâneos de chaves diferentes não passam do limite", async () => {
      const { a, b, clock } = await setup();
      const one = instance(a, { clock });
      const two = instance(b, { clock });
      const c = await consent(one);
      const t = c.body.token as string;
      const all = await Promise.all(
        Array.from({ length: 8 }, (_, i) =>
          analyze(i % 2 ? two : one, t, key(), syntheticJpeg(1200 + i, 1600)),
        ),
      );
      const ok = all.filter((r) => r.status === 200).length;
      expect(ok).toBe(3);
      expect(all.filter((r) => r.status === 429)).toHaveLength(5);
      expect(one.visionCalls() + two.visionCalls()).toBe(3);
    });

    it("revogação durante o processamento: resultado descartado (401) e nada compartilhado", async () => {
      const { a, b, clock } = await setup();
      const gate = gatedProvider();
      const one = instance(a, { clock, shared: true, provider: gate.provider });
      const two = instance(b, { clock, shared: true });
      const c = await consent(one);
      const t = c.body.token as string;
      const k = key();
      const pending = analyze(one, t, k);
      await gate.firstCall;
      expect((await revoke(two, t)).status).toBe(204);
      expect((await revoke(two, t)).status).toBe(204); // idempotente
      gate.open();
      expect(await pending).toMatchObject({
        status: 401,
        body: { error: "consent_required" },
      });
      expect((await analyze(two, t, k)).status).toBe(401);
      expect((await analyze(two, t, key())).status).toBe(401);
    });

    it("revogação exige recibo assinado; aceita recibo vencido", async () => {
      const { a, clock } = await setup();
      const one = instance(a, { clock });
      const c = await consent(one);
      expect((await revoke(one, "forjado.assinatura")).status).toBe(401);
      clock.t += 31 * 60 * 1000;
      expect((await revoke(one, c.body.token as string)).status).toBe(204);
    });

    it("queda de instância: tentativa órfã é retomada sem cobrar duas vezes", async () => {
      const { a, b, clock } = await setup();
      const gate = gatedProvider(); // nunca abre: a instância "caiu"
      const dead = instance(a, { clock, provider: gate.provider });
      const two = instance(b, { clock });
      const c = await consent(two);
      const t = c.body.token as string;
      const k = key();
      void analyze(dead, t, k);
      await gate.firstCall;
      expect((await analyze(two, t, k)).status).toBe(409);
      clock.t += LEASE_MS + 1;
      const resumed = await analyze(two, t, k);
      expect(resumed).toMatchObject({ status: 200, body: { remaining: 2 } });
      expect(two.visionCalls()).toBe(1);
    });

    it("banco indisponível antes da autorização: 503 sem chamar o provedor", async () => {
      const { a, clock } = await setup();
      const broken: ConsentLedger = {
        ...a,
        begin: async () => {
          throw new Error("conexão recusada");
        },
      };
      const one = instance(a, { clock });
      const c = await consent(one);
      const off = instance(broken, { clock });
      expect(await analyze(off, c.body.token as string, key())).toMatchObject({
        status: 503,
        body: { error: "unavailable" },
      });
      expect(off.visionCalls()).toBe(0);
    });

    it("falha ao gravar o consentimento: sem recibo", async () => {
      const { a, clock } = await setup();
      const broken: ConsentLedger = {
        ...a,
        record: async () => {
          throw new Error("conexão recusada");
        },
      };
      const r = await consent(instance(broken, { clock }));
      expect(r).toEqual({ status: 503, body: { error: "unavailable" } });
    });

    it("banco falha ao concluir: resultado entregue; a tentativa volta como órfã depois", async () => {
      const { a, clock } = await setup();
      const flaky: ConsentLedger = {
        ...a,
        complete: async () => {
          throw new Error("conexão perdida");
        },
      };
      const one = instance(flaky, { clock });
      const c = await consent(one);
      const t = c.body.token as string;
      expect((await analyze(one, t, key())).status).toBe(200);
      clock.t += LEASE_MS + 1;
      expect((await a.purge({ now: clock.t })).orphansRefunded).toBe(1);
      const fine = instance(a, { clock });
      expect(await analyze(fine, t, key())).toMatchObject({
        status: 200,
        body: { remaining: 2 },
      });
    });
  });
}
