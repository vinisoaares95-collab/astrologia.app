/**
 * Execução da avaliação visual (Fase 03F.1).
 *
 * Só: foto preparada → modelo visual → observação estruturada → validador
 * 03C → auditoria. Nenhum capítulo é redigido. Reaproveita o orquestrador do
 * produto (`analyzePalmImage`: mesmo prompt, schema, tentativas e validador)
 * e o adaptador visual; acrescenta medição por chamada e um orçamento
 * EXCLUSIVO da avaliação:
 * - verificação prévia: cada unidade (foto × modelo) só começa se o saldo
 *   cobre o pior caso de TODAS as suas tentativas;
 * - reserva por chamada (`withVisionBudget`);
 * - interrupção: ao faltar saldo, a avaliação para e o restante fica
 *   registrado como "não executado".
 *
 * Nada aqui guarda imagem, nome de arquivo ou credencial: as fotos entram
 * com um identificador opaco (foto-01…) e os bytes são zerados.
 */
import type { BudgetController } from "../../interpretation/ai/budget";
import {
  AiProviderError,
  type AiErrorKind,
  type AiUsage,
} from "../../interpretation/ai/contract";
import {
  estimateCostUsd,
  MODEL_PRICES,
  type ModelPrice,
} from "../../interpretation/ai/pricing";
import { FEATURE_IDS, type FeatureId } from "../analysis/contract";
import type { ReadingStatus } from "../analysis/validate-observation";
import type { PalmHand } from "../consent";
import { analyzePalmImage, type AttemptAudit } from "../vision/analyze";
import { withVisionBudget } from "../vision/budget";
import type { VisionProvider } from "../vision/contract";
import { EVAL_VISION_CONDITIONS } from "./config";
import { worstCallUsd } from "./estimate";

export type EvalPhoto = {
  /** Identificador opaco (foto-01…); nunca o nome do arquivo. */
  id: string;
  hand: PalmHand;
  /** JPEG preparado; zerado ao fim da avaliação. */
  bytes: Uint8Array;
};

export type CallRecord = {
  attempt: number;
  outcome: AttemptAudit["outcome"];
  /** Códigos do validador (reprovações e rebaixamentos), por característica. */
  notes: { code: string; feature: string | null }[];
  /** Modelo que efetivamente respondeu (null: sem resposta). */
  respondedModel: string | null;
  usage: AiUsage | null;
  costUsd: number | null;
  latencyMs: number;
};

export type FeatureResult = {
  visibility: "clear" | "partial" | "not_visible";
  value: string | null;
  /** Evidência visual descrita pelo modelo (pt-BR, sem dados pessoais). */
  evidence: string | null;
  reason: string | null;
  /** Rebaixado pelo validador (o modelo disse "visível", o sistema não aceitou). */
  downgradedBy: string | null;
};

export type UnitResult = {
  photoId: string;
  model: string;
  status: "ok" | "refused" | "invalid_output" | "provider_error" | "not_run";
  error: AiErrorKind | null;
  /** Por que não executou (teto). */
  notRunReason: string | null;
  calls: CallRecord[];
  attempts: number;
  retried: boolean;
  costUsd: number;
  latencyMs: number;
  final: {
    status: ReadingStatus;
    quality: string;
    issues: string[];
    features: Record<FeatureId, FeatureResult>;
  } | null;
};

export type EvalRun = {
  startedAt: string;
  models: string[];
  maxAttempts: number;
  budgetUsd: number;
  spentUsd: number;
  stoppedByBudget: boolean;
  units: UnitResult[];
};

/** Mede cada chamada ao provedor (latência, modelo que respondeu, custo). */
function instrument(
  provider: VisionProvider,
  now: () => number,
  prices: Record<string, ModelPrice>,
) {
  const log: Omit<CallRecord, "attempt" | "outcome" | "notes">[] = [];
  const wrapped: VisionProvider = {
    id: provider.id,
    model: provider.model,
    async analyze(request) {
      const t0 = now();
      try {
        const r = await provider.analyze(request);
        log.push({
          respondedModel: r.model,
          usage: r.usage,
          costUsd: estimateCostUsd(r.model, r.usage, prices),
          latencyMs: now() - t0,
        });
        return r;
      } catch (error) {
        const charged =
          error instanceof AiProviderError ? (error.chargedUsd ?? 0) : 0;
        log.push({
          respondedModel: null,
          usage: null,
          costUsd: charged,
          latencyMs: now() - t0,
        });
        throw error;
      }
    },
  };
  return { wrapped, log };
}

