/**
 * Execução das análises repetidas (experimento de repetibilidade visual).
 *
 * Usa o orquestrador do produto (`analyzePalmImage`: mesmo prompt, schema e
 * validador) com 1 tentativa por análise, e o teto de gasto do produto
 * (`withVisionBudget`, reserva do pior caso antes de cada chamada).
 *
 * - Ordem em rodadas: cada foto uma vez por rodada, agrupadas por mão.
 * - Meta CUMULATIVA por foto: conta as análises de execuções anteriores
 *   (`previous`), por exemplo as do piloto.
 * - Para ao atingir o teto de gasto, o limite de chamadas da etapa ou o
 *   teto de envios por foto coberto pelo termo.
 * - O provedor é sempre injetado; nada aqui cria um provedor real.
 * - Os bytes da foto são zerados ao fim, com ou sem erro.
 */
import { createHash } from "node:crypto";

import type { BudgetController } from "../../../interpretation/ai/budget";
import {
  AiProviderError,
  type AiUsage,
} from "../../../interpretation/ai/contract";
import {
  estimateCostUsd,
  MODEL_PRICES,
  type ModelPrice,
} from "../../../interpretation/ai/pricing";
import { analyzePalmImage } from "../../vision/analyze";
import { withVisionBudget } from "../../vision/budget";
import type { VisionProvider } from "../../vision/contract";
import { worstCallUsd } from "../estimate";
import { REP_ATTEMPTS, REP_MAX_SENDS_PER_PHOTO, type RepStage } from "./config";
import type { AnalysisRecord, RepPhoto, RunResult } from "./contract";

export const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

/** Análises que contam para a meta e para os envios (tudo o que foi tentado). */
const executed = (r: AnalysisRecord) => r.outcome !== "not_run";

export async function runRepeatability(input: {
  photos: RepPhoto[];
  stage: RepStage;
  session: string;
  /** Meta cumulativa por foto (ex.: 5 no piloto, 10 na Ampliação A). */
  targetPerPhoto: number;
  /** Registros de execuções anteriores (meta cumulativa e envios). */
  previous?: AnalysisRecord[];
  provider: VisionProvider;
  budget: BudgetController;
  maxCalls: number;
  maxSendsPerPhoto?: number;
  prices?: Record<string, ModelPrice>;
  now?: () => number;
}): Promise<RunResult> {
  const prices = input.prices ?? MODEL_PRICES;
  const now = input.now ?? (() => performance.now());
  const maxSends = input.maxSendsPerPhoto ?? REP_MAX_SENDS_PER_PHOTO;
  const previous = input.previous ?? [];
  const records: AnalysisRecord[] = [];
  const budgeted = withVisionBudget(input.provider, input.budget, prices);
  let stoppedBy: RunResult["stoppedBy"] = null;
  let calls = 0;

  // A mesma entrada em todas as análises: o hash do JPEG preparado é fixado
  // no início e conferido antes de cada chamada.
  const hashes = new Map(input.photos.map((p) => [p.id, sha256(p.bytes)]));
  const done = (id: string) =>
    [...previous, ...records].filter((r) => r.photoId === id && executed(r))
      .length;
  // Agrupadas por mão (cache do prompt), na ordem recebida dentro de cada mão.
  const order = [...input.photos].sort((a, b) =>
    a.hand === b.hand ? 0 : a.hand === "right" ? -1 : 1,
  );

  try {
    for (let round = 1; ; round++) {
      const pending = order.filter((p) => done(p.id) < input.targetPerPhoto);
      if (!pending.length || stoppedBy) break;
      for (const photo of pending) {
        if (sha256(photo.bytes) !== hashes.get(photo.id))
          throw new Error(
            `A entrada da foto ${photo.id} mudou durante a execução.`,
          );
        const base = {
          photoId: photo.id,
          origin: photo.origin,
          participant: photo.participant,
          hand: photo.hand,
          inputSha256: hashes.get(photo.id)!,
          stage: input.stage,
          session: input.session,
          round,
          index: done(photo.id) + 1,
          codes: [],
          observation: null,
          respondedModel: null,
          usage: null,
          costUsd: 0,
          latencyMs: 0,
        };
        const notRun = (
          reason: NonNullable<RunResult["stoppedBy"]>,
        ): AnalysisRecord => ({ ...base, outcome: "not_run", error: reason });

        if (done(photo.id) >= maxSends) {
          stoppedBy = "max_sends";
          records.push(notRun("max_sends"));
          break;
        }
        if (calls >= input.maxCalls) {
          stoppedBy = "max_calls";
          records.push(notRun("max_calls"));
          break;
        }
        const free =
          input.budget.limitUsd -
          input.budget.spentUsd() -
          input.budget.reservedUsd();
        if (worstCallUsd(input.provider.model, photo.hand, prices) > free) {
          stoppedBy = "budget";
          records.push(notRun("budget"));
          break;
        }

        // Mede a chamada (consumo e latência) por dentro do teto.
        const m: {
          usage: AiUsage | null;
          model: string | null;
          charged: number;
        } = { usage: null, model: null, charged: 0 };
        const measured: VisionProvider = {
          id: budgeted.id,
          model: budgeted.model,
          async analyze(request) {
            try {
              const r = await budgeted.analyze(request);
              m.usage = r.usage;
              m.model = r.model;
              return r;
            } catch (error) {
              if (error instanceof AiProviderError)
                m.charged = error.chargedUsd ?? 0;
              throw error;
            }
          },
        };
        const t0 = now();
        calls++;
        const outcome = await analyzePalmImage({
          bytes: photo.bytes.slice(),
          hand: photo.hand,
          provider: measured,
          maxAttempts: REP_ATTEMPTS,
        });
        const latencyMs = now() - t0;
        const costUsd =
          (m.usage && m.model
            ? estimateCostUsd(m.model, m.usage, prices)
            : null) ?? m.charged;
        if (outcome.kind === "provider_error" && outcome.error === "budget") {
          stoppedBy = "budget";
          calls--;
          records.push(notRun("budget"));
          break;
        }
        records.push({
          ...base,
          outcome: outcome.kind,
          error: outcome.kind === "provider_error" ? outcome.error : null,
          codes: outcome.audit.flatMap((a) => a.codes),
          observation: outcome.kind === "ok" ? outcome.observation : null,
          respondedModel: m.model,
          usage: m.usage,
          costUsd,
          latencyMs,
        });
      }
    }
  } finally {
    for (const p of input.photos) p.bytes.fill(0);
  }
  return { records, stoppedBy, spentUsd: input.budget.spentUsd(), calls };
}
