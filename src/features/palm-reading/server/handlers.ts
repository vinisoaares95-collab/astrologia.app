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

import { createAnthropicProvider } from "../../interpretation/ai/anthropic-provider";
import { createBudget, withBudget } from "../../interpretation/ai/budget";
import type { AiProvider } from "../../interpretation/ai/contract";
import { composePalmReading } from "../chapters/compose";
import { createMockPalmTextProvider } from "../chapters/mock-text-provider";
import type { PalmAnalysisResult } from "../chapters/presentation";
import { CONSENT_VERSION } from "../consent";
import { inspectJpeg } from "../lib/jpeg";
import {
  MAX_LONG_EDGE_PX,
  MAX_PREPARED_BYTES,
  MAX_VISUAL_TOKENS,
  visualTokens,
} from "../lib/prepare-image";
import { MIN_SHORT_SIDE_PX } from "../lib/image-validation";
import { analyzePalmImage } from "../vision/analyze";
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
/**
 * Prazo total de uma análise no servidor (visão + capítulos), abaixo dos
 * 70 s em que o aparelho desiste (03F.2, Etapa B): a resposta chega antes
 * de o aparelho abandonar a espera. Se o prazo acaba durante a redação, o
 * capítulo usa a biblioteca; durante a visão, a análise falha sem consumir
 * a tentativa da pessoa.
 */
export const ANALYSIS_DEADLINE_MS = 55_000;

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
  /** Redação dos capítulos 6 e 7 (Fase 03E). */
  textProvider: () => AiProvider;
  limits: {
    consentPerClient: Limiter;
    analysisGlobal: Limiter;
    analysisPerClient: Limiter;
    analysisPerReceipt: Limiter;
  };
  cache: Map<string, { expires: number; result: PalmAnalysisResult }>;
  /**
   * Só avaliação (03F.2, Etapa B): recebe a trilha de auditoria (origem do
   * texto, motivo da reserva, tentativas) de cada leitura. Nunca definido
   * pelo processo do produto; nunca vai ao cliente.
   */
  onAudit?: (audit: PalmReadingAudit) => void;
  /**
   * Análises em andamento (mesma foto, mesmo recibo): um pedido repetido —
   * por exemplo, depois de o aparelho desistir da espera — aguarda o mesmo
   * resultado, sem nova chamada nem novo crédito.
   */
  inflight?: Map<string, Promise<Outcome>>;
};

type Outcome = { status: number; body: Record<string, unknown> };

export type PalmReadingAudit = Awaited<
  ReturnType<typeof composePalmReading>
>["audit"];

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
  // Texto real só quando a visão real está autorizada; modelo de TEXTO do
  // Sidera (não o de visão) e o MESMO teto do processo. Sem isso: simulado.
  const mockText = createMockPalmTextProvider(["valid"]);
  const realText =
    config.mode === "anthropic"
      ? withBudget(
          createAnthropicProvider({
            model: config.textModel,
            effort: config.textEffort,
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
    textProvider: () => realText ?? mockText,
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
    return json(200, {
      token,
      expiresAt: receipt.exp,
      remaining: remainingFor(
        deps,
        sha256(`receipt:${receipt.nonce}`),
        clientKey(request),
      ),
    });
  } catch {
    return fail(500, "internal");
  }
}

// ── Análise ───────────────────────────────────────────────────────────────

/** Análises que a pessoa ainda pode fazer com este recibo (e deste cliente). */
function remainingFor(deps: PalmApiDeps, receiptKey: string, client: string) {
  const now = deps.now();
  return Math.min(
    deps.limits.analysisPerReceipt.remaining(receiptKey, now),
    deps.limits.analysisPerClient.remaining(client, now),
  );
}

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
    const remaining = () => remainingFor(deps, receiptKey, client);
    const limited = () =>
      json(429, { error: "rate_limited", remaining: remaining() });
    if (deps.limits.analysisPerReceipt.remaining(receiptKey, now) === 0)
      return limited();
    if (deps.limits.analysisPerClient.remaining(client, now) === 0)
      return limited();
    if (deps.limits.analysisGlobal.remaining("global", now) === 0)
      return limited();

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
      return json(200, { result: cached.result, remaining: remaining() });
    }
    // Já em andamento: espera o mesmo resultado (sem nova chamada nem
    // crédito). Ex.: o aparelho desistiu da espera e a pessoa tentou de novo.
    const inflight = (deps.inflight ??= new Map());
    const running = inflight.get(cacheKey);
    if (running) {
      bytes.fill(0);
      bytes = null;
      const r = await running;
      return json(r.status, { ...r.body, remaining: remaining() });
    }

    // Conta o uso só quando a chamada vai mesmo acontecer.
    if (
      !deps.limits.analysisPerReceipt.take(receiptKey, now) ||
      !deps.limits.analysisPerClient.take(client, now)
    )
      return limited();
    if (!deps.limits.analysisGlobal.take("global", now)) {
      deps.limits.analysisPerReceipt.refund(receiptKey);
      deps.limits.analysisPerClient.refund(client);
      return limited();
    }

    const photo = bytes;
    bytes = null;
    const job = runAnalysis(photo, receipt.hand, cacheKey, deps).then((r) => {
      // Falha técnica (provedor, formato, teto, prazo): a pessoa não
      // recebeu resultado e não perde a tentativa. O teto global continua
      // contando, porque protege o gasto.
      if (r.technicalFailure) {
        deps.limits.analysisPerReceipt.refund(receiptKey);
        deps.limits.analysisPerClient.refund(client);
      }
      return r.outcome;
    });
    inflight.set(cacheKey, job);
    try {
      const r = await job;
      return json(r.status, { ...r.body, remaining: remaining() });
    } finally {
      inflight.delete(cacheKey);
    }
  } catch {
    return fail(500, "internal");
  } finally {
    bytes?.fill(0);
  }
}

