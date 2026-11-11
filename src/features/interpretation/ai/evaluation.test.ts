// @vitest-environment node
import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";

import { buildInterpretation } from "../engine";
import { TEST_TIMES, testChart } from "../test-support";
import { createAnthropicProvider } from "./anthropic-provider";
import { createBudget, withBudget, worstCaseUsd } from "./budget";
import { readAiConfig } from "./config";
import { AiProviderError, type AiProvider, type AiRequest } from "./contract";
import {
  EVAL_BUDGET_BRL,
  EVAL_CONDITIONS,
  EVAL_MODELS,
  budgetBrlFrom,
  paidRunGate,
  preflight,
  usdBrlFrom,
} from "./eval-config";
import {
  QUALITY_CRITERIA,
  blindRuns,
  renderBlindReport,
  renderScoreSheet,
  runComparison,
  summarizeKey,
  type EvalCase,
} from "./evaluation";
import { generateReport } from "./generate";
import { libraryDraft } from "./library-chapter";
import { createMockProvider } from "./mock-provider";
import { MODEL_PRICES } from "./pricing";
import { buildChapterRequest, SYSTEM_PROMPT } from "./prompt";

const cases: EvalCase[] = (
  [
    ["exato", "Caso 1 · horário exato", TEST_TIMES.exact],
    ["aproximado", "Caso 2 · horário aproximado", TEST_TIMES.approximate],
    ["desconhecido", "Caso 3 · horário desconhecido", TEST_TIMES.unknown],
  ] as const
).map(([id, label, time]) => ({
  id,
  label,
  report: buildInterpretation(testChart(time)),
}));
const exact = cases[0].report;

const message = (o: Partial<Anthropic.Beta.Messages.BetaMessage> = {}) =>
  ({
    model: "claude-sonnet-5-5",
    stop_reason: "end_turn",
    content: [{ type: "text", text: "{}" }],
    usage: {
      input_tokens: 1000,
      output_tokens: 500,
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 0,
    },
    ...o,
  }) as unknown as Anthropic.Beta.Messages.BetaMessage;

/** Provedor que responde capítulos válidos, com consumo fixo. */
function validAnthropic(model: string, served = model) {
  const bodies: Record<string, unknown>[] = [];
  const provider = createAnthropicProvider({
    model,
    effort: "medium",
    refusalFallback: false,
    create: async (body) => {
      bodies.push(body as unknown as Record<string, unknown>);
      const id = (body.messages[0].content as string).match(
        /"id": "(\w+)",\s*"number"/,
      )![1];
      return message({
        model: served,
        content: [
          {
            type: "text",
            text: JSON.stringify(libraryDraft(exact, id as never)),
            citations: null,
          },
        ],
      });
    },
  });
  return { provider, bodies };
}

