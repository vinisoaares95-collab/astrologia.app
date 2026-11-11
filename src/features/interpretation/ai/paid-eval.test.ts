// @vitest-environment node
/**
 * Avaliação comparativa PAGA: Sonnet 5.5 × Haiku 5.5 (Fase 02F.1).
 * Desligada por padrão. Só roda com autorização explícita e credencial:
 *
 *   SIDERA_AI_PAID_TESTS=1 ANTHROPIC_API_KEY=... npm test -- paid-eval
 *
 * (ou SIDERA_AI_KEY_VIA_PROXY=1 quando a chave é um segredo de rede da
 * sessão, injetado pelo proxy no cabeçalho x-api-key.)
 *
 * Antes de qualquer chamada, calcula o pior custo de TODAS as chamadas
 * (incluindo novas tentativas) e aborta se passar do teto (R$ 15). Durante a
 * execução, cada chamada reserva seu pior custo no orçamento.
 * Grava em avaliacao-ia/<data-hora>/ (ignorada pelo Git) ou em
 * SIDERA_AI_EVAL_OUT_DIR: relatórios cegos, ficha de avaliação e
 * a chave (modelo, custos, latência) separada. Nenhum prompt é gravado.
 */
import { randomInt } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildInterpretation } from "../engine";
import { TEST_TIMES, testChart } from "../test-support";
import { createAnthropicProvider } from "./anthropic-provider";
import { createBudget, withBudget } from "./budget";
import {
  budgetBrlFrom,
  EVAL_CONDITIONS,
  EVAL_MODELS,
  paidRunGate,
  preflight,
  usdBrlFrom,
} from "./eval-config";
import {
  blindRuns,
  renderBlindReport,
  renderScoreSheet,
  runComparison,
  summarizeKey,
  type EvalCase,
} from "./evaluation";

const gate = paidRunGate(process.env);

describe.runIf(gate.allowed)("avaliação comparativa paga", () => {
  it("Sonnet 5.5 × Haiku 5.5, três horários", async () => {
    const usdBrl = usdBrlFrom(process.env);
    const budgetBrl = budgetBrlFrom(process.env);
    const cases: EvalCase[] = [
      { id: "exato", label: "Caso 1 · horário exato", time: TEST_TIMES.exact },
      {
        id: "aproximado",
        label: "Caso 2 · horário aproximado (± 2 h)",
        time: TEST_TIMES.approximate,
      },
      {
        id: "desconhecido",
        label: "Caso 3 · horário desconhecido",
        time: TEST_TIMES.unknown,
      },
    ].map((c) => ({
      id: c.id,
      label: c.label,
      report: buildInterpretation(testChart(c.time)),
    }));

    const plan = preflight(
      cases.map((c) => c.report),
      EVAL_MODELS,
      usdBrl,
      budgetBrl,
    );
    expect(
      plan.withinBudget,
      `Pior caso R$ ${plan.worstBrl.toFixed(2)} acima do teto`,
    ).toBe(true);

    const budget = createBudget(plan.budgetUsd);
    const models = EVAL_MODELS.map((model) => ({
      name: model,
      provider: withBudget(
        createAnthropicProvider({
          model,
          effort: EVAL_CONDITIONS.effort,
          refusalFallback: EVAL_CONDITIONS.refusalFallback,
          // Com o proxy, o SDK precisa de um valor; o proxy o substitui.
          apiKey: gate.keyViaProxy
            ? "injetada-pelo-proxy"
            : process.env.ANTHROPIC_API_KEY,
        }),
        budget,
      ),
    }));

    const runs = await runComparison(cases, models, {
      maxAttempts: EVAL_CONDITIONS.maxAttempts,
      maxOutputTokens: EVAL_CONDITIONS.maxOutputTokens,
      timeoutMs: EVAL_CONDITIONS.timeoutMs,
    });
    const { reports, key } = blindRuns(
      runs,
      cases,
      () => randomInt(0, 2 ** 31) / 2 ** 31,
    );

    // Os relatórios não vão para o repositório: por padrão, ficam numa
    // pasta ignorada pelo Git; SIDERA_AI_EVAL_OUT_DIR escolhe outro destino.
    const dir = path.resolve(
      process.env.SIDERA_AI_EVAL_OUT_DIR ?? "avaliacao-ia",
      new Date().toISOString().replace(/[:.]/g, "-"),
    );
    mkdirSync(path.join(dir, "cego"), { recursive: true });
    for (const r of reports)
      writeFileSync(
        path.join(dir, "cego", `${r.label.replace(" ", "-")}.md`),
        renderBlindReport(r),
      );
    writeFileSync(
      path.join(dir, "cego", "ficha.md"),
      renderScoreSheet(reports),
    );
    writeFileSync(
      path.join(dir, "chave.json"),
      JSON.stringify(
        {
          aviso: "Abrir somente depois de preencher a ficha de avaliação.",
          conditions: EVAL_CONDITIONS,
          usdBrl,
          budgetBrl,
          preflightWorstBrl: plan.worstBrl,
          spentUsd: budget.spentUsd(),
          spentBrl: budget.spentUsd() * usdBrl,
          blockedCalls: budget.blockedCalls(),
          summary: summarizeKey(key, usdBrl),
          key,
        },
        null,
        2,
      ) + "\n",
    );

    expect(budget.spentUsd() * usdBrl).toBeLessThanOrEqual(budgetBrl);
    expect(
      key.every((k) => k.servedModels.every((m) => m === k.modelName)),
    ).toBe(true);
  }, 900_000);
});
