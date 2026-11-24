/**
 * Registros do experimento de repetibilidade visual.
 *
 * O que NUNCA entra num registro: imagem, miniatura, base64, nome de arquivo
 * ou nome de pessoa. A foto é identificada por um código opaco (`p01`…), a
 * pessoa por um pseudônimo (`P1`…) e a autorização por um código
 * (`AUT-REP-NN`). A evidência textual do modelo fica, para a análise
 * qualitativa, mas não entra nos relatórios.
 */
import type { AiUsage } from "../../../interpretation/ai/contract";
import type { ValidatedObservation } from "../../analysis/validate-observation";
import type { PalmHand } from "../../consent";
import type { RepStage } from "./config";

/** Arquivo original reenviado (com histórico) × foto recém-capturada. */
export type PhotoOrigin = "original" | "nova";

export type RepPhoto = {
  /** Código opaco da foto (p01…). */
  id: string;
  hand: PalmHand;
  origin: PhotoOrigin;
  /** Pseudônimo da pessoa (P1…), para medir a diversidade de participantes. */
  participant: string;
  /** Código da autorização (AUT-REP-NN). */
  authorization: string;
  /** JPEG preparado (`prepareEvalPhoto`). Zerado ao fim da execução. */
  bytes: Uint8Array;
};

export type AnalysisOutcome =
  "ok" | "invalid_output" | "refused" | "provider_error" | "not_run";

export type AnalysisRecord = {
  photoId: string;
  origin: PhotoOrigin;
  participant: string;
  hand: PalmHand;
  /** SHA-256 do JPEG preparado: o mesmo em todas as análises da foto. */
  inputSha256: string;
  stage: RepStage;
  /** Sessão (dia) da execução, ex.: "S1". */
  session: string;
  /** Rodada dentro da sessão (cada foto uma vez por rodada). */
  round: number;
  /** Número cumulativo da análise desta foto (1, 2, …), entre etapas. */
  index: number;
  outcome: AnalysisOutcome;
  /** Tipo do erro do provedor, ou motivo de não execução. */
  error: string | null;
  /** Códigos do validador (sem texto do modelo). */
  codes: string[];
  /** Observação validada (texto estruturado), quando `ok`. */
  observation: ValidatedObservation | null;
  respondedModel: string | null;
  usage: AiUsage | null;
  costUsd: number;
  latencyMs: number;
};

export type RunResult = {
  records: AnalysisRecord[];
  /** Por que a execução parou antes da meta (null: meta atingida). */
  stoppedBy: null | "budget" | "max_calls" | "max_sends";
  spentUsd: number;
  calls: number;
};