describe("fallback entre modelos", () => {
  const req = buildChapterRequest(exact, "mente", {
    maxOutputTokens: 100,
    timeoutMs: 100,
  });
  const bodyFor = async (model: string, refusalFallback?: boolean) => {
    let body: Record<string, unknown> = {};
    await createAnthropicProvider({
      model,
      effort: "medium",
      refusalFallback,
      create: async (b) => {
        body = b as unknown as Record<string, unknown>;
        return message({ model });
      },
    }).generate(req);
    return body;
  };

  it("desligado: não envia betas nem fallbacks", async () => {
    const body = await bodyFor("claude-sonnet-5-5", false);
    expect(body).not.toHaveProperty("fallbacks");
    expect(body).not.toHaveProperty("betas");
  });

  it("nunca é enviado para modelos sem fallback do servidor (Haiku 5.5)", async () => {
    expect(await bodyFor("claude-haiku-5-5", true)).not.toHaveProperty(
      "fallbacks",
    );
  });

  it("Sonnet 5.5: fallback pago só com pedido explícito (02F.2)", async () => {
    expect(await bodyFor("claude-sonnet-5-5")).not.toHaveProperty("fallbacks");
    expect(await bodyFor("claude-sonnet-5-5", true)).toMatchObject({
      fallbacks: "default",
    });
  });

  it("a avaliação e o produto deixam o fallback pago desligado (liga só com variável)", () => {
    expect(EVAL_CONDITIONS.refusalFallback).toBe(false);
    const env = {
      SIDERA_AI_ENABLED: "1",
      SIDERA_AI_PROVIDER: "anthropic",
      ANTHROPIC_API_KEY: "x",
    };
    expect(readAiConfig(env).refusalFallback).toBe(false);
    expect(
      readAiConfig({ ...env, SIDERA_AI_REFUSAL_FALLBACK: "1" }).refusalFallback,
    ).toBe(true);
  });

  it("registra o modelo pedido e o que respondeu", async () => {
    const { provider } = validAnthropic(
      "claude-haiku-5-5",
      "claude-sonnet-5-5",
    );
    const out = await generateReport(exact, provider);
    expect(out.metrics.attempts[0]).toMatchObject({
      requestedModel: "claude-haiku-5-5",
      model: "claude-sonnet-5-5",
    });
    expect(out.metrics.totals.modelMismatches).toBe(5);
  });

  it("o fallback para a biblioteca continua ativo", async () => {
    const out = await generateReport(
      exact,
      createMockProvider(["invented-position"]),
    );
    expect(out.chapters.every((c) => c.source === "library")).toBe(true);
  });
});

describe("teto de gasto", () => {
  const price = MODEL_PRICES["claude-sonnet-5-5"];
  const req: AiRequest = {
    system: "s".repeat(1000),
    user: "u".repeat(1000),
    schema: {},
    maxOutputTokens: 1000,
    timeoutMs: 1,
  };

  it("pior caso: entrada a 2 caracteres/token, preço de escrita em cache, saída máxima", () => {
    // (2002/2 = 1001 tokens × $2,50) + (1000 × $10), por milhão
    expect(worstCaseUsd(req, price)).toBeCloseTo(
      (1001 * 2.5 + 1000 * 10) / 1e6,
      12,
    );
  });

  it("bloqueia antes de chamar quando a reserva passaria do teto", async () => {
    let called = 0;
    const inner: AiProvider = {
      id: "x",
      model: "claude-sonnet-5-5",
      generate: async () => {
        called++;
        throw new Error("não deveria chamar");
      },
    };
    const budget = createBudget(worstCaseUsd(req, price) / 2);
    await expect(withBudget(inner, budget).generate(req)).rejects.toMatchObject(
      { kind: "budget" },
    );
    expect(called).toBe(0);
    expect(budget.blockedCalls()).toBe(1);
  });

  it("estouro do teto vira biblioteca, sem nova tentativa", async () => {
    const { provider } = validAnthropic("claude-sonnet-5-5");
    const out = await generateReport(
      exact,
      withBudget(provider, createBudget(1e-9)),
    );
    expect(out.chapters.every((c) => c.source === "library")).toBe(true);
    expect(out.metrics.totals.calls).toBe(5);
    expect(out.chapters[0].fallbackReason).toMatch(/budget/);
  });

  it("chamadas em paralelo nunca ultrapassam o teto", async () => {
    const { provider } = validAnthropic("claude-sonnet-5-5");
    const one = worstCaseUsd(
      buildChapterRequest(exact, "identidade", {
        maxOutputTokens: 4000,
        timeoutMs: 1,
      }),
      price,
    );
    const budget = createBudget(one * 2.5);
    const out = await generateReport(exact, withBudget(provider, budget));
    expect(budget.spentUsd()).toBeLessThanOrEqual(budget.limitUsd);
    expect(budget.blockedCalls()).toBeGreaterThan(0);
    expect(out.metrics.totals.chaptersFromAi).toBeLessThan(5);
  });

  it("soma o custo real e libera o restante da reserva", async () => {
    const { provider } = validAnthropic("claude-sonnet-5-5");
    const budget = createBudget(1);
    const out = await generateReport(exact, withBudget(provider, budget));
    // 5 × (1000 × $2 + 500 × $10) / 1M
    expect(budget.spentUsd()).toBeCloseTo(5 * 0.007, 9);
    expect(budget.reservedUsd()).toBeCloseTo(0, 12);
    expect(out.metrics.totals.costUsd).toBeCloseTo(budget.spentUsd(), 9);
  });

  it("timeout conta o pior caso (pode ter sido cobrado); erro 4xx não conta", async () => {
    for (const [kind, charged] of [
      ["timeout", true],
      ["bad_request", false],
    ] as const) {
      const budget = createBudget(1);
      const inner: AiProvider = {
        id: "x",
        model: "claude-sonnet-5-5",
        generate: async () => {
          throw new AiProviderError(kind, "falha");
        },
      };
      const err = await withBudget(inner, budget)
        .generate(req)
        .catch((e: AiProviderError) => e);
      const worst = worstCaseUsd(req, price);
      expect(budget.spentUsd()).toBeCloseTo(charged ? worst : 0, 12);
      expect((err as AiProviderError).chargedUsd).toBeCloseTo(
        charged ? worst : 0,
        12,
      );
    }
  });

  it("custos de tentativas que falharam entram no total do relatório", async () => {
    const inner = createMockProvider(["error:timeout"], {
      model: "modelo-pago",
    });
    const prices = {
      "modelo-pago": { input: 1, output: 1, cacheWrite5m: 1, cacheRead: 1 },
    };
    const budget = createBudget(10);
    const out = await generateReport(exact, withBudget(inner, budget, prices));
    expect(out.metrics.totals.calls).toBe(10);
    expect(out.metrics.totals.costUsd).toBeGreaterThan(0);
    expect(out.metrics.totals.costUsd).toBeCloseTo(budget.spentUsd(), 9);
  });

  it("modelo sem preço conhecido não é chamado", async () => {
    const inner = createMockProvider(["valid"], { model: "desconhecido" });
    await expect(
      withBudget(inner, createBudget(1)).generate(req),
    ).rejects.toMatchObject({ kind: "budget" });
    expect(inner.calls).toHaveLength(0);
  });
});

