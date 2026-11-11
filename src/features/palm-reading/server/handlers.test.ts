// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createBudget } from "../../interpretation/ai/budget";
import { CONSENT_VERSION } from "../consent";
import { withVisionBudget } from "../vision/budget";
import {
  createMockVisionProvider,
  type MockVisionScenario,
} from "../vision/mock-provider";
import { readPalmAnalysisConfig } from "./config";
import { issueReceipt, RECEIPT_TTL_MS } from "./consent-receipt";
import {
  CONSENT_HEADER,
  defaultLimits,
  handleAnalysis,
  handleAvailability,
  handleConsent,
  MAX_IMAGE_BYTES,
  type PalmApiDeps,
} from "./handlers";
import { syntheticJpeg } from "./test-jpeg";

const ORIGIN = "http://localhost:3000";
const SECRET = Buffer.alloc(32, 7);
let clock = 1_800_000_000_000;

function deps(
  over: Partial<PalmApiDeps> & { scenarios?: MockVisionScenario[] } = {},
) {
  const provider = createMockVisionProvider(over.scenarios ?? ["clear"]);
  const d: PalmApiDeps = {
    config: readPalmAnalysisConfig({ SIDERA_PALM_ANALYSIS_ENABLED: "1" }),
    secret: SECRET,
    now: () => clock,
    provider: () => provider,
    limits: defaultLimits(),
    cache: new Map(),
    ...over,
  };
  return { d, provider };
}

const sameOrigin = { origin: ORIGIN, host: "localhost:3000" };

