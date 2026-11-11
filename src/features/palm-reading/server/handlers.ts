import "server-only";

/**
 * Lógica dos endpoints da leitura das mãos (Fase 03D).
 *
 * - POST /api/leitura-das-maos/consentimento → recibo assinado do aceite.
 * - GET  /api/leitura-das-maos/analise       → disponibilidade (simulada?).
 * - POST /api/leitura-das-maos/analise       → análise visual de UMA foto.
 *
 * Tudo atrás de SIDERA_PALM_ANALYSIS_ENABLED (sem ela, 404). Respostas com
 * códigos genéricos, sem detalhes internos; nenhum `console.*`, nenhum
 * arquivo, nenhum banco. A imagem existe só em memória durante a análise e
 * é zerada no fim. O que fica em memória (limites, deduplicação) são chaves
 * opacas (SHA-256) e o resultado já seguro para o cliente.
 */
import { createHash } from "node:crypto";

import { createBudget } from "../../interpretation/ai/budget";
import { CONSENT_VERSION } from "../consent";
import { inspectJpeg } from "../lib/jpeg";
import {
  MAX_LONG_EDGE_PX,
  MAX_PREPARED_BYTES,
  MAX_VISUAL_TOKENS,
  visualTokens,
} from "../lib/prepare-image";
import { MIN_SHORT_SIDE_PX } from "../lib/image-validation";
import { analyzePalmImage, type PalmAnalysisResult } from "../vision/analyze";
import { createAnthropicVisionProvider } from "../vision/anthropic-provider";
import { withVisionBudget } from "../vision/budget";
import type { VisionProvider } from "../vision/contract";
import { createMockVisionProvider } from "../vision/mock-provider";
import { readPalmAnalysisConfig, type PalmAnalysisConfig } from "./config";
import { issueReceipt, receiptSecret, verifyReceipt } from "./consent-receipt";
import { createLimiter, type Limiter } from "./rate-limit";
import { anthropicApiKey } from "../../interpretation/ai/api-key";

export const CONSENT_HEADER = "x-sidera-consent";
/** Corpo máximo aceito (foto preparada); o resto é recusado sem ler. */
export const MAX_IMAGE_BYTES = MAX_PREPARED_BYTES;
const MAX_CONSENT_BODY_BYTES = 2048;
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 200;

export type PalmApiError =
  | "not_found"
  | "forbidden"
  | "consent_required"
  | "invalid_consent"
  | "invalid_image"
  | "too_large"
  | "rate_limited"
  | "processing_limit"
  | "retake_required"
  | "temporarily_unavailable"
  | "analysis_failed"
  | "unavailable"
  | "internal";

export type PalmApiDeps = {
  config: PalmAnalysisConfig;
  secret: Buffer | null;
  now: () => number;
  provider: () => VisionProvider;
  limits: {
    consentPerClient: Limiter;
    analysisGlobal: Limiter;
    analysisPerClient: Limiter;
    analysisPerReceipt: Limiter;
  };
  cache: Map<string, { expires: number; result: PalmAnalysisResult }>;
};

export function defaultLimits(): PalmApiDeps["limits"] {
  return {
    consentPerClient: createLimiter({ limit: 10, windowMs: 60 * 60 * 1000 }),
    analysisGlobal: createLimiter({ limit: 60, windowMs: 60 * 60 * 1000 }),
    analysisPerClient: createLimiter({ limit: 10, windowMs: 60 * 60 * 1000 }),
    // Por recibo (uma sessão de consentimento): até 3 análises.
    analysisPerReceipt: createLimiter({ limit: 3, windowMs: 60 * 60 * 1000 }),
  };
}

/** Dependências do processo (criadas uma vez; o teto de gasto é por processo). */
let processDeps: PalmApiDeps | null = null;
export function getProcessDeps(): PalmApiDeps {
  if (processDeps) return processDeps;
  const config = readPalmAnalysisConfig();
  const budget = createBudget(config.budgetUsd);
  const mock = createMockVisionProvider([config.mockScenario]);
  const real =
    config.mode === "anthropic"
      ? withVisionBudget(
          createAnthropicVisionProvider({
            model: config.model,
            effort: config.effort,
            apiKey: anthropicApiKey(),
          }),
          budget,
        )
      : null;
  processDeps = {
    config,
    secret: receiptSecret(),
    now: () => Date.now(),
    provider: () => real ?? mock,
    limits: defaultLimits(),
    cache: new Map(),
  };
  return processDeps;
}

// ── Utilidades ─────────────────────────────────────────────────────────────

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
const fail = (status: number, error: PalmApiError) => json(status, { error });

const sha256 = (data: string | Uint8Array) =>
  createHash("sha256").update(data).digest("hex");

/** Só aceita chamadas da própria origem (o endpoint não é uma API pública). */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") === "same-origin";
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return Boolean(host) && new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Chave opaca do cliente (hash do IP informado pelo proxy). */
function clientKey(request: Request): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  return sha256(`client:${ip}`);
}

/** Lê o corpo até `max` bytes; acima disso, desiste sem ler o restante. */
async function readCapped(
  request: Request,
  max: number,
): Promise<Uint8Array | "too_large"> {
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array(0);
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel().catch(() => undefined);
      chunks.forEach((c) => c.fill(0));
      return "too_large";
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
    c.fill(0);
  }
  return out;
}

