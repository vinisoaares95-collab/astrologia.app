// @vitest-environment node
/**
 * Validação final do motor com Haiku 5.5 (somente Haiku; nunca Sonnet).
 *
 * - Ensaio local (sempre roda): mesmo fluxo com o provedor simulado, sem
 *   rede e sem custo, gravando os artefatos numa pasta temporária.
 * - Execução PAGA (desligada por padrão): só com autorização explícita,
 *   credencial e a suíte selecionada:
 *
 *   SIDERA_AI_PAID_TESTS=1 SIDERA_AI_PAID_SUITE=haiku-validation npm test -- haiku-validation
 *
 * Antes de qualquer chamada, o pior caso de TODAS as chamadas (com novas
 * tentativas) precisa caber no teto (R$ 2; uma variável só pode baixá-lo).
 * Durante a execução, cada chamada reserva o próprio pior custo.
 * Grava em avaliacao-ia/validacao-haiku-<data-hora>/ (ignorada pelo Git) ou
 * em SIDERA_AI_EVAL_OUT_DIR. Nenhum prompt é gravado.
 */
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { createAnthropicProvider } from "./anthropic-provider";
import { anthropicApiKey } from "./api-key";
import { createBudget, withBudget } from "./budget";
import { paidRunGate, usdBrlFrom } from "./eval-config";
import { libraryDraft } from "./library-chapter";
import { createMockProvider } from "./mock-provider";
import { validateChapterDraft } from "./validate";
import {
  buildValidationCases,
  runValidation,
  summarizeValidation,
  validationArtifacts,
  validationBudgetBrl,
  validationPreflight,
  VALIDATION_CONDITIONS,
  VALIDATION_MODEL,
} from "./validation-run";

const writeAll = (dir: string, files: Record<string, string>) => {
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    writeFileSync(path.join(dir, name), content);
  }
};

