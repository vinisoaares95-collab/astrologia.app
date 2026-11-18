/**
 * Sessão da Etapa A (03F.2): plano (grátis) → execução (paga) → apuração.
 *
 * - plan: monta `entrada/observacoes.json` uma única vez, a partir dos
 *   resultados da rodada 2 da 03F.1 (só leitura) e do manifesto das fotos
 *   (só a mão de cada foto); revalida tudo; calcula o pior caso. Nenhuma
 *   chamada, nenhuma imagem lida.
 * - run: exige o portão aberto; recusa antes de chamar se o pior caso não
 *   couber; usa orçamento exclusivo com teto = pior caso planejado.
 * - score: compara a ficha preenchida com os critérios aprovados.
 */
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createAnthropicProvider } from "../../../interpretation/ai/anthropic-provider";
import { anthropicApiKey } from "../../../interpretation/ai/api-key";
import { createBudget } from "../../../interpretation/ai/budget";
import type { AiProvider } from "../../../interpretation/ai/contract";
import {
  estimateCostUsd,
  MODEL_PRICES,
} from "../../../interpretation/ai/pricing";
import { buildPalmInterpretation } from "../../analysis/engine";
import { buildPalmChapterRequest } from "../../chapters/prompt";
import type { PalmHand } from "../../consent";
import { buildSnapshot, checkSnapshot, type Snapshot } from "./cases";
import {
  CHAPTERS_EVAL_CONDITIONS,
  CHAPTERS_EVAL_MODEL,
  chaptersEvalBudgetBrl,
  chaptersEvalGate,
  chaptersEvalUsdBrl,
} from "./config";
import {
  CHAPTER_GUIDE,
  parseCsv,
  renderChapterScore,
  renderChapterSheet,
  renderChaptersTechnical,
  renderReviewDocument,
  scoreChapterSheet,
} from "./report";
import { caseWorstUsd, runChaptersEvaluation, type ChaptersRun } from "./run";

type Env = Record<string, string | undefined>;

/** Custo real da visão por foto no Sonnet 5.5 (03F.1, rodada 2: US$ 0,1021 / 8). */
export const VISION_USD_PER_PHOTO_03F1 = 0.0128;
/** Saída típica de um capítulo (hipótese; a execução mede o real). */
const TYPICAL_CHAPTER_OUTPUT_TOKENS = 900;

export const SNAPSHOT_FILE = "entrada/observacoes.json";

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

export function planChapters(
  snapshot: Snapshot,
  usdBrl: number,
  budgetBrl: number,
) {
  const price = MODEL_PRICES[CHAPTERS_EVAL_MODEL];
  const perCase = snapshot.cases.map((c) => {
    const report = buildPalmInterpretation(c.observation);
    const calls = report.chapters.filter((ch) => ch.items.length > 0);
    const expected = calls.reduce((n, ch) => {
      const r = buildPalmChapterRequest(ch, {
        maxOutputTokens: CHAPTERS_EVAL_CONDITIONS.maxOutputTokens,
        timeoutMs: 1,
      });
      return (
        n +
        (estimateCostUsd(CHAPTERS_EVAL_MODEL, {
          inputTokens: Math.ceil(
            (r.system.length +
              r.user.length +
              JSON.stringify(r.schema).length) /
              3.5,
          ),
          outputTokens: TYPICAL_CHAPTER_OUTPUT_TOKENS,
          cacheReadInputTokens: 0,
          cacheCreationInputTokens: 0,
        }) ?? 0)
      );
    }, 0);
    return {
      id: c.id,
      kind: c.kind,
      chapterCalls: calls.length,
      expectedUsd: expected,
      worstUsd: caseWorstUsd(c, price),
    };
  });
  const worstUsd = perCase.reduce((n, c) => n + c.worstUsd, 0);
  const budgetUsd = budgetBrl / usdBrl;
  return {
    model: CHAPTERS_EVAL_MODEL,
    perCase,
    chapterCalls: perCase.reduce((n, c) => n + c.chapterCalls, 0),
    maxCalls:
      perCase.reduce((n, c) => n + c.chapterCalls, 0) *
      CHAPTERS_EVAL_CONDITIONS.maxAttempts,
    expectedUsd: perCase.reduce((n, c) => n + c.expectedUsd, 0),
    worstUsd,
    usdBrl,
    budgetBrl,
    budgetUsd,
    withinBudget: worstUsd <= budgetUsd,
    safeCapUsd: Math.min(worstUsd, budgetUsd),
  };
}