describe("planejamento da avaliação paga", () => {
  const reports = cases.map((c) => c.report);

  it("o pior caso das 6 gerações, com novas tentativas, cabe em R$ 15", () => {
    const plan = preflight(
      reports,
      EVAL_MODELS,
      usdBrlFrom({}),
      EVAL_BUDGET_BRL,
    );
    expect(plan.perModel.map((m) => m.calls)).toEqual([30, 30]);
    expect(plan.withinBudget).toBe(true);
    expect(plan.worstBrl).toBeLessThan(EVAL_BUDGET_BRL);
  });

  it("modelo sem preço torna o plano inviável", () => {
    expect(
      preflight(reports, ["modelo-x"], 5.5, EVAL_BUDGET_BRL).withinBudget,
    ).toBe(false);
  });

  it("o teto nunca passa de R$ 15, mesmo se configurado acima", () => {
    expect(budgetBrlFrom({ SIDERA_AI_EVAL_BUDGET_BRL: "100" })).toBe(15);
    expect(budgetBrlFrom({ SIDERA_AI_EVAL_BUDGET_BRL: "5" })).toBe(5);
    expect(budgetBrlFrom({})).toBe(15);
  });

  it("sem autorização ou sem credencial, nada é executado", () => {
    expect(paidRunGate({}).allowed).toBe(false);
    expect(paidRunGate({ ANTHROPIC_API_KEY: "segredo" }).allowed).toBe(false);
    expect(paidRunGate({ SIDERA_AI_PAID_TESTS: "1" }).allowed).toBe(false);
    const ok = paidRunGate({
      SIDERA_AI_PAID_TESTS: "1",
      ANTHROPIC_API_KEY: "segredo",
    });
    expect(ok.allowed).toBe(true);
    expect(JSON.stringify(ok)).not.toContain("segredo");
    const sidera = paidRunGate({
      SIDERA_AI_PAID_TESTS: "1",
      SIDERA_ANTHROPIC_API_KEY: "segredo",
    });
    expect(sidera.allowed).toBe(true);
    expect(JSON.stringify(sidera)).not.toContain("segredo");
    expect(
      paidRunGate({ SIDERA_AI_PAID_TESTS: "1", SIDERA_AI_KEY_VIA_PROXY: "1" })
        .allowed,
    ).toBe(true);
  });
});