describe("validação Haiku 5.5: preparação (sem custo)", () => {
  const cases = buildValidationCases();

  it("três nascimentos fictícios, diferentes entre si, um por precisão", () => {
    expect(cases.map((c) => c.report.basis.precision)).toEqual([
      "exact",
      "approximate",
      "unknown",
    ]);
    expect(new Set(cases.map((c) => c.date)).size).toBe(3);
    expect(new Set(cases.map((c) => c.place.id)).size).toBe(3);
    expect(cases.map((c) => c.place.id)).not.toContain("t:sp");
    // Mapas de fato diferentes: Sol e Lua não coincidem entre os casos.
    const sunMoon = cases.map((c) =>
      c.report.facts
        .filter((f) => f.id === "body-sign:sun" || f.id === "body-sign:moon")
        .map((f) => f.sign)
        .join("/"),
    );
    expect(new Set(sunMoon).size).toBe(3);
    for (const c of cases)
      expect(c.report.chapters.every((ch) => ch.items.length > 0)).toBe(true);
  });

  it("só Haiku 5.5, sem fallback pago, nas mesmas condições da 02F.1", () => {
    expect(VALIDATION_MODEL).toBe("claude-haiku-5-5");
    expect(VALIDATION_CONDITIONS).toMatchObject({
      effort: "medium",
      refusalFallback: false,
      maxAttempts: 2,
      maxOutputTokens: 6000,
    });
  });

  it("o pior caso cabe no teto de R$ 2 (e a variável só baixa o teto)", () => {
    const plan = validationPreflight(cases, 5.5, validationBudgetBrl({}));
    expect(plan.perModel.map((m) => m.model)).toEqual(["claude-haiku-5-5"]);
    expect(plan.perModel[0].calls).toBe(30);
    expect(plan.withinBudget).toBe(true);
    expect(plan.worstBrl).toBeLessThan(2);
    expect(validationBudgetBrl({ SIDERA_AI_EVAL_BUDGET_BRL: "50" })).toBe(2);
    expect(validationBudgetBrl({ SIDERA_AI_EVAL_BUDGET_BRL: "1" })).toBe(1);
    console.info(
      `[validação Haiku] pior caso: US$ ${plan.worstUsd.toFixed(4)} = R$ ${plan.worstBrl.toFixed(2)} (teto R$ ${plan.budgetBrl}; ${plan.perModel[0].calls} chamadas no máximo)`,
    );
  });

  it("ensaio com provedor simulado: artefatos completos, cliente sem metadados", async () => {
    const budget = createBudget(validationBudgetBrl({}) / 5.5);
    const provider = withBudget(
      createMockProvider(["valid"], { model: VALIDATION_MODEL }),
      budget,
    );
    const runs = await runValidation(cases, provider);
    const summary = summarizeValidation(runs, 5.5);
    expect(summary).toMatchObject({
      servedModels: ["claude-haiku-5-5"],
      reports: 3,
      modelMismatches: 0,
      precisionOk: true,
    });
    // Com o texto da biblioteca corrigido (Manaus/talentos), o simulado, que
    // copia a biblioteca, é aprovado em todos os capítulos.
    expect(summary.revalidationFailures).toEqual([]);
    expect(summary).toMatchObject({
      calls: 15,
      chaptersFromAi: 15,
      chaptersFromLibrary: 0,
    });
    // Notas de precisão: nenhuma no exato; intervalos no aproximado/desconhecido.
    const notes = runs.map((r) => r.audit.flatMap((a) => a.notes).length);
    expect(notes[0]).toBe(0);
    expect(notes[1]).toBeGreaterThan(0);
    expect(notes[2]).toBeGreaterThan(0);

    const dir = mkdtempSync(path.join(tmpdir(), "validacao-haiku-"));
    writeAll(
      dir,
      validationArtifacts(runs, {
        usdBrl: 5.5,
        budgetBrl: 2,
        preflightWorstBrl: 0,
        spentUsd: budget.spentUsd(),
        blockedCalls: budget.blockedCalls(),
      }),
    );
    for (const [i, c] of cases.entries()) {
      const md = readFileSync(
        path.join(dir, "cliente", `Caso-${i + 1}-${c.id}.md`),
        "utf8",
      );
      expect(md).not.toMatch(
        /biblioteca|reprovad|itemIds|factIds|source|fallback|haiku|sonnet|US\$|R\$|token/iu,
      );
      expect(md.match(/^## /gmu)).toHaveLength(5);
    }
    const audit = JSON.parse(
      readFileSync(path.join(dir, "auditoria.json"), "utf8"),
    );
    expect(audit.runs).toHaveLength(3);
    expect(audit.runs[0].chapters[0]).toHaveProperty("attempts");
    expect(readFileSync(path.join(dir, "resumo.md"), "utf8")).toContain(
      "| Reprovações |",
    );
  });

  it("ensaio com falhas: motivos, correção cruzada e fallback ficam na auditoria", async () => {
    const runs = await runValidation(
      cases.slice(0, 1),
      createMockProvider(["invented-position"], { model: VALIDATION_MODEL }),
    );
    const s = summarizeValidation(runs, 5.5);
    expect(s.chaptersFromLibrary).toBe(5);
    expect(s.errorCodes.UNSUPPORTED_POSITION).toBeGreaterThan(0);
    // Mesmo da biblioteca, nada incompatível com a precisão do horário.
    expect(s.precisionOk).toBe(true);
  });

  it("regressão: o fallback da biblioteca passa na validação nos três cenários", () => {
    for (const c of cases)
      for (const ch of c.report.chapters)
        expect(
          validateChapterDraft(libraryDraft(c.report, ch.id), ch, c.report)
            .errors,
          `${c.id}/${ch.id}`,
        ).toEqual([]);
    // Manaus (sem horário), talentos: os três aspectos da Lua têm texto
    // autoral e a frase composta repetida não aparece mais.
    const talentos = cases
      .find((c) => c.id === "desconhecido")!
      .report.chapters.find((ch) => ch.id === "talentos")!;
    const moon = talentos.items.filter((i) =>
      /aspect:moon-(?:saturn|neptune|uranus)/u.test(i.id),
    );
    expect(moon).toHaveLength(3);
    expect(moon.every((i) => i.origin === "authored")).toBe(true);
    const all = talentos.items.map((i) => i.symbolic).join(" ");
    expect(all).not.toContain("sugere que as emoções e a");
    // Rastreabilidade preservada: cada item segue ligado ao seu fato.
    for (const i of moon)
      expect(i.factIds).toEqual([i.id.split(":").slice(1).join(":")]);
  });

  it("a avaliação comparativa paga não roda quando esta suíte é escolhida", () => {
    expect(
      readFileSync(path.join(__dirname, "paid-eval.test.ts"), "utf8"),
    ).toContain('SIDERA_AI_PAID_SUITE !== "haiku-validation"');
  });
});

const gate = paidRunGate(process.env);
const selected = process.env.SIDERA_AI_PAID_SUITE === "haiku-validation";

describe.runIf(gate.allowed && selected)("validação Haiku 5.5 (PAGA)", () => {
  it("três casos, cinco capítulos cada, só Haiku 5.5", async () => {
    const usdBrl = usdBrlFrom(process.env);
    const budgetBrl = validationBudgetBrl(process.env);
    const cases = buildValidationCases();
    const plan = validationPreflight(cases, usdBrl, budgetBrl);
    expect(
      plan.withinBudget,
      `Pior caso R$ ${plan.worstBrl.toFixed(2)} acima do teto R$ ${budgetBrl}`,
    ).toBe(true);

    const budget = createBudget(plan.budgetUsd);
    const provider = withBudget(
      createAnthropicProvider({
        model: VALIDATION_MODEL,
        effort: VALIDATION_CONDITIONS.effort,
        refusalFallback: false,
        apiKey: gate.keyViaProxy ? "injetada-pelo-proxy" : anthropicApiKey(),
      }),
      budget,
    );
    const runs = await runValidation(cases, provider);

    const dir = path.resolve(
      process.env.SIDERA_AI_EVAL_OUT_DIR ?? "avaliacao-ia",
      `validacao-haiku-${new Date().toISOString().replace(/[:.]/g, "-")}`,
    );
    writeAll(
      dir,
      validationArtifacts(runs, {
        usdBrl,
        budgetBrl,
        preflightWorstBrl: plan.worstBrl,
        spentUsd: budget.spentUsd(),
        blockedCalls: budget.blockedCalls(),
      }),
    );
    console.info(`[validação Haiku] relatórios em ${dir}`);

    expect(budget.spentUsd() * usdBrl).toBeLessThanOrEqual(budgetBrl);
    const summary = summarizeValidation(runs, usdBrl);
    expect(summary.servedModels).toEqual([VALIDATION_MODEL]);
  }, 900_000);
});