function finalOf(
  observation: Extract<
    Awaited<ReturnType<typeof analyzePalmImage>>,
    { kind: "ok" }
  >["observation"],
  okNotes: CallRecord["notes"],
): UnitResult["final"] {
  const features = {} as Record<FeatureId, FeatureResult>;
  for (const id of FEATURE_IDS) {
    const f = observation.features[id];
    const downgrade = okNotes.find((n) => n.feature === id);
    features[id] =
      f.visibility === "not_visible"
        ? {
            visibility: "not_visible",
            value: null,
            evidence: null,
            reason: f.reason,
            downgradedBy: downgrade?.code ?? null,
          }
        : {
            visibility: f.visibility,
            value: String(f.value),
            evidence: f.evidence,
            reason: null,
            downgradedBy: null,
          };
  }
  return {
    status: observation.status,
    quality: observation.quality,
    issues: [...observation.issues],
    features,
  };
}

export async function runVisionEvaluation(input: {
  photos: EvalPhoto[];
  models: readonly string[];
  /** Cria o provedor de cada modelo (real só com o portão aberto). */
  providerFor: (model: string) => VisionProvider;
  budget: BudgetController;
  maxAttempts?: number;
  now?: () => number;
  prices?: Record<string, ModelPrice>;
  /** Ordem dos modelos por foto (padrão: alternada, para não favorecer um). */
  order?: (photoIndex: number) => readonly string[];
}): Promise<EvalRun> {
  const now = input.now ?? (() => performance.now());
  const prices = input.prices ?? MODEL_PRICES;
  const maxAttempts = Math.max(
    1,
    Math.min(input.maxAttempts ?? EVAL_VISION_CONDITIONS.maxAttempts, 2),
  );
  const order =
    input.order ??
    ((i: number) => (i % 2 === 0 ? input.models : [...input.models].reverse()));
  const providers = new Map(
    input.models.map((m) => [
      m,
      withVisionBudget(input.providerFor(m), input.budget, prices),
    ]),
  );
  const run: EvalRun = {
    startedAt: new Date().toISOString(),
    models: [...input.models],
    maxAttempts,
    budgetUsd: input.budget.limitUsd,
    spentUsd: 0,
    stoppedByBudget: false,
    units: [],
  };

  try {
    for (const [index, photo] of input.photos.entries()) {
      for (const model of order(index)) {
        const notRun = (reason: string): UnitResult => ({
          photoId: photo.id,
          model,
          status: "not_run",
          error: null,
          notRunReason: reason,
          calls: [],
          attempts: 0,
          retried: false,
          costUsd: 0,
          latencyMs: 0,
          final: null,
        });
        if (run.stoppedByBudget) {
          run.units.push(notRun("Avaliação interrompida pelo teto de gasto."));
          continue;
        }
        // Verificação prévia: o saldo cobre todas as tentativas desta unidade?
        const unitWorst =
          maxAttempts *
          Math.max(
            worstCallUsd(model, "right", prices),
            worstCallUsd(model, "left", prices),
          );
        const free =
          input.budget.limitUsd -
          input.budget.spentUsd() -
          input.budget.reservedUsd();
        if (unitWorst > free) {
          run.stoppedByBudget = true;
          run.units.push(notRun("Saldo insuficiente para o pior caso."));
          continue;
        }

        const { wrapped, log } = instrument(providers.get(model)!, now, prices);
        const t0 = now();
        const outcome = await analyzePalmImage({
          // Cópia: o orquestrador zera os bytes que recebe.
          bytes: photo.bytes.slice(),
          hand: photo.hand,
          provider: wrapped,
          maxAttempts,
        });
        const calls: CallRecord[] = outcome.audit.map((a, i) => ({
          attempt: a.attempt,
          outcome: a.outcome,
          notes: a.notes,
          respondedModel: log[i]?.respondedModel ?? null,
          usage: log[i]?.usage ?? a.usage,
          costUsd: log[i]?.costUsd ?? null,
          latencyMs: log[i]?.latencyMs ?? 0,
        }));
        const budgetHit =
          outcome.kind === "provider_error" && outcome.error === "budget";
        if (budgetHit) run.stoppedByBudget = true;
        run.units.push({
          photoId: photo.id,
          model,
          status: outcome.kind,
          error: outcome.kind === "provider_error" ? outcome.error : null,
          notRunReason: null,
          calls,
          attempts: calls.length,
          retried: calls.length > 1,
          costUsd: calls.reduce((n, c) => n + (c.costUsd ?? 0), 0),
          latencyMs: now() - t0,
          final:
            outcome.kind === "ok"
              ? finalOf(outcome.observation, calls[calls.length - 1].notes)
              : null,
        });
      }
    }
  } finally {
    for (const p of input.photos) p.bytes.fill(0);
    run.spentUsd = input.budget.spentUsd();
  }
  return run;
}
