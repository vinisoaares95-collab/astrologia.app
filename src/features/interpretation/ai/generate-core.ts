/**
 * Núcleo da geração de UM capítulo com IA (Fases 02F e 03E).
 *
 * Comum à astrologia e à leitura das mãos: requisição → provedor → JSON →
 * validação do domínio → (reparo determinístico na última tentativa) →
 * nova tentativa com correções objetivas. Nunca devolve texto que não
 * passou na validação; quem chama decide o conteúdo de reserva.
 */
import {
  AiProviderError,
  type AiProvider,
  type AiRequest,
  type AttemptMetrics,
} from "./contract";
import { estimateCostUsd } from "./pricing";
import { describePart, type AiValidationError } from "./validate";

/**
 * Instruções da nova tentativa: local legível + correção objetiva
 * (ex.: "Na seção 4, inclua o item referente à Lua (…) nos itemIds
 * utilizados ou remova essa referência.").
 */
export function correctionFeedback(errors: AiValidationError[]): string {
  const lines = [
    ...new Set(
      errors.map((e) => {
        const where = describePart(e.part);
        if (e.fix)
          return e.fix.startsWith(where) ? e.fix : `${where}: ${e.fix}`;
        if (e.code === "REPETITION")
          return `${where}: reescreva para não repetir (${e.message})`;
        return `${where}: ${e.message}`;
      }),
    ),
  ];
  return `A versão anterior foi reprovada pela revisão automática. Corrija estes pontos e mantenha o restante:\n${lines
    .slice(0, 8)
    .map((l) => `- ${l}`)
    .join("\n")}`;
}

export type DraftValidation = { ok: boolean; errors: AiValidationError[] };

export type DraftOutcome<D> =
  { ok: true; draft: D } | { ok: false; reason: string };

export async function generateValidatedDraft<D, C extends string>(input: {
  chapter: C;
  request: AiRequest;
  provider: AiProvider;
  validate: (draft: unknown) => DraftValidation;
  /** Correção determinística (só na última tentativa), revalidada. */
  repair?: (
    draft: unknown,
    errors: AiValidationError[],
  ) => { draft: unknown; repairs: string[] } | null;
  maxAttempts: number;
  now: () => number;
  metrics: AttemptMetrics<C>[];
}): Promise<DraftOutcome<D>> {
  const { chapter, request, provider, validate, metrics } = input;
  let lastReason = "";
  // Após uma reprovação, a nova tentativa recebe os problemas encontrados.
  let feedback = "";

  for (let attempt = 1; attempt <= input.maxAttempts; attempt++) {
    const started = input.now();
    const record = (
      m: Omit<AttemptMetrics<C>, "chapter" | "attempt" | "latencyMs">,
    ) =>
      metrics.push({
        chapter,
        attempt,
        latencyMs: Math.round(input.now() - started),
        ...m,
      } as AttemptMetrics<C>);

    let response;
    try {
      response = await provider.generate(
        feedback
          ? { ...request, user: `${request.user}\n\n${feedback}` }
          : request,
      );
    } catch (error) {
      const err =
        error instanceof AiProviderError
          ? error
          : new AiProviderError("unknown", String(error));
      record({
        requestedModel: provider.model,
        model: provider.model,
        usage: null,
        costUsd: err.chargedUsd,
        outcome: `error:${err.kind}`,
        errors: [err.message],
      });
      lastReason = `Falha do provedor (${err.kind}).`;
      if (!err.retryable) break;
      continue;
    }

    const base = {
      requestedModel: provider.model,
      model: response.model,
      usage: response.usage,
      costUsd: estimateCostUsd(response.model, response.usage),
    };
    if (response.stopReason === "refusal") {
      record({ ...base, outcome: "refusal", errors: [] });
      lastReason = "O modelo recusou a solicitação.";
      continue;
    }
    if (response.stopReason === "max_tokens") {
      record({ ...base, outcome: "truncated", errors: [] });
      lastReason = "Resposta incompleta (limite de tokens).";
      continue;
    }

    let draft: unknown;
    try {
      draft = JSON.parse(response.text);
    } catch {
      record({ ...base, outcome: "invalid_json", errors: [] });
      lastReason = "Resposta fora do formato JSON.";
      continue;
    }

    let result = validate(draft);
    let repairs: string[] | undefined;
    // Última tentativa: correções determinísticas permitidas pelo domínio
    // (e SÓ elas); o rascunho corrigido passa de novo pela validação.
    if (!result.ok && attempt === input.maxAttempts && input.repair) {
      const repaired = input.repair(draft, result.errors);
      if (repaired) {
        const again = validate(repaired.draft);
        if (again.ok) {
          draft = repaired.draft;
          result = again;
          repairs = repaired.repairs;
        }
      }
    }
    if (!result.ok) {
      record({
        ...base,
        outcome: "validation_failed",
        errors: result.errors.map((e) => `${e.code}: ${e.message}`),
      });
      lastReason = `Reprovado na validação (${[...new Set(result.errors.map((e) => e.code))].join(", ")}).`;
      feedback = correctionFeedback(result.errors);
      continue;
    }

    record({ ...base, outcome: "ok", errors: [], ...(repairs && { repairs }) });
    return { ok: true, draft: draft as D };
  }
  return { ok: false, reason: lastReason || "Geração não concluída." };
}