// ── Consentimento ─────────────────────────────────────────────────────────

export async function handleConsent(
  request: Request,
  deps: PalmApiDeps,
): Promise<Response> {
  try {
    if (!deps.config.enabled) return fail(404, "not_found");
    if (!isSameOrigin(request)) return fail(403, "forbidden");
    if (!deps.secret) return fail(503, "unavailable");
    if (!deps.limits.consentPerClient.take(clientKey(request), deps.now()))
      return fail(429, "rate_limited");
    const body = await readCapped(request, MAX_CONSENT_BODY_BYTES);
    if (body === "too_large") return fail(413, "too_large");
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(new TextDecoder().decode(body));
    } catch {
      return fail(400, "invalid_consent");
    }
    const keys = Object.keys(data ?? {})
      .sort()
      .join(",");
    if (
      keys !== "adult,analysis,hand,version" ||
      data.version !== CONSENT_VERSION ||
      data.adult !== true ||
      data.analysis !== true ||
      (data.hand !== "right" && data.hand !== "left")
    )
      return fail(400, "invalid_consent");
    const { token, receipt } = issueReceipt(
      { hand: data.hand },
      deps.secret,
      deps.now(),
    );
    return json(200, { token, expiresAt: receipt.exp });
  } catch {
    return fail(500, "internal");
  }
}

// ── Análise ───────────────────────────────────────────────────────────────

export function handleAvailability(deps: PalmApiDeps): Response {
  if (!deps.config.enabled) return fail(404, "not_found");
  return json(200, { enabled: true, simulated: deps.config.mode === "mock" });
}

export async function handleAnalysis(
  request: Request,
  deps: PalmApiDeps,
): Promise<Response> {
  let bytes: Uint8Array | null = null;
  try {
    if (!deps.config.enabled) return fail(404, "not_found");
    if (!isSameOrigin(request)) return fail(403, "forbidden");
    if (!deps.secret) return fail(503, "unavailable");

    const check = verifyReceipt(
      request.headers.get(CONSENT_HEADER),
      deps.secret,
      deps.now(),
    );
    if (!check.ok) return fail(401, "consent_required");
    const { receipt } = check;

    if (request.headers.get("content-type") !== "image/jpeg")
      return fail(415, "invalid_image");
    const declared = Number(request.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > MAX_IMAGE_BYTES)
      return fail(413, "too_large");

    const now = deps.now();
    const client = clientKey(request);
    const receiptKey = sha256(`receipt:${receipt.nonce}`);
    if (deps.limits.analysisPerReceipt.remaining(receiptKey, now) === 0)
      return fail(429, "rate_limited");
    if (deps.limits.analysisPerClient.remaining(client, now) === 0)
      return fail(429, "rate_limited");
    if (deps.limits.analysisGlobal.remaining("global", now) === 0)
      return fail(429, "rate_limited");

    const body = await readCapped(request, MAX_IMAGE_BYTES);
    if (body === "too_large") return fail(413, "too_large");
    bytes = body;
    if (bytes.byteLength === 0) return fail(400, "invalid_image");

    // Conteúdo real do arquivo, não o que o navegador declarou.
    const info = inspectJpeg(bytes);
    if (
      !info.ok ||
      info.metadata.length > 0 ||
      Math.min(info.width, info.height) < MIN_SHORT_SIDE_PX ||
      Math.max(info.width, info.height) > MAX_LONG_EDGE_PX ||
      visualTokens(info.width, info.height) > MAX_VISUAL_TOKENS
    )
      return fail(400, "invalid_image");

    // A mesma foto, no mesmo recibo, não gera nova chamada.
    const cacheKey = sha256(
      `${receipt.nonce}:${sha256(bytes)}:${deps.config.mode}`,
    );
    const cached = deps.cache.get(cacheKey);
    if (cached && cached.expires > now) {
      bytes.fill(0);
      return json(200, { result: cached.result });
    }

    // Conta o uso só quando a chamada vai mesmo acontecer.
    if (
      !deps.limits.analysisPerReceipt.take(receiptKey, now) ||
      !deps.limits.analysisPerClient.take(client, now) ||
      !deps.limits.analysisGlobal.take("global", now)
    )
      return fail(429, "rate_limited");

    const outcome = await analyzePalmImage({
      bytes,
      hand: receipt.hand,
      provider: deps.provider(),
      simulated: deps.config.mode === "mock",
    });
    bytes = null;

    switch (outcome.kind) {
      case "ok":
        deps.cache.set(cacheKey, {
          expires: now + CACHE_TTL_MS,
          result: outcome.result,
        });
        if (deps.cache.size > CACHE_MAX)
          deps.cache.delete(deps.cache.keys().next().value!);
        return json(200, { result: outcome.result });
      case "refused":
        return fail(422, "retake_required");
      case "invalid_output":
        return fail(502, "analysis_failed");
      case "provider_error":
        if (outcome.error === "budget") return fail(429, "processing_limit");
        if (
          ["timeout", "unavailable", "network", "rate_limit"].includes(
            outcome.error,
          )
        )
          return fail(503, "temporarily_unavailable");
        return fail(502, "analysis_failed");
    }
    return fail(500, "internal");
  } catch {
    return fail(500, "internal");
  } finally {
    bytes?.fill(0);
  }
}
