/**
 * Orquestração da análise visual (Fase 03D).
 *
 * imagem conferida → provedor de visão → JSON → validador 03C → motor 03C
 * → resultado SEGURO para o cliente (observações do sistema e limitações).
 *
 * O que nunca sai daqui para o cliente: evidências, notas do validador,
 * resposta bruta do modelo e a imagem. A imagem é zerada no fim, com ou sem
 * sucesso. Nada é gravado.
 */
import {
  AiProviderError,
  type AiErrorKind,
  type AiUsage,
} from "../../interpretation/ai/contract";
import type { PalmHand } from "../consent";
import type { FeatureId } from "../analysis/contract";
import {
  buildPalmInterpretation,
  type PalmChapterId,
} from "../analysis/engine";
import {
  validatePalmObservation,
  type ObservationNote,
  type ReadingStatus,
} from "../analysis/validate-observation";
import type { VisionProvider } from "./contract";
import { buildVisionRequest } from "./prompt";

export const VISION_MAX_ATTEMPTS = 2;
export const VISION_MAX_OUTPUT_TOKENS = 4000;
export const VISION_TIMEOUT_MS = 45_000;

/** O que o cliente recebe (sem evidência, sem modelo, sem imagem). */
export type PalmAnalysisResult = {
  status: ReadingStatus;
  /** Sugerir nova foto: insuficiente, ou parcial com pouco observado. */
  retakeRecommended: boolean;
  /** Provedor simulado: nada foi realmente observado na foto. */
  simulated: boolean;
  observations: {
    chapter: 6 | 7;
    feature: FeatureId | "hand.type";
    text: string;
    partial: boolean;
  }[];
  limitations: Record<PalmChapterId, string[]>;
};

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
  | { kind: "ok"; result: PalmAnalysisResult; audit: AttemptAudit[] }
  | { kind: "refused"; audit: AttemptAudit[] }
  | { kind: "invalid_output"; audit: AttemptAudit[] }
  | { kind: "provider_error"; error: AiErrorKind; audit: AttemptAudit[] };

/** Menos que isto observado → sugerir nova foto mesmo com leitura parcial. */
const MIN_OBSERVED_FOR_PARTIAL = 3;

export async function analyzePalmImage(input: {
  bytes: Uint8Array;
  hand: PalmHand;
  provider: VisionProvider;
  simulated: boolean;
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
      return {
        kind: "ok",
        result: toClientResult(validation.observation, input.simulated),
        audit,
      };
    }
    if (lastError && audit.every((a) => a.outcome.startsWith("error:")))
      return { kind: "provider_error", error: lastError, audit };
    return { kind: "invalid_output", audit };
  } finally {
    // A imagem não deve sobreviver ao processamento.
    bytes.fill(0);
  }
}

function toClientResult(
  observation: Parameters<typeof buildPalmInterpretation>[0],
  simulated: boolean,
): PalmAnalysisResult {
  const report = buildPalmInterpretation(observation);
  const observations = report.chapters.flatMap((c) =>
    c.items.map((item) => ({
      chapter: c.number,
      feature: item.factIds[0],
      text: item.observation,
      partial: item.certainty === "uncertain",
    })),
  );
  const direct = observations.filter((o) => o.feature !== "hand.type");
  return {
    status: report.status,
    retakeRecommended:
      report.status === "insufficient" ||
      (report.status === "partial" && direct.length < MIN_OBSERVED_FOR_PARTIAL),
    simulated,
    observations,
    limitations: {
      maos: report.chapters[0].limitations,
      linhas: report.chapters[1].limitations,
    },
  };
}