export function renderChaptersPlan(p: ReturnType<typeof planChapters>): string {
  const u = (n: number) => `US$ ${n.toFixed(4)}`;
  return [
    "# Plano — capítulos 6 e 7 (03F.2, Etapa A)",
    "",
    `Modelo de texto: ${p.model} · até ${CHAPTERS_EVAL_CONDITIONS.maxAttempts} tentativas por capítulo · câmbio R$ ${p.usdBrl.toFixed(2)}`,
    `Orçamento: R$ ${p.budgetBrl.toFixed(2)} (${u(p.budgetUsd)}) · teto da execução: ${u(p.safeCapUsd)}`,
    `Chamadas: ${p.chapterCalls} capítulos com conteúdo (até ${p.maxCalls} com novas tentativas); capítulos sem itens não chamam a IA.`,
    "",
    "| Caso | Tipo | Capítulos chamados | Esperado | Pior caso |",
    "| --- | --- | --- | --- | --- |",
    ...p.perCase.map(
      (c) =>
        `| ${c.id} | ${c.kind === "real" ? "real" : "sintético"} | ${c.chapterCalls} | ${u(c.expectedUsd)} | ${u(c.worstUsd)} |`,
    ),
    `| **Total** | | **${p.chapterCalls}** | **${u(p.expectedUsd)} (R$ ${(p.expectedUsd * p.usdBrl).toFixed(2)})** | **${u(p.worstUsd)} (R$ ${(p.worstUsd * p.usdBrl).toFixed(2)})** |`,
    "",
    p.withinBudget
      ? "Cabe no orçamento no pior caso."
      : "**NÃO cabe no orçamento no pior caso: nada será chamado.**",
    "",
  ].join("\n");
}

export type ChaptersSessionResult =
  | { kind: "blocked"; reasons: string[] }
  | { kind: "no_input"; reasons: string[] }
  | {
      kind: "planned" | "over_budget";
      plan: ReturnType<typeof planChapters>;
      outDir: string;
    }
  | {
      kind: "ran";
      plan: ReturnType<typeof planChapters>;
      run: ChaptersRun;
      outDir: string;
    }
  | { kind: "scored"; outDir: string };

/** Lê a mão de cada foto do manifesto da 03F.1 (pNN.jpg → foto-NN). */
async function handsFromManifest(
  dir: string,
): Promise<Record<string, PalmHand>> {
  const m = JSON.parse(
    await readFile(path.join(dir, "manifesto.json"), "utf8"),
  ) as {
    arquivo: string;
    mao: string;
  }[];
  return Object.fromEntries(
    m.map((e) => [
      e.arquivo.replace(/^p(\d+)\..*$/u, "foto-$1"),
      (e.mao === "direita" ? "right" : "left") as PalmHand,
    ]),
  );
}

/** "foto-01=M01,foto-02=M01,…" → mapa (agrupamento por pessoa, sem nomes). */
export function parsePeople(v: string | undefined): Record<string, string> {
  return Object.fromEntries(
    (v ?? "")
      .split(",")
      .map((x) => x.trim().split("="))
      .filter(
        (x) =>
          x.length === 2 && /^foto-\d+$/u.test(x[0]) && /^M\d+$/u.test(x[1]),
      ),
  );
}

