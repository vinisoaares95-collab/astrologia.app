/**
 * Avaliação ponta a ponta da leitura das mãos — Fase 03F.2, Etapa B.
 *
 * Três relatórios pelo MESMO fluxo do endpoint (`handleConsent` →
 * `handleAnalysis`): preparação da foto como no aparelho, visão (Sonnet 5.5),
 * capítulos 6 e 7 (Haiku 5.5), biblioteca como reserva, teto por relatório e
 * teto do processo do produto. Os modelos são os padrões do produto, sem
 * troca por variável.
 *
 * Bloqueada por padrão. Variáveis próprias: as de outras fases (03F.1,
 * Etapa A, endpoint comercial) não abrem esta avaliação.
 */
import path from "node:path";

import { anthropicApiKey } from "../../../interpretation/ai/api-key";
import { isIgnoredReportDir, isOutside } from "../config";

type Env = Record<string, string | undefined>;

/**
 * Cenários aprovados para a Etapa B (fotos já recebidas na 03F.1, com
 * autorização para novo envio). O tipo vem da observação da rodada 2 e é só
 * uma expectativa: a execução real pode observar outra coisa.
 */
export const E2E_CASES = [
  { id: "foto-05", expected: "boa cobertura de características" },
  { id: "foto-01", expected: "poucas características classificáveis" },
  { id: "foto-04", expected: "imagem insuficiente para os dois capítulos" },
] as const;

/** Teto proposto (ainda não autorizado); uma variável só pode baixá-lo. */
export const E2E_BUDGET_BRL = 3;
export const E2E_DEFAULT_USD_BRL = 5.5;
export const E2E_CONFIRM = "autorizo-ponta-a-ponta-03f2-etapa-b";

export function e2eUsdBrl(env: Env): number {
  const v = Number(env.SIDERA_AI_USD_BRL);
  return Number.isFinite(v) && v > 0 ? v : E2E_DEFAULT_USD_BRL;
}

export function e2eBudgetBrl(env: Env): number {
  const v = Number(env.SIDERA_PALM_E2E_EVAL_BUDGET_BRL);
  return Number.isFinite(v) && v > 0
    ? Math.min(v, E2E_BUDGET_BRL)
    : E2E_BUDGET_BRL;
}

export type E2EGate = {
  canPlan: boolean;
  canCall: boolean;
  reasons: string[];
  keyViaProxy: boolean;
  outDir: string;
  photosDir: string | null;
};

/**
 * Planejar (grátis, nenhuma foto é lida): saída em avaliacao-ia/ ou fora do
 * repositório; pasta das fotos fora do repositório. Chamar (pago): além
 * disso SIDERA_PALM_E2E_EVAL_PAID=1, a frase de confirmação, credencial no
 * servidor e NODE_ENV ≠ production.
 */
export function e2eGate(env: Env, repoRoot: string): E2EGate {
  const reasons: string[] = [];
  const outDir =
    env.SIDERA_PALM_E2E_EVAL_OUT_DIR?.trim() ||
    path.join(repoRoot, "avaliacao-ia", "03f2-etapa-b");
  if (!isOutside(outDir, repoRoot) && !isIgnoredReportDir(outDir, repoRoot))
    reasons.push(
      "Relatórios só em avaliacao-ia/ (ignorada pelo Git) ou fora do repositório.",
    );
  const photosDir = env.SIDERA_PALM_EVAL_DIR?.trim() || null;
  if (!photosDir)
    reasons.push("Pasta das fotos ausente (SIDERA_PALM_EVAL_DIR).");
  else if (!isOutside(photosDir, repoRoot))
    reasons.push("As fotos precisam ficar fora do repositório.");
  const canPlan = reasons.length === 0;
  if (env.SIDERA_PALM_E2E_EVAL_PAID !== "1")
    reasons.push(
      "Sem autorização explícita para chamadas pagas (SIDERA_PALM_E2E_EVAL_PAID=1).",
    );
  if (env.SIDERA_PALM_E2E_EVAL_CONFIRM !== E2E_CONFIRM)
    reasons.push(
      `Confirmação ausente (SIDERA_PALM_E2E_EVAL_CONFIRM=${E2E_CONFIRM}).`,
    );
  const keyViaProxy = env.SIDERA_AI_KEY_VIA_PROXY === "1";
  if (!anthropicApiKey(env) && !keyViaProxy)
    reasons.push(
      "Credencial ausente (SIDERA_ANTHROPIC_API_KEY no servidor ou SIDERA_AI_KEY_VIA_PROXY=1).",
    );
  if (env.NODE_ENV === "production")
    reasons.push("A avaliação não roda em produção.");
  return {
    canPlan,
    canCall: reasons.length === 0,
    reasons,
    keyViaProxy,
    outDir,
    photosDir,
  };
}
