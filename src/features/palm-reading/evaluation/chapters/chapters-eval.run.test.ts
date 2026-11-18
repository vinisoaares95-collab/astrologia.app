// @vitest-environment node
/**
 * Pontos de entrada da Etapa A da 03F.2 (capítulos 6 e 7). Pulados por
 * padrão: `npm test` nunca chama nada.
 *
 * Plano (grátis; monta a entrada uma vez a partir da rodada 2):
 *   SIDERA_PALM_CHAPTERS_EVAL_MODE=plan \
 *   SIDERA_PALM_CHAPTERS_EVAL_SOURCE=avaliacao-ia/03f-rodada2 \
 *   SIDERA_PALM_EVAL_DIR=/tmp/sidera-fotos-03f \
 *   SIDERA_PALM_CHAPTERS_EVAL_PEOPLE=foto-01=M01,foto-02=M01,… \
 *     npx vitest run src/features/palm-reading/evaluation/chapters/chapters-eval.run.test.ts
 *
 * Execução (PAGA, só com autorização): ver docs/fase-03f2-plano.md.
 * Apuração (grátis): SIDERA_PALM_CHAPTERS_EVAL_MODE=score.
 */
import { describe, expect, it } from "vitest";

import { chaptersEvalGate } from "./config";
import { runChaptersSession } from "./session";

const env = process.env;
const mode = env.SIDERA_PALM_CHAPTERS_EVAL_MODE;
const root = process.cwd();
const gate = chaptersEvalGate(env, root);

describe.runIf(mode === "plan")(
  "capítulos 03F.2-A: plano (sem chamadas)",
  () => {
    it("monta a entrada e calcula o custo", async () => {
      const r = await runChaptersSession({ mode: "plan", env, repoRoot: root });
      expect(r.kind, JSON.stringify(r)).toBe("planned");
    });
  },
);

describe.runIf(mode === "run" && gate.canCall)(
  "capítulos 03F.2-A: execução PAGA",
  () => {
    it("Haiku 5.5 redige os capítulos", { timeout: 20 * 60_000 }, async () => {
      const r = await runChaptersSession({ mode: "run", env, repoRoot: root });
      expect(r.kind, JSON.stringify(r).slice(0, 2000)).toBe("ran");
    });
  },
);

describe.runIf(mode === "score")("capítulos 03F.2-A: apuração", () => {
  it("compara a ficha com os critérios", async () => {
    const r = await runChaptersSession({ mode: "score", env, repoRoot: root });
    expect(r.kind).toBe("scored");
  });
});
