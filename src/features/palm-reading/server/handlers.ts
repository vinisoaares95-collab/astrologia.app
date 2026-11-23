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
 * opacas e o resultado já seguro para o cliente. A chave do cliente é um
 * HMAC do IP com segredo do servidor (client-key.ts); de qual cabeçalho o IP
 * é lido depende do proxy da hospedagem, ainda não definido.
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
import { clientKeyerFromEnv, type ClientKeyer } from "./client-key";
import {
  createPrismaConsentLedger,
  receiptHashOf,
  REQUEST_KEY,
  requestHashOf,
  type ConsentLedger,
} from "./consent-ledger";
import { readConsentLedgerConfig } from "./consent-ledger-config";
import { getDb } from "@/lib/db";
import { issueReceipt, receiptSecret, verifyReceipt } from "./consent-receipt";
import { createLimiter, type Limiter } from "./rate-limit";
import { anthropicApiKey } from "../../interpretation/ai/api-key";

export const CONSENT_HEADER = "x-sidera-consent";
/** Chave de idempotência do envio, gerada no aparelho (03G.3, Bloco 2). */
export const REQUEST_HEADER = "x-sidera-request";
/** Análises por recibo (uma sessão de consentimento). */
export const MAX_ANALYSES_PER_RECEIPT = 3;
/** Corpo máximo aceito (foto preparada); o resto é recusado sem ler. */
export const MAX_IMAGE_BYTES = MAX_PREPARED_BYTES;
const MAX_CONSENT_BODY_BYTES = 2048;
export const CACHE_TTL_MS = 10 * 60 * 1000;
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
  | "invalid_request"
  | "analysis_in_progress"
  | "result_expired"
  | "internal";

export type PalmApiDeps = {
  config: PalmAnalysisConfig;
  secret: Buffer | null;
  /**
   * Chave opaca do cliente (HMAC do IP; 03G.3). `null` quando falta o
   * segredo ou uma fonte de IP confiável: o endpoint fica indisponível.
   */
  clientKey: ClientKeyer;
  now: () => number;
  provider: () => VisionProvider;
  /** Redação dos capítulos 6 e 7 (Fase 03E). */
  textProvider: () => AiProvider;
  limits: {
    consentPerClient: Limiter;
    analysisGlobal: Limiter;
    analysisPerClient: Limiter;
    analysisPerReceipt: Limiter;
    revokePerClient: Limiter;
  };
  cache: Map<string, { expires: number; result: PalmAnalysisResult }>;
  /**
   * Registro de consentimento (03G.3, Bloco 2). Ausente ou "off": modo
   * anterior, sem registro (só fora de produção). "blocked": endpoints 503.
   */
  consentLedger?:
    | { status: "off" }
    | { status: "blocked" }
    | { status: "active"; ledger: ConsentLedger; sharedResults: boolean };
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
    analysisPerReceipt: createLimiter({
      limit: MAX_ANALYSES_PER_RECEIPT,
      windowMs: 60 * 60 * 1000,
    }),
    revokePerClient: createLimiter({ limit: 20, windowMs: 60 * 60 * 1000 }),
  };
}

/** Registro conforme o ambiente (produção: bloqueado nesta fase). */
function ledgerFromEnv(): NonNullable<PalmApiDeps["consentLedger"]> {
  const config = readConsentLedgerConfig();
  if (config.mode === "off") return { status: "off" };
  if (config.mode === "blocked") return { status: "blocked" };
  return {
    status: "active",
    ledger: createPrismaConsentLedger(getDb(), {
      retentionDays: config.retentionDays,
    }),
    sharedResults: config.sharedResults,
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
    clientKey: clientKeyerFromEnv(),
    now: () => Date.now(),
    provider: () => real ?? mock,
    textProvider: () => realText ?? mockText,
    limits: defaultLimits(),
    cache: new Map(),
    consentLedger: ledgerFromEnv(),
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
    if (deps.consentLedger?.status === "blocked")
      return fail(503, "unavailable");
    const client = deps.clientKey(request);
    if (!client) return fail(503, "unavailable");
    if (!deps.limits.consentPerClient.take(client, deps.now()))
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
    const ledger = activeLedger(deps);
    if (ledger) {
      // Sem evidência gravada, não há recibo (03G.3, Bloco 2).
      try {
        await ledger.record({
          receiptHash: receiptHashOf(receipt.nonce),
          consentVersion: receipt.v,
          purposes: ["PALM_READING"],
          adultDeclared: true,
          acceptedAt: receipt.iat,
          receiptExpiresAt: receipt.exp,
        });
      } catch {
        return fail(503, "unavailable");
      }
      // Limpeza oportunista (lote pequeno); falha aqui não afeta o aceite.
      await ledger.purge({ now: deps.now(), limit: 50 }).catch(() => null);
      return json(200, {
        token,
        expiresAt: receipt.exp,
        remaining: Math.min(
          MAX_ANALYSES_PER_RECEIPT,
          deps.limits.analysisPerClient.remaining(client, deps.now()),
        ),
      });
    }
    return json(200, {
      token,
      expiresAt: receipt.exp,
      remaining: remainingFor(deps, sha256(`receipt:${receipt.nonce}`), client),
    });
  } catch {
    return fail(500, "internal");
  }
}

