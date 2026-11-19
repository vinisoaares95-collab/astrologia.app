/**
 * Sessão da Etapa B (03F.2): plano (grátis) → execução (paga) → apuração.
 *
 * - plan: confere o manifesto e a existência dos 3 arquivos (sem abri-los) e
 *   calcula o pior caso garantido pelo código e o custo esperado.
 * - run: exige o portão aberto; lê e prepara cada foto EM MEMÓRIA, como o
 *   aparelho (nenhuma cópia preparada é gravada), e roda o fluxo do endpoint
 *   com os modelos padrão do produto. Uma única execução, sem repetição.
 * - score: compara a ficha preenchida com os critérios da Etapa B.
 */
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createAnthropicProvider } from "../../../interpretation/ai/anthropic-provider";
import { anthropicApiKey } from "../../../interpretation/ai/api-key";
import { createBudget } from "../../../interpretation/ai/budget";
import type { AiProvider } from "../../../interpretation/ai/contract";
import type { PalmHand } from "../../consent";
import {
  PALM_REPORT_BUDGET_USD,
  readPalmAnalysisConfig,
} from "../../server/config";
import { createAnthropicVisionProvider } from "../../vision/anthropic-provider";
import type { VisionProvider } from "../../vision/contract";
import { prepareEvalPhoto } from "../intake";
import { E2E_CASES, e2eBudgetBrl, e2eGate, e2eUsdBrl } from "./config";
import {
  E2E_GUIDE,
  parseCsv,
  renderE2EReview,
  renderE2EScore,
  renderE2ESheet,
  renderE2ETechnical,
  scoreE2E,
} from "./report";
import { e2eWorstUsd, runE2EEvaluation, type E2ERun } from "./run";

type Env = Record<string, string | undefined>;

/**
 * Custo esperado por relatório, a partir do medido (não é teto): visão do
 * Sonnet 5.5 na 03F.1, rodada 2 (US$ 0,1021 / 8 fotos), e capítulo do Haiku
 * 5.5 na Etapa A (Rev1: US$ 0,0092 / 11 capítulos).
 */
export const EXPECTED_VISION_USD = 0.0128;
export const EXPECTED_CHAPTER_USD = 0.0009;
/** Capítulos com conteúdo esperados, pela observação da rodada 2. */
const EXPECTED_CHAPTERS: Record<string, number> = {
  "foto-05": 2,
  "foto-01": 1,
  "foto-04": 0,
};

async function write(dir: string, file: string, content: string) {
  await mkdir(path.dirname(path.join(dir, file)), {
    recursive: true,
    mode: 0o700,
  });
  await writeFile(path.join(dir, file), content, { mode: 0o600 });
}
async function exists(p: string) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

type Located = { id: string; file: string; hand: PalmHand };

/** Arquivo e mão de cada caso, pelo mapa e pelo manifesto (sem abrir fotos). */
async function locate(
  photosDir: string,
): Promise<{ ok: true; cases: Located[] } | { ok: false; reasons: string[] }> {
  let map: Record<string, { arquivo: string }>;
  let manifest: { arquivo: string; mao: string }[];
  try {
    map = JSON.parse(
      await readFile(path.join(photosDir, "mapa-fotos.json"), "utf8"),
    );
    manifest = JSON.parse(
      await readFile(path.join(photosDir, "manifesto.json"), "utf8"),
    );
  } catch {
    return {
      ok: false,
      reasons: ["Manifesto ou mapa das fotos ausente ou ilegível."],
    };
  }
  const reasons: string[] = [];
  const cases: Located[] = [];
  for (const c of E2E_CASES) {
    const file = map[c.id]?.arquivo;
    const entry = manifest.find((e) => e.arquivo === file);
    if (!file || !entry) {
      reasons.push(`${c.id}: sem entrada no mapa ou no manifesto.`);
      continue;
    }
    if (!(await exists(path.join(photosDir, file)))) {
      reasons.push(`${c.id}: arquivo ausente.`);
      continue;
    }
    cases.push({
      id: c.id,
      file,
      hand: entry.mao === "direita" ? "right" : "left",
    });
  }
  return reasons.length ? { ok: false, reasons } : { ok: true, cases };
}

export function planE2E(cases: Located[], usdBrl: number, budgetBrl: number) {
  const perCase = cases.map((c) => ({
    id: c.id,
    hand: c.hand,
    expectedUsd:
      EXPECTED_VISION_USD +
      (EXPECTED_CHAPTERS[c.id] ?? 2) * EXPECTED_CHAPTER_USD,
    worstUsd: PALM_REPORT_BUDGET_USD,
  }));
  const worstUsd = e2eWorstUsd(cases.length);
  const budgetUsd = budgetBrl / usdBrl;
  return {
    perCase,
    expectedUsd: perCase.reduce((n, c) => n + c.expectedUsd, 0),
    worstUsd,
    usdBrl,
    budgetBrl,
    budgetUsd,
    withinBudget: worstUsd <= budgetUsd,
    capUsd: Math.min(worstUsd, budgetUsd),
  };
}