describe("comparação cega (simulada, sem custo)", async () => {
  const a = createMockProvider(["valid"]);
  const b = createMockProvider(["valid"]);
  const runs = await runComparison(
    cases,
    [
      { name: "claude-sonnet-5-5", provider: a },
      { name: "claude-haiku-5-5", provider: b },
    ],
    { maxAttempts: 2, maxOutputTokens: 6000, timeoutMs: 1000 },
  );
  const draws = [0.9, 0.1, 0.5, 0.3, 0.7, 0.2];
  let n = 0;
  const random = () => draws[n++ % draws.length];
  const { reports, key } = blindRuns(runs, cases, random);
  const blindText = [
    ...reports.map(renderBlindReport),
    renderScoreSheet(reports),
    JSON.stringify(reports),
  ].join("\n");

  it("seis relatórios de cinco capítulos", () => {
    expect(runs).toHaveLength(6);
    for (const r of runs) expect(r.generated.chapters).toHaveLength(5);
  });

  it("os dois modelos recebem exatamente as mesmas requisições", () => {
    const strip = (c: AiRequest) => JSON.stringify(c);
    expect(a.calls.map(strip)).toEqual(b.calls.map(strip));
    expect(a.calls).toHaveLength(15);
  });

  it("rótulos únicos A–F e chave completa", () => {
    expect(reports.map((r) => r.label)).toEqual(
      ["A", "B", "C", "D", "E", "F"].map((l) => `Relatório ${l}`),
    );
    expect(key.map((k) => k.label)).toEqual(reports.map((r) => r.label));
    expect(new Set(key.map((k) => `${k.caseId}:${k.modelName}`)).size).toBe(6);
  });

  it("a ordem depende do sorteio", () => {
    let i = 0;
    const other = blindRuns(runs, cases, () => i++);
    expect(other.key.map((k) => k.modelName)).not.toEqual(
      key.map((k) => k.modelName),
    );
  });

  it("os relatórios cegos não identificam o modelo nem trazem custos", () => {
    for (const term of [
      "claude",
      "sonnet",
      "haiku",
      "mock",
      "costUsd",
      "latencyMs",
      "inputTokens",
    ])
      expect(blindText.toLowerCase()).not.toContain(term.toLowerCase());
  });

  it("nenhum artefato contém o prompt", () => {
    const all = blindText + JSON.stringify(key);
    expect(all).not.toContain(SYSTEM_PROMPT.slice(0, 60));
    expect(all).not.toContain("Redija o capítulo");
  });

  it("a ficha tem os 10 critérios e avisa que tamanho não é critério", () => {
    const sheet = renderScoreSheet(reports);
    for (const c of QUALITY_CRITERIA) expect(sheet).toContain(c.label);
    expect(QUALITY_CRITERIA).toHaveLength(10);
    expect(sheet).toMatch(/tamanho do texto não é critério/);
  });

  it("resumo da chave por modelo", () => {
    const s = summarizeKey(key, 5.5);
    expect(s.map((x) => [x.model, x.reports, x.calls])).toEqual(
      expect.arrayContaining([
        ["claude-sonnet-5-5", 3, 15],
        ["claude-haiku-5-5", 3, 15],
      ]),
    );
  });
});
