/**
 * Cliente dos endpoints da leitura das mãos (Fase 03D). Sem credenciais:
 * tudo o que é sensível fica no servidor. A foto só é enviada quando a
 * análise está habilitada E a pessoa toca em "Analisar".
 */
import type { PalmHand, PalmConsent } from "../consent";
import type { PalmAnalysisResult } from "../vision/analyze";

const BASE = "/api/leitura-das-maos";
const ANALYSIS_TIMEOUT_MS = 70_000;

export type AnalysisAvailability =
  { enabled: false } | { enabled: true; simulated: boolean };

export type ConsentReceiptToken = { token: string; expiresAt: number };

export type AnalysisErrorCode =
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
  | "internal"
  | "network";

export type AnalysisCall =
  | { ok: true; result: PalmAnalysisResult }
  | { ok: false; error: AnalysisErrorCode };

const KNOWN = new Set<AnalysisErrorCode>([
  "not_found",
  "forbidden",
  "consent_required",
  "invalid_consent",
  "invalid_image",
  "too_large",
  "rate_limited",
  "processing_limit",
  "retake_required",
  "temporarily_unavailable",
  "analysis_failed",
  "unavailable",
  "internal",
]);

async function errorOf(response: Response): Promise<AnalysisErrorCode> {
  try {
    const body = (await response.json()) as { error?: string };
    return KNOWN.has(body.error as AnalysisErrorCode)
      ? (body.error as AnalysisErrorCode)
      : "internal";
  } catch {
    return "internal";
  }
}

export async function getAnalysisAvailability(
  fetcher: typeof fetch = fetch,
): Promise<AnalysisAvailability> {
  try {
    const r = await fetcher(`${BASE}/analise`, { cache: "no-store" });
    if (!r.ok) return { enabled: false };
    const body = (await r.json()) as { enabled?: boolean; simulated?: boolean };
    return body.enabled
      ? { enabled: true, simulated: body.simulated !== false }
      : { enabled: false };
  } catch {
    return { enabled: false };
  }
}

export async function requestConsentReceipt(
  consent: PalmConsent,
  hand: PalmHand,
  fetcher: typeof fetch = fetch,
): Promise<
  | { ok: true; receipt: ConsentReceiptToken }
  | { ok: false; error: AnalysisErrorCode }
> {
  try {
    const r = await fetcher(`${BASE}/consentimento`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        version: consent.version,
        adult: consent.adult,
        analysis: consent.analysis,
        hand,
      }),
    });
    if (!r.ok) return { ok: false, error: await errorOf(r) };
    return { ok: true, receipt: (await r.json()) as ConsentReceiptToken };
  } catch {
    return { ok: false, error: "network" };
  }
}

export async function requestPalmAnalysis(
  photo: Blob,
  receipt: ConsentReceiptToken,
  fetcher: typeof fetch = fetch,
): Promise<AnalysisCall> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);
  try {
    const r = await fetcher(`${BASE}/analise`, {
      method: "POST",
      headers: {
        "content-type": "image/jpeg",
        "x-sidera-consent": receipt.token,
      },
      body: photo,
      signal: controller.signal,
    });
    if (!r.ok) return { ok: false, error: await errorOf(r) };
    const body = (await r.json()) as { result: PalmAnalysisResult };
    return { ok: true, result: body.result };
  } catch {
    return { ok: false, error: "network" };
  } finally {
    clearTimeout(timer);
  }
}

/** Mensagens ao usuário, por código (sem detalhes internos). */
export const ANALYSIS_ERROR_MESSAGES: Record<
  AnalysisErrorCode,
  { title: string; body: string; retake: boolean; reconsent: boolean }
> = {
  retake_required: {
    title: "Precisamos de outra foto",
    body: "Não foi possível analisar esta imagem. Tire outra foto da palma, aberta e de frente, com boa luz.",
    retake: true,
    reconsent: false,
  },
  invalid_image: {
    title: "A foto não passou na conferência",
    body: "O formato, o tamanho ou os dados da imagem não foram aceitos. Tire ou escolha outra foto por este aplicativo.",
    retake: true,
    reconsent: false,
  },
  too_large: {
    title: "Foto grande demais",
    body: "Tire ou escolha outra foto, de preferência sem zoom digital nem filtros.",
    retake: true,
    reconsent: false,
  },
  consent_required: {
    title: "Confirme o consentimento de novo",
    body: "Seu consentimento para a análise expirou ou não foi registrado. Confirme novamente para continuar.",
    retake: false,
    reconsent: true,
  },
  invalid_consent: {
    title: "Confirme o consentimento de novo",
    body: "Não conseguimos registrar seu consentimento. Confirme novamente para continuar.",
    retake: false,
    reconsent: true,
  },
  rate_limited: {
    title: "Limite de análises atingido",
    body: "Você já usou as análises disponíveis por agora. Tente mais tarde.",
    retake: false,
    reconsent: false,
  },
  processing_limit: {
    title: "Limite de processamento atingido",
    body: "A análise está temporariamente indisponível por limite de processamento. Tente mais tarde.",
    retake: false,
    reconsent: false,
  },
  temporarily_unavailable: {
    title: "Falha temporária",
    body: "A análise não respondeu a tempo. Tente de novo em instantes.",
    retake: false,
    reconsent: false,
  },
  analysis_failed: {
    title: "Não conseguimos concluir a análise",
    body: "Tente de novo em instantes. Se continuar, tire outra foto.",
    retake: true,
    reconsent: false,
  },
  network: {
    title: "Sem conexão com a análise",
    body: "Confira sua conexão e tente de novo.",
    retake: false,
    reconsent: false,
  },
  not_found: {
    title: "Análise indisponível",
    body: "A análise da foto não está disponível nesta versão.",
    retake: false,
    reconsent: false,
  },
  forbidden: {
    title: "Análise indisponível",
    body: "Não foi possível enviar a foto a partir desta página.",
    retake: false,
    reconsent: false,
  },
  unavailable: {
    title: "Análise indisponível",
    body: "A análise não está disponível no momento.",
    retake: false,
    reconsent: false,
  },
  internal: {
    title: "Algo deu errado",
    body: "Tente de novo em instantes.",
    retake: false,
    reconsent: false,
  },
};