export function renderE2EPlan(p: ReturnType<typeof planE2E>): string {
  const u = (n: number) => `US$ ${n.toFixed(4)}`;
  const brl = (n: number) => `R$ ${(n * p.usdBrl).toFixed(2)}`;
  const cfg = readPalmAnalysisConfig({ SIDERA_PALM_ANALYSIS_ENABLED: "1" });
  return [
    "# Plano — ponta a ponta (03F.2, Etapa B)",
    "",
    `Visão: ${cfg.model} · texto: ${cfg.textModel} · até 2 tentativas de visão e 2 por capítulo · câmbio R$ ${p.usdBrl.toFixed(2)}`,
    `Teto por relatório (código do produto): ${u(PALM_REPORT_BUDGET_USD)} · orçamento: R$ ${p.budgetBrl.toFixed(2)} (${u(p.budgetUsd)}) · teto da execução: ${u(p.capUsd)}`,
    "",
    "| Caso | Mão | Esperado | Pior caso (teto) |",
    "| --- | --- | --- | --- |",
    ...p.perCase.map(
      (c) =>
        `| ${c.id} | ${c.hand === "right" ? "direita" : "esquerda"} | ${u(c.expectedUsd)} | ${u(c.worstUsd)} |`,
    ),
    `| **Total** | | **${u(p.expectedUsd)} (${brl(p.expectedUsd)})** | **${u(p.worstUsd)} (${brl(p.worstUsd)})** |`,
    "",
    p.withinBudget
      ? "Cabe no orçamento no pior caso."
      : "**NÃO cabe no orçamento no pior caso: nada será chamado.**",
    "",
    "Nenhuma foto foi aberta para este plano (só o manifesto e a existência dos arquivos).",
    "",
  ].join("\n");
}

export type E2ESessionResult =
  | { kind: "blocked"; reasons: string[] }
  | { kind: "no_input"; reasons: string[] }
  | {
      kind: "planned" | "over_budget";
      plan: ReturnType<typeof planE2E>;
      outDir: string;
    }
  | { kind: "ran"; run: E2ERun; outDir: string }
  | { kind: "already_ran"; outDir: string }
  | { kind: "scored"; outDir: string };

export async function runE2ESession(input: {
  mode: "plan" | "run" | "score";
  env: Env;
  repoRoot: string;
  /** Só testes: provedores simulados com preço. */
  providers?: { vision: VisionProvider; text: AiProvider };
}): Promise<E2ESessionResult> {
  const gate = e2eGate(input.env, input.repoRoot);
  if (!gate.canPlan) return { kind: "blocked", reasons: gate.reasons };
  if (input.mode === "run" && !gate.canCall)
    return { kind: "blocked", reasons: gate.reasons };
  const outDir = gate.outDir;
  const results = path.join(outDir, "restrito/resultados.json");

  if (input.mode === "score") {
    const run = JSON.parse(await readFile(results, "utf8")) as E2ERun;
    const sheet = parseCsv(
      await readFile(
        path.join(outDir, "revisao/ficha-ponta-a-ponta.csv"),
        "utf8",
      ),
    );
    await write(
      outDir,
      "restrito/apuracao.md",
      renderE2EScore(scoreE2E(sheet, run)),
    );
    return { kind: "scored", outDir };
  }

  const located = await locate(gate.photosDir!);
  if (!located.ok) return { kind: "no_input", reasons: located.reasons };
  const usdBrl = e2eUsdBrl(input.env);
  const plan = planE2E(located.cases, usdBrl, e2eBudgetBrl(input.env));
  await write(outDir, "plano.md", renderE2EPlan(plan));
  if (!plan.withinBudget) return { kind: "over_budget", plan, outDir };
  if (input.mode === "plan") return { kind: "planned", plan, outDir };
  // Uma única execução: não sobrescreve nem repete.
  if (await exists(results)) return { kind: "already_ran", outDir };

  const photos = [];
  for (const c of located.cases) {
    const original = new Uint8Array(
      await readFile(path.join(gate.photosDir!, c.file)),
    );
    const prepared = await prepareEvalPhoto(original);
    original.fill(0);
    if (!prepared.ok)
      return { kind: "no_input", reasons: [`${c.id}: ${prepared.reason}`] };
    photos.push({ id: c.id, hand: c.hand, bytes: prepared.photo.bytes });
  }

  const cfg = readPalmAnalysisConfig({ SIDERA_PALM_ANALYSIS_ENABLED: "1" });
  const apiKey = gate.keyViaProxy
    ? "injetada-pelo-proxy"
    : anthropicApiKey(input.env);
  const providers = input.providers ?? {
    vision: createAnthropicVisionProvider({
      model: cfg.model,
      effort: cfg.effort,
      apiKey,
    }),
    text: createAnthropicProvider({
      model: cfg.textModel,
      effort: cfg.textEffort,
      apiKey,
    }),
  };
  const run = await runE2EEvaluation({
    photos,
    vision: providers.vision,
    text: providers.text,
    budget: createBudget(plan.capUsd),
  });
  await write(
    outDir,
    "restrito/resultados.json",
    JSON.stringify(run, null, 2) + "\n",
  );
  await write(
    outDir,
    "restrito/relatorio-tecnico.md",
    renderE2ETechnical(run, usdBrl),
  );
  await write(outDir, "revisao/relatorios.md", renderE2EReview(run));
  await write(outDir, "revisao/ficha-ponta-a-ponta.csv", renderE2ESheet(run));
  await write(outDir, "revisao/guia.md", E2E_GUIDE);
  return { kind: "ran", run, outDir };
}