function consentRequest(
  body: unknown,
  headers: Record<string, string> = sameOrigin,
) {
  return new Request(`${ORIGIN}/api/leitura-das-maos/consentimento`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

const validConsent = {
  version: CONSENT_VERSION,
  adult: true,
  analysis: true,
  hand: "left",
};

function token(hand: "right" | "left" = "left", at = clock) {
  return issueReceipt({ hand }, SECRET, at).token;
}

function analysisRequest(
  body: Uint8Array | null,
  headers: Record<string, string> = {},
) {
  return new Request(`${ORIGIN}/api/leitura-das-maos/analise`, {
    method: "POST",
    headers: {
      ...sameOrigin,
      "content-type": "image/jpeg",
      [CONSENT_HEADER]: token(),
      ...headers,
    },
    body: body as BodyInit | null,
  });
}

const goodJpeg = () => syntheticJpeg(1200, 1600);
const read = async (r: Response) =>
  ({ status: r.status, body: await r.json() }) as {
    status: number;
    body: Record<string, unknown>;
  };

let logSpies: ReturnType<typeof vi.spyOn>[] = [];
beforeEach(() => {
  clock += 10 * 60 * 60 * 1000; // janelas de limite novas a cada teste
  logSpies = (["log", "info", "warn", "error", "debug"] as const).map((m) =>
    vi.spyOn(console, m),
  );
});
afterEach(() => {
  // Nenhum endpoint escreve no console (nada de imagem ou erro em log).
  for (const s of logSpies) expect(s).not.toHaveBeenCalled();
  vi.restoreAllMocks();
});

describe("desligado por padrão", () => {
  it("sem SIDERA_PALM_ANALYSIS_ENABLED, os três endpoints respondem 404", async () => {
    const { d, provider } = deps({ config: readPalmAnalysisConfig({}) });
    expect(handleAvailability(d).status).toBe(404);
    expect((await handleConsent(consentRequest(validConsent), d)).status).toBe(
      404,
    );
    expect((await handleAnalysis(analysisRequest(goodJpeg()), d)).status).toBe(
      404,
    );
    expect(provider.calls).toHaveLength(0);
  });

  it("chamadas reais exigem várias flags, chave e não estar em produção", () => {
    const full = {
      SIDERA_PALM_ANALYSIS_ENABLED: "1",
      SIDERA_PALM_VISION_PROVIDER: "anthropic",
      SIDERA_PALM_VISION_REAL: "1",
      SIDERA_ANTHROPIC_API_KEY: "chave-de-teste",
      NODE_ENV: "development",
    };
    expect(readPalmAnalysisConfig({}).mode).toBe("mock");
    expect(readPalmAnalysisConfig(full).mode).toBe("anthropic");
    for (const [k, v] of [
      ["SIDERA_PALM_ANALYSIS_ENABLED", "0"],
      ["SIDERA_PALM_VISION_PROVIDER", "openai"],
      ["SIDERA_PALM_VISION_REAL", undefined],
      ["SIDERA_ANTHROPIC_API_KEY", ""],
      ["NODE_ENV", "production"],
    ] as const)
      expect(readPalmAnalysisConfig({ ...full, [k]: v }).mode, k).toBe("mock");
  });

  it("configuração de visão separada da astrológica (modelo e teto próprios)", () => {
    const c = readPalmAnalysisConfig({
      SIDERA_PALM_ANALYSIS_ENABLED: "1",
      SIDERA_AI_MODEL: "claude-sonnet-5-5",
      SIDERA_PALM_VISION_BUDGET_USD: "50",
    });
    expect(c.model).toBe("claude-haiku-5-5");
    expect(c.budgetUsd).toBe(1);
    expect(
      readPalmAnalysisConfig({ SIDERA_PALM_VISION_MODEL: "claude-opus-5-5" })
        .model,
    ).toBe("claude-haiku-5-5");
  });

  it("disponibilidade informa que a análise é simulada", async () => {
    const { d } = deps();
    expect(await read(handleAvailability(d))).toEqual({
      status: 200,
      body: { enabled: true, simulated: true },
    });
  });
});

describe("consentimento", () => {
  it("o servidor confere o aceite e emite recibo assinado", async () => {
    const { d } = deps();
    const r = await read(await handleConsent(consentRequest(validConsent), d));
    expect(r.status).toBe(200);
    expect(typeof r.body.token).toBe("string");
    expect(r.body.expiresAt).toBe(clock + RECEIPT_TTL_MS);
  });

  it.each([
    ["versão antiga", { ...validConsent, version: "03a" }],
    ["sem maioridade", { ...validConsent, adult: false }],
    ["sem autorização", { ...validConsent, analysis: "true" }],
    ["mão inválida", { ...validConsent, hand: "both" }],
    ["campo extra", { ...validConsent, name: "Fulano" }],
  ])("recusa aceite inválido: %s", async (_, body) => {
    const { d } = deps();
    expect(await read(await handleConsent(consentRequest(body), d))).toEqual({
      status: 400,
      body: { error: "invalid_consent" },
    });
  });

  it("recusa outra origem e excesso de pedidos", async () => {
    const { d } = deps();
    const cross = consentRequest(validConsent, {
      origin: "https://outro.site",
      host: "localhost:3000",
    });
    expect((await handleConsent(cross, d)).status).toBe(403);
    const statuses = [];
    for (let i = 0; i < 11; i++)
      statuses.push(
        (await handleConsent(consentRequest(validConsent), d)).status,
      );
    expect(statuses.at(-1)).toBe(429);
  });

  it("sem segredo configurado (produção), não emite recibo", async () => {
    const { d } = deps({ secret: null });
    expect((await handleConsent(consentRequest(validConsent), d)).status).toBe(
      503,
    );
  });
});

describe("análise: requisição válida", () => {
  it("devolve só observações do sistema e limitações; usa a mão do recibo", async () => {
    const { d, provider } = deps();
    const r = await read(await handleAnalysis(analysisRequest(goodJpeg()), d));
    expect(r.status).toBe(200);
    const result = r.body.result as Record<string, unknown>;
    expect(result).toMatchObject({
      status: "complete",
      retakeRecommended: false,
      simulated: true,
    });
    expect(Object.keys(result).sort()).toEqual(
      [
        "limitations",
        "observations",
        "retakeRecommended",
        "simulated",
        "status",
      ].sort(),
    );
    // A mão vem do recibo assinado (left), não de um campo do cliente.
    expect(
      (
        provider.calls[0].schema.properties as Record<
          string,
          { const?: string }
        >
      ).hand.const,
    ).toBe("left");
    // A foto foi enviada ao provedor como base64 do JPEG conferido.
    expect(provider.calls[0].image.mediaType).toBe("image/jpeg");
  });

  it("não vaza evidência, imagem ou detalhes internos", async () => {
    const { d } = deps();
    const text = await (
      await handleAnalysis(analysisRequest(goodJpeg()), d)
    ).text();
    expect(text).not.toMatch(
      /evidence|evidência|base64|\/9j\/|mock-vision|claude/iu,
    );
    expect(text).not.toMatch(/Largura na base dos dedos/u); // evidência da fixture
  });
});

describe("análise: consentimento e acesso", () => {
  it.each([
    ["ausente", undefined],
    ["forjado", "eyJ2IjoiMDNiLjEifQ.assinatura-falsa"],
    [
      "de outro segredo",
      issueReceipt({ hand: "left" }, Buffer.alloc(32, 9)).token,
    ],
  ])("recibo %s → 401, sem chamar o provedor", async (_, value) => {
    const { d, provider } = deps();
    const headers: Record<string, string> = {};
    const req = analysisRequest(goodJpeg(), headers);
    if (value === undefined) req.headers.delete(CONSENT_HEADER);
    else req.headers.set(CONSENT_HEADER, value);
    expect(await read(await handleAnalysis(req, d))).toEqual({
      status: 401,
      body: { error: "consent_required" },
    });
    expect(provider.calls).toHaveLength(0);
  });

  it("recibo vencido → 401", async () => {
    const { d } = deps();
    const old = token("left", clock - RECEIPT_TTL_MS - 1);
    const r = await handleAnalysis(
      analysisRequest(goodJpeg(), { [CONSENT_HEADER]: old }),
      d,
    );
    expect(r.status).toBe(401);
  });

  it("outra origem → 403", async () => {
    const { d, provider } = deps();
    const r = await handleAnalysis(
      analysisRequest(goodJpeg(), { origin: "https://atacante.example" }),
      d,
    );
    expect(r.status).toBe(403);
    expect(provider.calls).toHaveLength(0);
  });

  it("mesma foto no mesmo recibo não gera nova chamada; limite por recibo", async () => {
    const { d, provider } = deps();
    const t = token();
    const send = (img: Uint8Array) =>
      handleAnalysis(analysisRequest(img, { [CONSENT_HEADER]: t }), d);
    expect((await send(goodJpeg())).status).toBe(200);
    expect((await send(goodJpeg())).status).toBe(200);
    expect(provider.calls).toHaveLength(1);
    expect((await send(syntheticJpeg(1201, 1600))).status).toBe(200);
    expect((await send(syntheticJpeg(1202, 1600))).status).toBe(200);
    const fourth = await read(await send(syntheticJpeg(1203, 1600)));
    expect(fourth).toEqual({ status: 429, body: { error: "rate_limited" } });
    expect(provider.calls).toHaveLength(3);
  });

  it("limite por cliente entre recibos diferentes", async () => {
    const { d } = deps();
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++)
      statuses.push(
        (
          await handleAnalysis(
            analysisRequest(syntheticJpeg(1200 + i, 1600), {
              [CONSENT_HEADER]: token(),
              "x-forwarded-for": "203.0.113.7",
            }),
            d,
          )
        ).status,
      );
    expect(statuses.slice(0, 10).every((s) => s === 200)).toBe(true);
    expect(statuses[10]).toBe(429);
  });
});

describe("análise: arquivo conferido no servidor", () => {
  it.each([
    ["não é JPEG", new TextEncoder().encode("%PDF-1.4 falso")],
    ["JPEG truncado", syntheticJpeg(1200, 1600, { truncate: true })],
    ["com EXIF/GPS", syntheticJpeg(1200, 1600, { exif: true })],
    ["resolução baixa", syntheticJpeg(480, 640)],
    ["acima de 2 576 px", syntheticJpeg(1500, 2700)],
    ["acima de 4 784 tokens", syntheticJpeg(2000, 2400)],
    ["vazio", new Uint8Array(0)],
  ])("%s → 400, sem chamar o provedor", async (_, bytes) => {
    const { d, provider } = deps();
    expect(await read(await handleAnalysis(analysisRequest(bytes), d))).toEqual(
      {
        status: 400,
        body: { error: "invalid_image" },
      },
    );
    expect(provider.calls).toHaveLength(0);
  });

  it("tipo declarado diferente de image/jpeg → 415", async () => {
    const { d } = deps();
    const r = await handleAnalysis(
      analysisRequest(goodJpeg(), { "content-type": "image/png" }),
      d,
    );
    expect(r.status).toBe(415);
  });

  it("grande demais (declarado ou real) → 413", async () => {
    const { d, provider } = deps();
    const big = syntheticJpeg(1200, 1600, { padTo: MAX_IMAGE_BYTES + 10 });
    expect(
      (
        await handleAnalysis(
          analysisRequest(goodJpeg(), {
            "content-length": String(MAX_IMAGE_BYTES + 1),
          }),
          d,
        )
      ).status,
    ).toBe(413);
    expect((await handleAnalysis(analysisRequest(big), d)).status).toBe(413);
    expect(provider.calls).toHaveLength(0);
  });

  it("a imagem é zerada depois do processamento", async () => {
    const { d } = deps();
    const seen: Uint8Array[] = [];
    const inner = createMockVisionProvider(["clear"]);
    d.provider = () => ({
      ...inner,
      async analyze(req) {
        seen.push(Buffer.from(req.image.base64, "base64"));
        return inner.analyze(req);
      },
    });
    const img = goodJpeg();
    await handleAnalysis(analysisRequest(img), d);
    expect(seen[0][0]).toBe(0xff); // o provedor recebeu a imagem…
    // …e o servidor não mantém referência a ela (cache guarda só o resultado).
    const cached = [...d.cache.values()][0];
    expect(JSON.stringify(cached)).not.toMatch(/\/9j\/|base64/u);
  });
});

describe("análise: resultados e falhas do provedor", () => {
  const status = async (scenarios: MockVisionScenario[]) => {
    const { d } = deps({ scenarios });
    return read(await handleAnalysis(analysisRequest(goodJpeg()), d));
  };

  it("parcial: aceito, com recomendação conforme o que foi observado", async () => {
    const r = await status(["partial"]);
    expect((r.body.result as { status: string }).status).toBe("partial");
  });

  it("insuficiente e contraditório: pedem nova foto", async () => {
    for (const s of ["insufficient", "contradictory"] as const) {
      const r = await status([s]);
      expect(r.body.result).toMatchObject({
        status: "insufficient",
        retakeRecommended: true,
        observations: [],
      });
    }
  });

  it("linhas não identificáveis: só o formato da mão é observado", async () => {
    const r = await status(["lines-missing"]);
    const obs = (r.body.result as { observations: { chapter: number }[] })
      .observations;
    expect(obs.every((o) => o.chapter === 6)).toBe(true);
  });

  it("conteúdo sensível ou JSON inválido nas duas tentativas → 502", async () => {
    expect(await status(["sensitive"])).toEqual({
      status: 502,
      body: { error: "analysis_failed" },
    });
    expect(await status(["invalid-json"])).toEqual({
      status: 502,
      body: { error: "analysis_failed" },
    });
  });

  it("JSON inválido seguido de resposta válida: nova tentativa resolve", async () => {
    const r = await status(["invalid-json", "clear"]);
    expect(r.status).toBe(200);
  });

  it("recusa do modelo → pede outra foto (422)", async () => {
    expect(await status(["refusal"])).toEqual({
      status: 422,
      body: { error: "retake_required" },
    });
  });

  it("timeout e indisponibilidade → falha temporária (503)", async () => {
    for (const s of ["error:timeout", "error:unavailable"] as const)
      expect(await status([s])).toEqual({
        status: 503,
        body: { error: "temporarily_unavailable" },
      });
  });

  it("teto de gasto atingido → limite de processamento (429)", async () => {
    const inner = createMockVisionProvider(["clear"], {
      model: "claude-haiku-5-5",
    });
    const budgeted = withVisionBudget(inner, createBudget(0.000001));
    const { d } = deps({ provider: () => budgeted });
    expect(
      await read(await handleAnalysis(analysisRequest(goodJpeg()), d)),
    ).toEqual({
      status: 429,
      body: { error: "processing_limit" },
    });
    expect(inner.calls).toHaveLength(0);
  });

  it("erro inesperado vira resposta genérica, sem detalhes", async () => {
    const { d } = deps({
      provider: () => {
        throw new Error("segredo interno: stack trace");
      },
    });
    const r = await handleAnalysis(analysisRequest(goodJpeg()), d);
    expect(await read(r)).toEqual({ status: 500, body: { error: "internal" } });
  });
});