const activeLedger = (deps: PalmApiDeps) =>
  deps.consentLedger?.status === "active" ? deps.consentLedger.ledger : null;

// ── Revogação (03G.3, Bloco 2) ────────────────────────────────────────────

/**
 * Revoga o consentimento do recibo apresentado. Autorização: posse do
 * recibo assinado (vale mesmo vencido, até o registro ser apagado). Responde
 * 204 sem dizer se havia algo a revogar. Sair da página NÃO chama isto.
 */
export async function handleRevoke(
  request: Request,
  deps: PalmApiDeps,
): Promise<Response> {
  try {
    if (!deps.config.enabled) return fail(404, "not_found");
    if (!isSameOrigin(request)) return fail(403, "forbidden");
    if (!deps.secret) return fail(503, "unavailable");
    if (deps.consentLedger?.status === "blocked")
      return fail(503, "unavailable");
    const ledger = activeLedger(deps);
    if (!ledger) return fail(404, "not_found");
    const client = deps.clientKey(request);
    if (!client) return fail(503, "unavailable");
    if (!deps.limits.revokePerClient.take(client, deps.now()))
      return fail(429, "rate_limited");
    const check = verifyReceipt(
      request.headers.get(CONSENT_HEADER),
      deps.secret,
      deps.now(),
      { allowExpired: true },
    );
    if (!check.ok) return fail(401, "consent_required");
    try {
      await ledger.revoke({
        receiptHash: receiptHashOf(check.receipt.nonce),
        now: deps.now(),
      });
    } catch {
      return fail(503, "unavailable");
    }
    return new Response(null, {
      status: 204,
      headers: { "cache-control": "no-store" },
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
    if (deps.consentLedger?.status === "blocked")
      return fail(503, "unavailable");
    const client = deps.clientKey(request);
    if (!client) return fail(503, "unavailable");

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

    const ledger = activeLedger(deps);
    const requestKey = request.headers.get(REQUEST_HEADER);
    if (ledger && (!requestKey || !REQUEST_KEY.test(requestKey)))
      return fail(400, "invalid_request");

    const now = deps.now();
    const receiptKey = sha256(`receipt:${receipt.nonce}`);
    const remaining = () => remainingFor(deps, receiptKey, client);
    const limited = () =>
      json(429, { error: "rate_limited", remaining: remaining() });
    if (
      !ledger &&
      deps.limits.analysisPerReceipt.remaining(receiptKey, now) === 0
    )
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

    if (ledger) {
      const photo = bytes;
      bytes = null;
      return await analyzeWithLedger({
        deps,
        ledger,
        photo,
        hand: receipt.hand,
        receiptHash: receiptHashOf(receipt.nonce),
        requestHash: requestHashOf(requestKey!),
        client,
      });
    }

    // A mesma foto, no mesmo recibo, não gera nova chamada.
    const cacheKey = sha256(
      `${receipt.nonce}:${sha256(bytes)}:${deps.config.mode}`,
    );
    const cached = deps.cache.get(cacheKey);
    if (cached && cached.expires <= now) deps.cache.delete(cacheKey);
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
    const job = runAnalysis(photo, receipt.hand, deps).then((r) => {
      // Falha técnica (provedor, formato, teto, prazo): a pessoa não
      // recebeu resultado e não perde a tentativa. O teto global continua
      // contando, porque protege o gasto.
      if (r.technicalFailure) {
        deps.limits.analysisPerReceipt.refund(receiptKey);
        deps.limits.analysisPerClient.refund(client);
      }
      if (r.result) rememberResult(deps.cache, cacheKey, deps.now(), r.result);
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

/**
 * Guarda o resultado (sem a foto) por até CACHE_TTL_MS e o apaga no
 * vencimento, mesmo sem novos pedidos: o texto de privacidade promete
 * "até 10 minutos". As entradas vencidas também saem a cada gravação.
 */
export function rememberResult(
  cache: PalmApiDeps["cache"],
  key: string,
  now: number,
  result: PalmAnalysisResult,
) {
  for (const [k, v] of cache) if (v.expires <= now) cache.delete(k);
  const expires = now + CACHE_TTL_MS;
  cache.set(key, { expires, result });
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value!);
  const timer = setTimeout(() => {
    if (cache.get(key)?.expires === expires) cache.delete(key);
  }, CACHE_TTL_MS);
  timer.unref?.();
}

/**
 * Análise com o registro de consentimento (03G.3, Bloco 2).
 *
 * 1. Autorização transacional (`begin`): trava o consentimento, confere
 *    revogação, validade e tentativas, e cria a tentativa PENDING. Só depois
 *    do COMMIT a análise chama o provedor; nenhuma transação fica aberta
 *    durante a chamada.
 * 2. Pedido repetido (mesma chave): em andamento → espera aqui se for nesta
 *    instância, senão 409; concluído → cache local ou resultado
 *    compartilhado (D8), nunca nova análise; sem resultado → 410.
 * 3. Fim: falha técnica → devolve a tentativa (uma vez só); senão conclui.
 *    Revogado durante o processamento → resultado descartado (401). Falha do
 *    banco ao concluir ou devolver → o resultado ainda é entregue; a
 *    tentativa fica PENDING e é devolvida como órfã quando o lease vence.
 */
async function analyzeWithLedger(input: {
  deps: PalmApiDeps;
  ledger: ConsentLedger;
  photo: Uint8Array;
  hand: "right" | "left";
  receiptHash: string;
  requestHash: string;
  client: string;
}): Promise<Response> {
  const { deps, ledger, photo, hand, receiptHash, requestHash, client } = input;
  const sharedResults =
    deps.consentLedger?.status === "active" && deps.consentLedger.sharedResults;
  const localKey = sha256(`ledger:${receiptHash}:${requestHash}`);
  const withRemaining = (status: number, body: object, remaining: number) =>
    json(status, {
      ...body,
      remaining: Math.max(
        0,
        Math.min(
          remaining,
          deps.limits.analysisPerClient.remaining(client, deps.now()),
        ),
      ),
    });
  try {
    let begin: Awaited<ReturnType<ConsentLedger["begin"]>>;
    try {
      begin = await ledger.begin({
        receiptHash,
        requestHash,
        now: deps.now(),
        maxUses: MAX_ANALYSES_PER_RECEIPT,
      });
    } catch {
      // Banco indisponível ANTES da autorização: nada é chamado nem contado.
      return fail(503, "unavailable");
    }
    switch (begin.kind) {
      case "consent_invalid":
        return fail(401, "consent_required");
      case "exhausted":
        return withRemaining(429, { error: "rate_limited" }, 0);
      case "in_progress": {
        const running = deps.inflight?.get(localKey);
        if (running) {
          const r = await running;
          return withRemaining(r.status, r.body, begin.remaining);
        }
        const response = withRemaining(
          409,
          { error: "analysis_in_progress" },
          begin.remaining,
        );
        response.headers.set("retry-after", "5");
        return response;
      }
      case "completed": {
        const cached = deps.cache.get(localKey);
        if (cached && cached.expires > deps.now())
          return withRemaining(200, { result: cached.result }, begin.remaining);
        if (sharedResults) {
          const payload = await ledger
            .sharedResult({ useId: begin.useId, now: deps.now() })
            .catch(() => null);
          if (payload)
            return withRemaining(200, { result: payload }, begin.remaining);
        }
        // Nunca reanalisa automaticamente um pedido já concluído (D8).
        return withRemaining(410, { error: "result_expired" }, begin.remaining);
      }
      case "authorized":
        break;
    }

    const { useId, leaseId } = begin;
    const now = deps.now();
    const giveBack = () =>
      ledger.refund({ useId, leaseId, now: deps.now() }).catch(() => false);
    if (!deps.limits.analysisPerClient.take(client, now)) {
      await giveBack();
      return withRemaining(429, { error: "rate_limited" }, begin.remaining + 1);
    }
    if (!deps.limits.analysisGlobal.take("global", now)) {
      deps.limits.analysisPerClient.refund(client);
      await giveBack();
      return withRemaining(429, { error: "rate_limited" }, begin.remaining + 1);
    }

    type LedgerOutcome = Outcome & { remainingDelta: number };
    const inflight = (deps.inflight ??= new Map());
    const job = (async (): Promise<LedgerOutcome> => {
      const r = await runAnalysis(photo, hand, deps);
      if (r.technicalFailure) {
        deps.limits.analysisPerClient.refund(client);
        const refunded = await giveBack();
        return { ...r.outcome, remainingDelta: refunded ? 1 : 0 };
      }
      const at = deps.now();
      const done = await ledger
        .complete({
          useId,
          leaseId,
          now: at,
          shared: sharedResults && r.result ? r.result : undefined,
        })
        .catch(() => "error" as const);
      if (done === "revoked")
        return {
          status: 401,
          body: { error: "consent_required" },
          remainingDelta: 0,
        };
      if (r.result && done === "completed")
        rememberResult(deps.cache, localKey, at, r.result);
      return { ...r.outcome, remainingDelta: 0 };
    })();
    inflight.set(localKey, job);
    try {
      const r = await job;
      return withRemaining(
        r.status,
        r.body,
        begin.remaining + r.remainingDelta,
      );
    } finally {
      inflight.delete(localKey);
    }
  } finally {
    photo.fill(0);
  }
}

/** A análise propriamente dita: visão → capítulos (com prazo e tetos). */
async function runAnalysis(
  bytes: Uint8Array,
  hand: "right" | "left",
  deps: PalmApiDeps,
): Promise<{
  outcome: Outcome;
  technicalFailure: boolean;
  /** Presente só quando há leitura (para o cache e o resultado compartilhado). */
  result?: PalmAnalysisResult;
}> {
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
        return {
          outcome: { status: 200, body: { result } },
          technicalFailure: false,
          result,
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
