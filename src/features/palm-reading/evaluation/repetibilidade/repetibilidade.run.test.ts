// @vitest-environment node
/**
 * Pontos de entrada do experimento de repetibilidade. TODOS desligados por
 * padrão: em `npm test` são pulados.
 *
 * Ensaio com provedor SIMULADO (grátis; só com imagens sintéticas). Grava em
 * avaliacao-ia/repetibilidade-ensaio/, nunca junto dos registros reais:
 *   SIDERA_REP_MODE=simular SIDERA_REP_STAGE=piloto SIDERA_REP_SESSION=S1 \
 *   SIDERA_REP_PHOTOS_DIR=/fora/do/repo SIDERA_REP_TODAY=2026-12-02 \
 *     npx vitest run src/features/palm-reading/evaluation/repetibilidade/repetibilidade.run.test.ts
 *
 * Execução REAL (paga): impossível nesta versão. A conexão real está travada
 * no código (`REP_REAL_CONNECTION_ENABLED = false` em session.ts) e só será
 * destravada depois da autorização específica da execução.
 *
 * Exclusão ao término:
 *   SIDERA_REP_MODE=excluir SIDERA_REP_PHOTOS_DIR=/fora/do/repo \
 *     npx vitest run src/features/palm-reading/evaluation/repetibilidade/repetibilidade.run.test.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { clearHand } from "../../analysis/__fixtures__/observations";
import type { RepStage } from "./config";
import {
  createRealRepProvider,
  executeStage,
  recordDeletion,
  repRealGate,
} from "./session";
import { createSimulatedRepProvider } from "./simulated-provider";

const env = process.env;
const mode = env.SIDERA_REP_MODE;
const stage = (env.SIDERA_REP_STAGE ?? "piloto") as RepStage;
const root = process.cwd();
const photosDir = env.SIDERA_REP_PHOTOS_DIR ?? "";
const manifestFile = path.join(photosDir, "manifesto.json");
/** Registros reais. O ensaio simulado NUNCA grava aqui (não contamina a meta). */
const outDir = path.join(root, "avaliacao-ia", "repetibilidade");
const rehearsalDir = path.join(root, "avaliacao-ia", "repetibilidade-ensaio");

describe.runIf(mode === "simular")("repetibilidade: ensaio simulado", () => {
  it(
    "executa a etapa com o provedor simulado",
    { timeout: 120_000 },
    async () => {
      const r = await executeStage({
        stage,
        session: env.SIDERA_REP_SESSION ?? "S1",
        photosDir,
        manifestFile,
        repoRoot: root,
        outDir: rehearsalDir,
        provider: createSimulatedRepProvider(new Map(), {
          fallback: () => ({ kind: "observation", raw: clearHand() }),
          matchHand: true,
        }),
        today: env.SIDERA_REP_TODAY ?? new Date().toISOString().slice(0, 10),
      });
      expect(r.kind, JSON.stringify(r)).toBe("done");
    },
  );
});

describe.runIf(mode === "executar" && repRealGate(env, stage, root).canCall)(
  "repetibilidade: execução REAL (paga)",
  () => {
    it("etapa autorizada", { timeout: 30 * 60_000 }, async () => {
      const r = await executeStage({
        stage,
        session: env.SIDERA_REP_SESSION ?? "S1",
        photosDir,
        manifestFile,
        repoRoot: root,
        outDir,
        provider: createRealRepProvider(env, stage, root),
        today: new Date().toISOString().slice(0, 10),
      });
      expect(r.kind, JSON.stringify(r)).toBe("done");
    });
  },
);

describe.runIf(mode === "excluir")(
  "repetibilidade: exclusão registrada",
  () => {
    it("apaga as fotos e o manifesto e registra", () => {
      const m = JSON.parse(readFileSync(manifestFile, "utf8")) as {
        fotos: { arquivo: string }[];
      };
      const log = recordDeletion({
        photosDir,
        manifestFile,
        files: m.fotos.map((f) => f.arquivo),
        searchRoots: [photosDir, root, "/tmp"],
        outDir,
        repoRoot: root,
      });
      expect(log.copiesFound).toEqual([]);
    });
  },
);
