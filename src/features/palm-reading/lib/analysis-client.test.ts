import { describe, expect, it, vi } from "vitest";

import { createConsent } from "../consent";
import {
  ANALYSIS_ERROR_MESSAGES,
  ANALYSIS_TIMEOUT_MS,
  getAnalysisAvailability,
  requestConsentReceipt,
  newRequestKey,
  requestPalmAnalysis,
  revokeConsentReceipt,
} from "./analysis-client";

const respond = (status: number, body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status }));

describe("cliente da análise", () => {
  it("disponibilidade: 404 ou falha de rede → desligada", async () => {
    expect(await getAnalysisAvailability(respond(404, {}))).toEqual({
      enabled: false,
    });
    expect(
      await getAnalysisAvailability(
        vi.fn(async () => {
          throw new Error("offline");
        }),
      ),
    ).toEqual({ enabled: false });
    expect(
      await getAnalysisAvailability(
        respond(200, { enabled: true, simulated: true }),
      ),
    ).toEqual({ enabled: true, simulated: true });
  });

  it("consentimento: envia só versão, idade, autorização e mão", async () => {
    const f = respond(200, { token: "t", expiresAt: 1 });
    const consent = createConsent({ adult: true, analysis: true })!;
    await requestConsentReceipt(consent, "left", f);
    const [, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      version: consent.version,
      adult: true,
      analysis: true,
      hand: "left",
    });
  });

  it("análise: JPEG no corpo, recibo no cabeçalho, nenhuma credencial", async () => {
    const f = respond(200, { result: { status: "complete" } });
    const blob = new Blob(["x"], { type: "image/jpeg" });
    const r = await requestPalmAnalysis(
      blob,
      { token: "recibo", expiresAt: 1 },
      f,
    );
    expect(r.ok).toBe(true);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/leitura-das-maos/analise");
    expect(init.headers).toEqual({
      "content-type": "image/jpeg",
      "x-sidera-consent": "recibo",
    });
    expect(init.body).toBe(blob);
    expect(JSON.stringify(init.headers)).not.toMatch(
      /api[-_]?key|authorization/iu,
    );
  });

  it("chave de idempotência (Bloco 2): aleatória, no cabeçalho, sem dado da pessoa", async () => {
    const a = newRequestKey();
    expect(a).toMatch(/^[A-Za-z0-9_-]{22,64}$/);
    expect(newRequestKey()).not.toBe(a);
    const f = respond(200, { result: { status: "complete" } });
    await requestPalmAnalysis(
      new Blob(["x"]),
      { token: "recibo", expiresAt: 1 },
      f,
      undefined,
      a,
    );
    const [, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.headers).toMatchObject({ "x-sidera-request": a });
  });

  it("revogação: recibo no cabeçalho, sem corpo; 204 = revogado", async () => {
    const f = vi.fn(async () => new Response(null, { status: 204 }));
    expect(
      await revokeConsentReceipt(
        { token: "recibo", expiresAt: 1 },
        f as unknown as typeof fetch,
      ),
    ).toBe(true);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/leitura-das-maos/consentimento/revogar");
    expect(init).toMatchObject({
      method: "POST",
      headers: { "x-sidera-consent": "recibo" },
    });
    expect(init.body).toBeUndefined();
    const down = vi.fn(async () => {
      throw new Error("rede");
    });
    expect(
      await revokeConsentReceipt(
        { token: "recibo", expiresAt: 1 },
        down as unknown as typeof fetch,
      ),
    ).toBe(false);
  });

  it("sair do fluxo (D5) aborta o envio em andamento", async () => {
    const leave = new AbortController();
    const f = vi.fn(
      (_: string, init: RequestInit) =>
        new Promise<Response>((_, reject) =>
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("abortado", "AbortError")),
          ),
        ),
    );
    const pending = requestPalmAnalysis(
      new Blob(["x"]),
      { token: "recibo", expiresAt: 1 },
      f as unknown as typeof fetch,
      leave.signal,
    );
    leave.abort();
    expect((await pending).ok).toBe(false);
    const [, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.signal?.aborted).toBe(true);
  });

  it("erros viram códigos conhecidos; desconhecidos viram 'internal'", async () => {
    const blob = new Blob(["x"]);
    const r1 = await requestPalmAnalysis(
      blob,
      { token: "t", expiresAt: 1 },
      respond(429, { error: "rate_limited" }),
    );
    expect(r1).toEqual({ ok: false, error: "rate_limited", remaining: null });
    const r2 = await requestPalmAnalysis(
      blob,
      { token: "t", expiresAt: 1 },
      respond(500, { error: "stack trace" }),
    );
    expect(r2).toEqual({ ok: false, error: "internal", remaining: null });
    const r3 = await requestPalmAnalysis(
      blob,
      { token: "t", expiresAt: 1 },
      vi.fn(async () => {
        throw new Error("x");
      }),
    );
    expect(r3).toEqual({ ok: false, error: "network", remaining: null });
  });

  it("análises restantes vêm do servidor em sucesso e em erro (03F.2)", async () => {
    const blob = new Blob(["x"]);
    const ok = await requestPalmAnalysis(
      blob,
      { token: "t", expiresAt: 1 },
      respond(200, { result: { status: "complete" }, remaining: 2 }),
    );
    expect(ok).toMatchObject({ ok: true, remaining: 2 });
    const err = await requestPalmAnalysis(
      blob,
      { token: "t", expiresAt: 1 },
      respond(503, { error: "temporarily_unavailable", remaining: 3 }),
    );
    expect(err).toEqual({
      ok: false,
      error: "temporarily_unavailable",
      remaining: 3,
    });
  });

  it("o aparelho desiste depois de 70 s: erro de espera, não de conexão", async () => {
    vi.useFakeTimers();
    try {
      const fetcher = vi.fn(
        (_: unknown, init: { signal: AbortSignal }) =>
          new Promise<Response>((_, reject) =>
            init.signal.addEventListener("abort", () =>
              reject(new DOMException("aborted", "AbortError")),
            ),
          ),
      );
      const pending = requestPalmAnalysis(
        new Blob(["x"]),
        { token: "t", expiresAt: 1 },
        fetcher as unknown as typeof fetch,
      );
      await vi.advanceTimersByTimeAsync(ANALYSIS_TIMEOUT_MS);
      expect(await pending).toEqual({
        ok: false,
        error: "timeout",
        remaining: null,
      });
      expect(ANALYSIS_ERROR_MESSAGES.timeout.body).toMatch(
        /mesma foto.*não conta como nova análise/u,
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("toda mensagem é amigável e sem detalhe técnico", () => {
    for (const m of Object.values(ANALYSIS_ERROR_MESSAGES))
      expect(`${m.title} ${m.body}`).not.toMatch(
        /HTTP|\d{3}|erro interno|stack/iu,
      );
    expect(ANALYSIS_ERROR_MESSAGES.retake_required.retake).toBe(true);
    expect(ANALYSIS_ERROR_MESSAGES.consent_required.reconsent).toBe(true);
  });
});
