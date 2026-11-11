/**
 * Sessão da avaliação visual (Fase 03F.1): recebimento → plano financeiro →
 * (opcional) execução → relatórios.
 *
 * - "plan" (grátis): prepara as fotos em memória, calcula custo esperado e
 *   pior caso e grava só o plano. Nenhuma chamada.
 * - "run" (pago): exige o portão aberto (config.ts). Recusa ANTES de chamar
 *   se o pior caso não couber no orçamento; usa um orçamento exclusivo, com
 *   teto igual ao pior caso planejado (nunca acima do orçamento).
 *
 * Grava em pasta ignorada pelo Git ou fora do repositório. Nenhum relatório
 * contém imagem, nome de arquivo, caminho, credencial ou prompt.
 */
import { randomInt } from "node:crypto";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { anthropicApiKey } from "../../interpretation/ai/api-key";
import { createBudget } from "../../interpretation/ai/budget";
import { FEATURE_VALUES } from "../analysis/contract";
import { createAnthropicVisionProvider } from "../vision/anthropic-provider";
import type { VisionProvider } from "../vision/contract";
import {
  EVAL_VISION_CONDITIONS,
  EVAL_VISION_MODELS,
  evalBudgetBrl,
  evalMaxAttempts,
  evalUsdBrl,
  isIgnoredReportDir,
  isOutside,
  visionEvalGate,
} from "./config";
import { planEvaluation, type EvalPlan } from "./estimate";
import { intakePhotos, type IntakeResult, type SharpLike } from "./intake";
import {
  blindKey,
  renderPlan,
  renderReferenceCsv,
  renderReviewGuide,
  renderReviewSheet,
  renderTechnicalReport,
} from "./report";
import { runVisionEvaluation, type EvalRun } from "./run";

type Env = Record<string, string | undefined>;

export type SessionResult =
  | { kind: "blocked"; reasons: string[] }
  | {
      kind: "intake_failed";
      errors: string[];
      rejected: IntakeResult["rejected"];
    }
  | { kind: "over_budget"; plan: EvalPlan; outDir: string }
  | {
      kind: "planned";
      plan: EvalPlan;
      outDir: string;
      rejected: IntakeResult["rejected"];
    }
  | {
      kind: "ran";
      plan: EvalPlan;
      run: EvalRun;
      outDir: string;
      rejected: IntakeResult["rejected"];
    };

/** Destino dos relatórios: avaliacao-ia/ (ignorada) ou fora do repositório. */
export function resolveOutDir(
  env: Env,
  repoRoot: string,
  stamp: string,
): string {
  const custom = env.SIDERA_PALM_EVAL_OUT_DIR?.trim();
  const dir = custom || path.join(repoRoot, "avaliacao-ia", `03f-${stamp}`);
  if (!isOutside(dir, repoRoot) && !isIgnoredReportDir(dir, repoRoot))
    throw new Error(
      "Relatórios só em avaliacao-ia/ (ignorada pelo Git) ou fora do repositório.",
    );
  return dir;
}

async function write(dir: string, file: string, content: string) {
  await mkdir(path.dirname(path.join(dir, file)), {
    recursive: true,
    mode: 0o700,
  });
  await writeFile(path.join(dir, file), content, { mode: 0o600 });
}

async function writeIfAbsent(dir: string, file: string, content: string) {
  try {
    await access(path.join(dir, file));
  } catch {
    await write(dir, file, content);
  }
}

export function realProviderFor(env: Env) {
  const gate = visionEvalGate(env, process.cwd());
  return (model: string): VisionProvider =>
    createAnthropicVisionProvider({
      model,
      effort: EVAL_VISION_CONDITIONS.effort,
      // Com a chave como segredo de rede, o proxy a injeta no cabeçalho.
      apiKey: gate.keyViaProxy ? "injetada-pelo-proxy" : anthropicApiKey(env),
    });
}

export async function runEvaluationSession(input: {
  mode: "plan" | "run";
  env: Env;
  repoRoot: string;
  /** Padrão: provedor real (só usado com o portão aberto). */
  providerFor?: (model: string) => VisionProvider;
  sharp?: SharpLike;
  coin?: () => boolean;
  now?: () => number;
  stamp?: string;
}): Promise<SessionResult> {
  const gate = visionEvalGate(input.env, input.repoRoot);
  if (!gate.canPlan) return { kind: "blocked", reasons: gate.reasons };
  if (input.mode === "run" && !gate.canCall)
    return { kind: "blocked", reasons: gate.reasons };

  const intake = await intakePhotos(gate.photosDir!, { sharp: input.sharp });
  if (intake.errors.length || intake.photos.length === 0)
    return {
      kind: "intake_failed",
      errors: intake.errors.length
        ? intake.errors
        : ["Nenhuma foto utilizável."],
      rejected: intake.rejected,
    };

  const maxAttempts = evalMaxAttempts(input.env);
  const plan = planEvaluation({
    photos: intake.photos,
    models: EVAL_VISION_MODELS,
    maxAttempts,
    usdBrl: evalUsdBrl(input.env),
    budgetBrl: evalBudgetBrl(input.env),
  });
  const stamp =
    input.stamp ?? new Date().toISOString().replace(/[:.]/gu, "-").slice(0, 19);
  const outDir = resolveOutDir(input.env, input.repoRoot, stamp);
  await write(
    outDir,
    "plano.md",
    renderPlan(plan) +
      (intake.rejected.length
        ? `\n## Fotos recusadas (fora do plano)\n\n${intake.rejected.map((r) => `- ${r.id}: ${r.reason}`).join("\n")}\n`
        : ""),
  );
  // A referência do revisor sai já no plano (sem nada dos modelos), para
  // ser preenchida ANTES da execução; a execução nunca a sobrescreve.
  await writeIfAbsent(
    outDir,
    "revisao/referencia.csv",
    renderReferenceCsv(
      intake.photos.map((p) => p.id),
      FEATURE_VALUES,
    ),
  );

  const discard = () => intake.photos.forEach((p) => p.bytes.fill(0));
  if (!plan.withinBudget) {
    discard();
    return { kind: "over_budget", plan, outDir };
  }
  if (input.mode === "plan") {
    discard();
    return { kind: "planned", plan, outDir, rejected: intake.rejected };
  }

  const run = await runVisionEvaluation({
    photos: intake.photos.map(({ id, hand, bytes }) => ({ id, hand, bytes })),
    models: EVAL_VISION_MODELS,
    providerFor: input.providerFor ?? realProviderFor(input.env),
    budget: createBudget(plan.safeCapUsd),
    maxAttempts,
    now: input.now,
  });
  discard();

  const key = blindKey(run, input.coin ?? (() => randomInt(2) === 0));
  await write(outDir, "revisao/ficha.csv", renderReviewSheet(run, key));
  await write(
    outDir,
    "revisao/guia.md",
    renderReviewGuide(key, FEATURE_VALUES),
  );
  await write(
    outDir,
    "restrito/chave.json",
    JSON.stringify(key, null, 2) + "\n",
  );
  await write(
    outDir,
    "restrito/resultados.json",
    JSON.stringify(run, null, 2) + "\n",
  );
  await write(
    outDir,
    "restrito/relatorio-tecnico.md",
    renderTechnicalReport(run, plan, key),
  );
  return { kind: "ran", plan, run, outDir, rejected: intake.rejected };
}
