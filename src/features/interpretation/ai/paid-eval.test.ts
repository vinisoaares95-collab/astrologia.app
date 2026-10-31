// @vitest-environment node
/**
 * Avaliação PAGA com a API real (Fase 02F). Desligada por padrão.
 *
 * Só roda quando TODAS as condições estão presentes no ambiente local:
 *   SIDERA_AI_PAID_TESTS=1  (autorização explícita para gastar)
 *   SIDERA_AI_ENABLED=1, SIDERA_AI_PROVIDER=anthropic, ANTHROPIC_API_KEY
 * Uso:
 *   SIDERA_AI_PAID_TESTS=1 SIDERA_AI_ENABLED=1 SIDERA_AI_PROVIDER=anthropic \
 *   ANTHROPIC_API_KEY=... npm test -- paid-eval
 * Gera, para os três horários fictícios, o relatório e as métricas reais em
 * docs/avaliacao-ia/ (consumo de tokens informado pela API, latência, custo).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildInterpretation } from "../engine";
import { TEST_TIMES, testChart } from "../test-support";
import { providerFromEnv } from "./config";
import { crossChapterRepetition, generateReport } from "./generate";

const authorized = process.env.SIDERA_AI_PAID_TESTS === "1";
const { provider, config } = providerFromEnv();

describe.runIf(authorized && config.mode === "anthropic")(
  "avaliação paga com a API real",
  () => {
    const out = path.resolve("docs/avaliacao-ia");

    it.each(Object.keys(TEST_TIMES) as (keyof typeof TEST_TIMES)[])(
      "%s",
      async (c) => {
        const report = buildInterpretation(testChart(TEST_TIMES[c]));
        const generated = await generateReport(report, provider);
        mkdirSync(out, { recursive: true });
        writeFileSync(
          path.join(out, `${c}.${config.model}.json`),
          JSON.stringify(
            {
              ...generated,
              config: { model: config.model, effort: config.effort },
              crossChapterRepetition: crossChapterRepetition(generated),
              generatedAt: new Date().toISOString(),
            },
            null,
            2,
          ) + "\n",
        );
        // Nenhum capítulo inválido é entregue: ou IA validada, ou biblioteca.
        for (const ch of generated.chapters)
          expect(["ai", "library"]).toContain(ch.source);
      },
      180_000,
    );
  },
);
