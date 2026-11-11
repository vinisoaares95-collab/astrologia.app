// @vitest-environment node
/**
 * Pontos de entrada da avaliação visual (Fase 03F.1). TODOS desligados por
 * padrão: em `npm test` são pulados.
 *
 * Planejar (grátis, sem chamadas):
 *   SIDERA_PALM_EVAL_MODE=plan SIDERA_PALM_EVAL_DIR=/fora/do/repo \
 *     npx vitest run src/features/palm-reading/evaluation/vision-eval.run.test.ts
 *
 * Executar (PAGO — só com autorização expressa):
 *   SIDERA_PALM_EVAL_MODE=run SIDERA_PALM_EVAL_PAID=1 \
 *   SIDERA_PALM_EVAL_CONFIRM=autorizo-avaliacao-visual-03f \
 *   SIDERA_PALM_EVAL_DIR=/fora/do/repo SIDERA_AI_KEY_VIA_PROXY=1 \
 *     npx vitest run src/features/palm-reading/evaluation/vision-eval.run.test.ts
 *
 * Apurar a revisão humana (grátis):
 *   SIDERA_PALM_EVAL_MODE=score SIDERA_PALM_EVAL_REPORT_DIR=avaliacao-ia/03f-… \
 *     npx vitest run src/features/palm-reading/evaluation/vision-eval.run.test.ts
 *
 * Detalhes em docs/fase-03f1-avaliacao-visual.md.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { visionEvalGate } from "./config";
import { parseCsv, renderScore, scoreReview, type BlindKey } from "./report";
import { runEvaluationSession } from "./session";

const env = process.env;
const mode = env.SIDERA_PALM_EVAL_MODE;
const root = process.cwd();
const gate = visionEvalGate(env, root);

describe.runIf(mode === "plan")(
  "avaliação visual: plano (sem chamadas)",
  () => {
    it("prepara as fotos e calcula o custo", { timeout: 120_000 }, async () => {
      const r = await runEvaluationSession({
        mode: "plan",
        env,
        repoRoot: root,
      });
      expect(r.kind, JSON.stringify(r)).toMatch(/planned|over_budget/u);
    });
  },
);

describe.runIf(mode === "run" && gate.canCall)(
  "avaliação visual: execução PAGA",
  () => {
    it("Haiku 5.5 × Sonnet 5.5", { timeout: 30 * 60_000 }, async () => {
      const r = await runEvaluationSession({
        mode: "run",
        env,
        repoRoot: root,
      });
      expect(r.kind, JSON.stringify(r).slice(0, 2000)).toBe("ran");
    });
  },
);

describe.runIf(mode === "score")("avaliação visual: apuração", () => {
  it("compara a ficha com a leitura do revisor", async () => {
    const dir = env.SIDERA_PALM_EVAL_REPORT_DIR!;
    const read = (f: string) => readFile(path.join(dir, f), "utf8");
    const scores = scoreReview({
      reference: parseCsv(await read("revisao/referencia.csv")),
      sheet: parseCsv(await read("revisao/ficha.csv")),
      key: JSON.parse(await read("restrito/chave.json")) as BlindKey,
    });
    await writeFile(
      path.join(dir, "restrito/apuracao.md"),
      renderScore(scores),
      {
        mode: 0o600,
      },
    );
    expect(scores).toHaveLength(2);
  });
});