async function loadOrBuildSnapshot(env: Env, outDir: string, build: boolean) {
  const file = path.join(outDir, SNAPSHOT_FILE);
  if (await exists(file)) {
    const s = checkSnapshot(JSON.parse(await readFile(file, "utf8")));
    return s
      ? { snapshot: s }
      : { error: "Entrada existente inválida ou de outra versão do contrato." };
  }
  if (!build)
    return { error: `Entrada ausente: rode o plano antes (${SNAPSHOT_FILE}).` };
  const source = env.SIDERA_PALM_CHAPTERS_EVAL_SOURCE?.trim();
  const photos = env.SIDERA_PALM_EVAL_DIR?.trim();
  if (!source || !photos)
    return {
      error:
        "Para montar a entrada: SIDERA_PALM_CHAPTERS_EVAL_SOURCE (pasta da rodada 2) e SIDERA_PALM_EVAL_DIR (só o manifesto é lido).",
    };
  const results = JSON.parse(
    await readFile(path.join(source, "restrito", "resultados.json"), "utf8"),
  ) as { units: Parameters<typeof buildSnapshot>[0]["units"] };
  const { snapshot, rejected } = buildSnapshot({
    units: results.units,
    model: "claude-sonnet-5-5",
    hands: await handsFromManifest(photos),
    people: parsePeople(env.SIDERA_PALM_CHAPTERS_EVAL_PEOPLE),
    source: "03f-rodada2 (Sonnet 5.5)",
  });
  if (rejected.length)
    return {
      error: `Observações que não passaram na revalidação: ${rejected.join(", ")}.`,
    };
  await write(outDir, SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2) + "\n");
  return { snapshot };
}

export async function runChaptersSession(input: {
  mode: "plan" | "run" | "score";
  env: Env;
  repoRoot: string;
  provider?: AiProvider;
  now?: () => number;
}): Promise<ChaptersSessionResult> {
  const gate = chaptersEvalGate(input.env, input.repoRoot);
  if (!gate.canPlan) return { kind: "blocked", reasons: gate.reasons };
  if (input.mode === "run" && !gate.canCall)
    return { kind: "blocked", reasons: gate.reasons };
  const outDir = gate.outDir;

  if (input.mode === "score") {
    const run = JSON.parse(
      await readFile(path.join(outDir, "restrito/resultados.json"), "utf8"),
    ) as ChaptersRun;
    const sheet = parseCsv(
      await readFile(path.join(outDir, "revisao/ficha-capitulos.csv"), "utf8"),
    );
    await write(
      outDir,
      "restrito/apuracao.md",
      renderChapterScore(
        scoreChapterSheet(sheet, run, VISION_USD_PER_PHOTO_03F1),
      ),
    );
    return { kind: "scored", outDir };
  }

  const loaded = await loadOrBuildSnapshot(
    input.env,
    outDir,
    input.mode === "plan",
  );
  if (!("snapshot" in loaded) || !loaded.snapshot)
    return {
      kind: "no_input",
      reasons: [loaded.error ?? "Entrada indisponível."],
    };
  const snapshot = loaded.snapshot;
  const usdBrl = chaptersEvalUsdBrl(input.env);
  const plan = planChapters(snapshot, usdBrl, chaptersEvalBudgetBrl(input.env));
  await write(outDir, "plano.md", renderChaptersPlan(plan));
  if (!plan.withinBudget) return { kind: "over_budget", plan, outDir };
  if (input.mode === "plan") return { kind: "planned", plan, outDir };

  const provider =
    input.provider ??
    createAnthropicProvider({
      model: CHAPTERS_EVAL_MODEL,
      effort: CHAPTERS_EVAL_CONDITIONS.effort,
      apiKey: gate.keyViaProxy
        ? "injetada-pelo-proxy"
        : anthropicApiKey(input.env),
    });
  const run = await runChaptersEvaluation({
    cases: snapshot.cases,
    provider,
    budget: createBudget(plan.safeCapUsd),
    now: input.now,
  });
  const descriptions = Object.fromEntries(
    snapshot.cases.map((c) => [c.id, c.description]),
  );
  await write(
    outDir,
    "revisao/capitulos.md",
    renderReviewDocument(run, descriptions),
  );
  if (!(await exists(path.join(outDir, "revisao/ficha-capitulos.csv"))))
    await write(outDir, "revisao/ficha-capitulos.csv", renderChapterSheet(run));
  await write(outDir, "revisao/guia.md", CHAPTER_GUIDE);
  await write(
    outDir,
    "restrito/resultados.json",
    JSON.stringify(run, null, 2) + "\n",
  );
  await write(
    outDir,
    "restrito/relatorio-tecnico.md",
    renderChaptersTechnical(run, usdBrl, VISION_USD_PER_PHOTO_03F1),
  );
  return { kind: "ran", plan, run, outDir };
}
