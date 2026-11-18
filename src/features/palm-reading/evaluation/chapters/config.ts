/**
 * Avaliação dos capítulos 6 e 7 com IA real — Fase 03F.2, Etapa A.
 *
 * Só TEXTO: as observações vêm da visão já validada na 03F.1 (Sonnet 5.5,
 * rodada 2) e de 2 cenários sintéticos. Nenhuma foto é lida ou reenviada.
 * Modelo de texto: o do produto (Haiku 5.5, decisão da 02F.1), nas mesmas
 * condições do endpoint (esforço médio, 2 tentativas, biblioteca como
 * reserva, sem fallback pago). Orçamento exclusivo, separado do comercial.
 */
import path from "node:path";

import { anthropicApiKey } from "../../../interpretation/ai/api-key";
import {
  DEFAULT_EFFORT,
  DEFAULT_MODEL,
} from "../../../interpretation/ai/config";
import { PALM_MAX_ATTEMPTS } from "../../chapters/generate";
import { isIgnoredReportDir, isOutside } from "../config";

type Env = Record<string, string | undefined>;

/** Fixo: a avaliação mede o modelo de texto do produto, não um escolhido por variável. */
export const CHAPTERS_EVAL_MODEL = DEFAULT_MODEL;
export const CHAPTERS_EVAL_CONDITIONS = {
  effort: DEFAULT_EFFORT,
  maxAttempts: PALM_MAX_ATTEMPTS,
  maxOutputTokens: 4000,
  timeoutMs: 60_000,
} as const;

/** Teto da Etapa A (parte dos R$ 5,00 aprovados para a 03F.2). */
export const CHAPTERS_EVAL_BUDGET_BRL = 1;
export const CHAPTERS_EVAL_DEFAULT_USD_BRL = 5.5;
export const CHAPTERS_EVAL_CONFIRM = "autorizo-capitulos-03f2-etapa-a";

/**
 * Revalidação direcionada (03F.2, Rev2): só os capítulos listados em
 * SIDERA_PALM_CHAPTERS_EVAL_ONLY ("foto-03:7,foto-05:7,foto-06:6"), com
 * confirmação própria e teto absoluto menor.
 */
export const CHAPTERS_TARGETED_CONFIRM = "autorizo-capitulos-03f2-etapa-a-rev2";
export const CHAPTERS_TARGETED_BUDGET_BRL = 0.5;

export type ChapterSelection = Map<string, ("maos" | "linhas")[]>;

/** null = todos os capítulos; Error = lista inválida. */
export function chaptersEvalOnly(env: Env): ChapterSelection | null | Error {
  const raw = env.SIDERA_PALM_CHAPTERS_EVAL_ONLY?.trim();
  if (!raw) return null;
  const out: ChapterSelection = new Map();
  for (const entry of raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)) {
    const m = entry.match(/^([a-z]+-\d{2}):(6|7)$/u);
    if (!m)
      return new Error(`Seleção inválida: "${entry}" (use caso:6 ou caso:7).`);
    const ch: "maos" | "linhas" = m[2] === "6" ? "maos" : "linhas";
    out.set(m[1], [...new Set([...(out.get(m[1]) ?? []), ch])]);
  }
  return out.size ? out : null;
}

export function chaptersEvalBudgetBrl(env: Env): number {
  const cap =
    chaptersEvalOnly(env) instanceof Map
      ? CHAPTERS_TARGETED_BUDGET_BRL
      : CHAPTERS_EVAL_BUDGET_BRL;
  const v = Number(env.SIDERA_PALM_CHAPTERS_EVAL_BUDGET_BRL);
  return Number.isFinite(v) && v > 0 ? Math.min(v, cap) : cap;
}

export function chaptersEvalUsdBrl(env: Env): number {
  const v = Number(env.SIDERA_AI_USD_BRL);
  return Number.isFinite(v) && v > 0 ? v : CHAPTERS_EVAL_DEFAULT_USD_BRL;
}

export type ChaptersEvalGate = {
  canPlan: boolean;
  canCall: boolean;
  reasons: string[];
  keyViaProxy: boolean;
  outDir: string;
};

/**
 * Planejar (grátis): pasta de saída em avaliacao-ia/ ou fora do repositório.
 * Chamar (pago): além disso SIDERA_PALM_CHAPTERS_EVAL_PAID=1, a frase de
 * confirmação, credencial no servidor e NODE_ENV ≠ production. Variáveis de
 * outras fases (02F.1, 03F.1, comerciais) não abrem esta avaliação.
 */
export function chaptersEvalGate(env: Env, repoRoot: string): ChaptersEvalGate {
  const reasons: string[] = [];
  const outDir =
    env.SIDERA_PALM_CHAPTERS_EVAL_OUT_DIR?.trim() ||
    path.join(repoRoot, "avaliacao-ia", "03f2-etapa-a");
  if (!isOutside(outDir, repoRoot) && !isIgnoredReportDir(outDir, repoRoot))
    reasons.push(
      "Relatórios só em avaliacao-ia/ (ignorada pelo Git) ou fora do repositório.",
    );
  const only = chaptersEvalOnly(env);
  if (only instanceof Error) reasons.push(only.message);
  const canPlan = reasons.length === 0;
  if (env.SIDERA_PALM_CHAPTERS_EVAL_PAID !== "1")
    reasons.push(
      "Sem autorização explícita para chamadas pagas (SIDERA_PALM_CHAPTERS_EVAL_PAID=1).",
    );
  // A autorização de uma avaliação não abre a outra.
  const confirm =
    only instanceof Map ? CHAPTERS_TARGETED_CONFIRM : CHAPTERS_EVAL_CONFIRM;
  if (env.SIDERA_PALM_CHAPTERS_EVAL_CONFIRM !== confirm)
    reasons.push(
      `Confirmação ausente (SIDERA_PALM_CHAPTERS_EVAL_CONFIRM=${confirm}).`,
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
  };
}

/**
 * Rascunhos reprovados (só avaliação, 03F.2): desligado por padrão. Liga com
 * SIDERA_PALM_CHAPTERS_EVAL_KEEP_REJECTED=1 e NUNCA em produção. O arquivo
 * fica em `restrito/` (pasta 700, arquivo 600), só com caso, capítulo,
 * tentativa, códigos e texto do modelo — sem pessoa, mão, foto ou
 * evidência — e é apagado na primeira sessão depois de expirar.
 */
export const REJECTED_DRAFTS_FILE = "restrito/rascunhos-reprovados.json";
export const REJECTED_DRAFTS_RETENTION_DAYS = 30;

export function keepRejectedDrafts(env: Env): boolean {
  return (
    env.SIDERA_PALM_CHAPTERS_EVAL_KEEP_REJECTED === "1" &&
    env.NODE_ENV !== "production"
  );
}
