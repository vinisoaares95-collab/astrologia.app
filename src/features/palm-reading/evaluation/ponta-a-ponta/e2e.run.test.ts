// @vitest-environment node
/**
 * Pontos de entrada da Etapa B da 03F.2 (ponta a ponta). Pulados por
 * padrão: `npm test` nunca chama nada.
 *
 * Plano (grátis; não abre nenhuma foto):
 *   SIDERA_PALM_E2E_EVAL_MODE=plan SIDERA_PALM_EVAL_DIR=/tmp/sidera-fotos-03f \
 *     npx vitest run src/features/palm-reading/evaluation/ponta-a-ponta/e2e.run.test.ts
 *
 * Execução (PAGA, só com autorização): ver docs/fase-03f2-plano.md.
 * Apuração (grátis): SIDERA_PALM_E2E_EVAL_MODE=score.
 */
import { describe, expect, it } from "vitest";

import { e2eGate } from "./config";
import { runE2ESession } from "./session";

const env = process.env;
const mode = env.SIDERA_PALM_E2E_EVAL_MODE;
const root = process.cwd();
const gate = e2eGate(env, root);

describe.runIf(mode === "plan")("ponta a ponta 03F.2-B: plano", () => {
  it("confere as entradas e calcula o custo", async () => {
    const r = await runE2ESession({ mode: "plan", env, repoRoot: root });
    expect(r.kind, JSON.stringify(r)).toBe("planned");
  });
});

describe.runIf(mode === "run" && gate.canCall)(
  "ponta a ponta 03F.2-B: execução PAGA",
  () => {
    it(
      "3 relatórios pelo fluxo do endpoint",
      { timeout: 20 * 60_000 },
      async () => {
        const r = await runE2ESession({ mode: "run", env, repoRoot: root });
        expect(r.kind, JSON.stringify(r).slice(0, 2000)).toBe("ran");
      },
    );
  },
);

describe.runIf(mode === "score")("ponta a ponta 03F.2-B: apuração", () => {
  it("compara a ficha com os critérios", async () => {
    const r = await runE2ESession({ mode: "score", env, repoRoot: root });
    expect(r.kind).toBe("scored");
  });
});
