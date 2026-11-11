/**
 * Orquestração da análise visual (Fase 03D).
 *
 * imagem conferida → provedor de visão → JSON → validador 03C → motor 03C
 * → observação VALIDADA (que segue para os capítulos 6 e 7, Fase 03E).
 *
 * O que nunca sai daqui: resposta bruta do modelo e a imagem. A evidência
 * visual fica na observação validada, mas não chega ao modelo de texto nem
 * ao cliente (ver chapters/prompt.ts e chapters/presentation.ts). A imagem é zerada no fim, com ou sem
 * sucesso. Nada é gravado.
 */
import {
  AiProviderError,
  type AiErrorKind,
  type AiUsage,
} from "../../interpretation/ai/contract";
import type { PalmHand } from "../consent";
import type { ValidatedObservation } from "../analysis/validate-observation";
import {
  validatePalmObservation,
  type ObservationNote,
} from "../analysis/validate-observation";
import type { VisionProvider } from "./contract";
import { buildVisionRequest } from "./prompt";

export const VISION_MAX_ATTEMPTS = 2;
export const VISION_MAX_OUTPUT_TOKENS = 4000;
export const VISION_TIMEOUT_MS = 45_000;

export type AttemptAudit = {
  attempt: number;
  outcome:
    | "ok"
    | "invalid_json"
    | "truncated"
    | "refusal"
    | "rejected"
    | `error:${AiErrorKind}`;
  usage: AiUsage | null;
  /** Só códigos (sem texto do modelo nem evidência). */
  codes: string[];
};

export type AnalysisOutcome =
  | { kind: "ok"; observation: ValidatedObservation; audit: AttemptAudit[] }
  | { kind: "refused"; audit: AttemptAudit[] }
  | { kind: "invalid_output"; audit: AttemptAudit[] }
  | { kind: "provider_error"; error: AiErrorKind; audit: AttemptAudit[] };

export async function analyzePalmImage(input: {
  bytes: Uint8Array;
  hand: PalmHand;
  provider: VisionProvider;
  maxAttempts?: number;
}): Promise<AnalysisOutcome> {
  const { bytes, hand, provider } = input;
  const audit: AttemptAudit[] = [];
  try {
    const request = buildVisionRequest(
      hand,
      Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString(
        "base64",
      ),
      {
        maxOutputTokens: VISION_MAX_OUTPUT_TOKENS,
        timeoutMs: VISION_TIMEOUT_MS,
      },
    );
    const maxAttempts = Math.min(input.maxAttempts ?? VISION_MAX_ATTEMPTS, 3);
    let lastError: AiErrorKind | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      let response;
      try {
        response = await provider.analyze(request);
      } catch (error) {
        const err =
          error instanceof AiProviderError
            ? error
            : new AiProviderError("unknown", "");
        audit.push({
          attempt,
          outcome: `error:${err.kind}`,
          usage: null,
          codes: [],
        });
        lastError = err.kind;
        if (!err.retryable) break;
        continue;
      }
      const record = (outcome: AttemptAudit["outcome"], codes: string[] = []) =>
        audit.push({ attempt, outcome, usage: response.usage, codes });

      if (response.stopReason === "refusal") {
        record("refusal");
        return { kind: "refused", audit };
      }
      if (response.stopReason === "max_tokens") {
        record("truncated");
        continue;
      }
      let raw: unknown;
      try {
        raw = JSON.parse(response.text);
      } catch {
        record("invalid_json");
        continue;
      }
      const validation = validatePalmObservation(raw, hand);
      if (!validation.ok) {
        record(
          "rejected",
          validation.errors.map((e: ObservationNote) => e.code),
        );
        continue;
      }
      record(
        "ok",
        validation.notes.map((n) => n.code),
      );
      return { kind: "ok", observation: validation.observation, audit };
    }
    if (lastError && audit.every((a) => a.outcome.startsWith("error:")))
      return { kind: "provider_error", error: lastError, audit };
    return { kind: "invalid_output", audit };
  } finally {
    // A imagem não deve sobreviver ao processamento.
    bytes.fill(0);
  }
}