/** A análise propriamente dita: visão → capítulos (com prazo e tetos). */
async function runAnalysis(
  bytes: Uint8Array,
  hand: "right" | "left",
  cacheKey: string,
  deps: PalmApiDeps,
): Promise<{ outcome: Outcome; technicalFailure: boolean }> {
  const failure = (status: number, error: PalmApiError) => ({
    outcome: { status, body: { error } },
    technicalFailure: true,
  });
  try {
    const started = deps.now();
    const deadlineAt = started + ANALYSIS_DEADLINE_MS;
    // Teto por relatório (visão + capítulos), além do teto do processo.
    // Só com provedores reais: o simulado não tem preço nem custo.
    const report =
      deps.config.mode === "anthropic"
        ? createBudget(deps.config.reportBudgetUsd)
        : null;
    const vision = report
      ? withVisionBudget(deps.provider(), report)
      : deps.provider();
    const text = report
      ? withBudget(deps.textProvider(), report)
      : deps.textProvider();

    const outcome = await analyzePalmImage({
      bytes,
      hand,
      provider: vision,
      deadlineAt,
      now: deps.now,
    });

    switch (outcome.kind) {
      case "ok": {
        // A trilha de auditoria (origem, motivo da reserva, tentativas)
        // fica no servidor; o cliente recebe só os capítulos. Sem tempo
        // para a redação, o capítulo usa a biblioteca.
        const { result, audit } = await composePalmReading({
          observation: outcome.observation,
          textProvider: text,
          simulated: deps.config.mode === "mock",
          options: { deadlineAt, now: deps.now },
        });
        deps.onAudit?.(audit);
        deps.cache.set(cacheKey, {
          expires: deps.now() + CACHE_TTL_MS,
          result,
        });
        if (deps.cache.size > CACHE_MAX)
          deps.cache.delete(deps.cache.keys().next().value!);
        return {
          outcome: { status: 200, body: { result } },
          technicalFailure: false,
        };
      }
      case "refused":
        // O modelo examinou a foto e pediu outra: conta como tentativa.
        return {
          outcome: { status: 422, body: { error: "retake_required" } },
          technicalFailure: false,
        };
      case "invalid_output":
        return failure(502, "analysis_failed");
      case "provider_error":
        if (outcome.error === "budget") return failure(429, "processing_limit");
        if (
          ["timeout", "unavailable", "network", "rate_limit"].includes(
            outcome.error,
          )
        )
          return failure(503, "temporarily_unavailable");
        return failure(502, "analysis_failed");
    }
    return failure(500, "internal");
  } catch {
    return failure(500, "internal");
  } finally {
    bytes.fill(0);
  }
}
