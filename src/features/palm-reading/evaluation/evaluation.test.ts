// @vitest-environment node
/**
 * Avaliação visual (Fase 03F.1) com provedores SIMULADOS e imagens
 * sintéticas: nenhuma chamada paga, nenhuma foto real.
 */
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterEach, describe, expect, it } from "vitest";

import { createBudget } from "../../interpretation/ai/budget";
import { FEATURE_IDS, FEATURE_VALUES } from "../analysis/contract";
import { syntheticJpeg } from "../server/test-jpeg";
import { visionWorstCaseUsd } from "../vision/budget";
import {
  createMockVisionProvider,
  type MockVisionScenario,
} from "../vision/mock-provider";
import { MODEL_PRICES } from "../../interpretation/ai/pricing";
import {
  EVAL_CONFIRM_PHRASE,
  EVAL_VISION_MODELS,
  evalBudgetBrl,
  evalMaxAttempts,
  visionEvalGate,
} from "./config";
import {
  evalVisionRequest,
  planEvaluation,
  TYPICAL_PHOTO,
  worstCallUsd,
} from "./estimate";
import { parseManifest, prepareEvalPhoto, PHOTO_MAP_FILE } from "./intake";
import {
  agreement,
  blindKey,
  modelSummary,
  parseCsv,
  renderReferenceCsv,
  renderReviewGuide,
  renderReviewSheet,
  renderScore,
  renderTechnicalReport,
  scoreReview,
  toCsv,
} from "./report";
import { runVisionEvaluation, type EvalPhoto } from "./run";
import { resolveOutDir, runEvaluationSession } from "./session";

const ROOT = path.resolve(__dirname, "../../../..");
const [HAIKU, SONNET] = EVAL_VISION_MODELS;
const temps: string[] = [];
afterEach(async () => {
  await Promise.all(
    temps.splice(0).map((d) => rm(d, { recursive: true, force: true })),
  );
});
const tmp = async () => {
  const d = await mkdtemp(path.join(os.tmpdir(), "sidera-03f-"));
  temps.push(d);
  return d;
};

const photo = (id: string, hand: "right" | "left" = "right"): EvalPhoto => ({
  id,
  hand,
  bytes: syntheticJpeg(1200, 1600),
});

/** Provedor simulado por modelo, com o NOME do modelo (preço real). */
function mocks(scenarios: Partial<Record<string, MockVisionScenario[]>> = {}) {
  const made = new Map<string, ReturnType<typeof createMockVisionProvider>>();
  const providerFor = (model: string) => {
    const p = createMockVisionProvider(scenarios[model] ?? ["clear"], {
      model,
    });
    made.set(model, p);
    return p;
  };
  return { providerFor, made };
}

const fullGateEnv = (dir: string, extra: Record<string, string> = {}) => ({
  SIDERA_PALM_EVAL_DIR: dir,
  SIDERA_PALM_EVAL_PAID: "1",
  SIDERA_PALM_EVAL_CONFIRM: EVAL_CONFIRM_PHRASE,
  SIDERA_AI_KEY_VIA_PROXY: "1",
  ...extra,
});

// ── Portão ─────────────────────────────────────────────────────────────────

describe("portão (bloqueado por padrão)", () => {
  it("sem variáveis: nem planeja nem chama", () => {
    const g = visionEvalGate({}, ROOT);
    expect(g.canPlan).toBe(false);
    expect(g.canCall).toBe(false);
  });

  it("variáveis comerciais e da 02F.1 não abrem a avaliação", () => {
    const g = visionEvalGate(
      {
        SIDERA_AI_PAID_TESTS: "1",
        SIDERA_PALM_VISION_REAL: "1",
        SIDERA_PALM_VISION_PROVIDER: "anthropic",
        SIDERA_AI_KEY_VIA_PROXY: "1",
      },
      ROOT,
    );
    expect(g.canCall).toBe(false);
  });

  it("pasta das fotos dentro do repositório é recusada", () => {
    const g = visionEvalGate(
      fullGateEnv(path.join(ROOT, "avaliacao-ia/fotos")),
      ROOT,
    );
    expect(g.canPlan).toBe(false);
    expect(g.reasons.join(" ")).toMatch(/FORA do repositório/u);
  });

  it.each([
    ["sem autorização", { SIDERA_PALM_EVAL_PAID: "0" }],
    ["frase errada", { SIDERA_PALM_EVAL_CONFIRM: "sim" }],
    ["sem credencial", { SIDERA_AI_KEY_VIA_PROXY: "0" }],
    ["em produção", { NODE_ENV: "production" }],
  ])("%s → planeja, mas não chama", (_, over) => {
    const g = visionEvalGate(fullGateEnv("/tmp/fotos-fora", over), ROOT);
    expect(g.canPlan).toBe(true);
    expect(g.canCall).toBe(false);
  });

  it("todas as condições → pode chamar; o valor da chave nunca aparece", () => {
    const g = visionEvalGate(
      {
        ...fullGateEnv("/tmp/fotos-fora"),
        SIDERA_ANTHROPIC_API_KEY: "valor-ficticio",
      },
      ROOT,
    );
    expect(g.canCall).toBe(true);
    expect(JSON.stringify(g)).not.toContain("valor-ficticio");
  });

  it("orçamento nunca acima de R$ 7; tentativas 1 ou 2", () => {
    expect(evalBudgetBrl({ SIDERA_PALM_EVAL_BUDGET_BRL: "50" })).toBe(7);
    expect(evalBudgetBrl({ SIDERA_PALM_EVAL_BUDGET_BRL: "3" })).toBe(3);
    expect(evalMaxAttempts({ SIDERA_PALM_EVAL_MAX_ATTEMPTS: "1" })).toBe(1);
    expect(evalMaxAttempts({ SIDERA_PALM_EVAL_MAX_ATTEMPTS: "9" })).toBe(2);
  });
});

// ── Custos ─────────────────────────────────────────────────────────────────

describe("custos (funções reais do sistema)", () => {
  it("pior caso por chamada = valor reservado pelo orçamento", () => {
    for (const m of EVAL_VISION_MODELS)
      expect(worstCallUsd(m)).toBe(
        visionWorstCaseUsd(evalVisionRequest("right"), MODEL_PRICES[m]),
      );
  });

  it("8 fotos × 2 modelos × 2 tentativas cabem em R$ 7 no pior caso", () => {
    const plan = planEvaluation({
      photos: Array.from({ length: 8 }, () => ({
        ...TYPICAL_PHOTO,
        hand: "right" as const,
      })),
      models: EVAL_VISION_MODELS,
      maxAttempts: 2,
      usdBrl: 5.5,
      budgetBrl: 7,
    });
    expect(plan.withinBudget).toBe(true);
    expect(plan.photosWithinBudget).toBeGreaterThanOrEqual(8);
    expect(plan.expectedUsd).toBeLessThan(plan.worstUsd);
    expect(plan.safeCapUsd).toBe(plan.worstUsd);
    expect(plan.worstBrl).toBeLessThanOrEqual(7);
  });

  it("orçamento menor: indica quantas fotos cabem", () => {
    const plan = planEvaluation({
      photos: Array.from({ length: 8 }, () => ({
        ...TYPICAL_PHOTO,
        hand: "left" as const,
      })),
      models: EVAL_VISION_MODELS,
      maxAttempts: 2,
      usdBrl: 5.5,
      budgetBrl: 2,
    });
    expect(plan.withinBudget).toBe(false);
    expect(plan.photosWithinBudget).toBeLessThan(8);
    expect(plan.safeCapUsd).toBeCloseTo(plan.budgetUsd);
  });
});

// ── Execução ──────────────────────────────────────────────────────────────

describe("execução com simuladores", () => {
  it("registra observações, não visíveis, evidências, tentativas, custo e latência", async () => {
    let t = 0;
    const { providerFor } = mocks({
      [HAIKU]: ["clear"],
      [SONNET]: ["invalid-json", "partial"],
    });
    const photos = [photo("foto-01"), photo("foto-02", "left")];
    const run = await runVisionEvaluation({
      photos,
      models: EVAL_VISION_MODELS,
      providerFor,
      budget: createBudget(1),
      now: () => (t += 100),
    });
    expect(run.units).toHaveLength(4);
    // Ordem alternada por foto.
    expect(run.units.map((u) => u.model)).toEqual([
      HAIKU,
      SONNET,
      SONNET,
      HAIKU,
    ]);
    const h = run.units.find(
      (u) => u.model === HAIKU && u.photoId === "foto-01",
    )!;
    expect(h.status).toBe("ok");
    expect(h.retried).toBe(false);
    expect(h.calls[0]).toMatchObject({ outcome: "ok", respondedModel: HAIKU });
    expect(h.calls[0].costUsd).toBeGreaterThan(0);
    expect(h.calls[0].latencyMs).toBe(100);
    const f = h.final!.features["heart.length"];
    expect(f.visibility).not.toBe("not_visible");
    expect(f.evidence).toBeTruthy();
    const s = run.units.find(
      (u) => u.model === SONNET && u.photoId === "foto-01",
    )!;
    expect(s.retried).toBe(true);
    expect(s.calls.map((c) => c.outcome)).toEqual(["invalid_json", "ok"]);
    expect(
      Object.values(s.final!.features).some(
        (x) => x.visibility === "not_visible",
      ),
    ).toBe(true);
    expect(run.spentUsd).toBeGreaterThan(0);
    // Imagens zeradas; nada de capítulos.
    for (const p of photos) expect(p.bytes.every((b) => b === 0)).toBe(true);
    expect(JSON.stringify(run)).not.toMatch(/chapters|introduction|synthesis/u);
  });

  it("reprovações e rebaixamentos do validador ficam registrados por característica", async () => {
    const { providerFor } = mocks({
      [HAIKU]: ["sensitive", "sensitive"],
      [SONNET]: ["contradictory"],
    });
    const run = await runVisionEvaluation({
      photos: [photo("foto-01")],
      models: EVAL_VISION_MODELS,
      providerFor,
      budget: createBudget(1),
    });
    const h = run.units.find((u) => u.model === HAIKU)!;
    expect(h.status).toBe("invalid_output");
    expect(
      h.calls.every((c) => c.outcome === "rejected" && c.notes.length > 0),
    ).toBe(true);
    const s = run.units.find((u) => u.model === SONNET)!;
    expect(s.calls[0].notes.length).toBeGreaterThan(0);
    expect(JSON.stringify(run)).not.toMatch(/idosa/u); // texto sensível do simulador
  });

  it.each<[string, MockVisionScenario[], string]>([
    ["recusa", ["refusal"], "refused"],
    [
      "tempo esgotado duas vezes",
      ["error:timeout", "error:timeout"],
      "provider_error",
    ],
    ["indisponível e depois ok", ["error:unavailable", "clear"], "ok"],
    [
      "resposta cortada duas vezes",
      ["truncated", "truncated"],
      "invalid_output",
    ],
  ])("falha: %s", async (_, scenarios, status) => {
    const { providerFor } = mocks({ [HAIKU]: scenarios });
    const run = await runVisionEvaluation({
      photos: [photo("foto-01")],
      models: [HAIKU],
      providerFor,
      budget: createBudget(1),
    });
    expect(run.units[0].status).toBe(status);
  });

  it("uma tentativa só, quando configurado", async () => {
    const { providerFor, made } = mocks({ [HAIKU]: ["invalid-json", "clear"] });
    const run = await runVisionEvaluation({
      photos: [photo("foto-01")],
      models: [HAIKU],
      providerFor,
      budget: createBudget(1),
      maxAttempts: 1,
    });
    expect(run.units[0].status).toBe("invalid_output");
    expect(made.get(HAIKU)!.calls).toHaveLength(1);
  });

  it("teto: verificação prévia, reserva por chamada e interrupção", async () => {
    const { providerFor, made } = mocks();
    // Cobre só o pior caso de uma unidade Haiku (2 tentativas) e um pouco mais.
    const limit = 2 * worstCallUsd(HAIKU) * 1.5;
    const run = await runVisionEvaluation({
      photos: [photo("foto-01"), photo("foto-02")],
      models: EVAL_VISION_MODELS,
      providerFor,
      budget: createBudget(limit),
    });
    expect(run.stoppedByBudget).toBe(true);
    expect(run.units[0]).toMatchObject({ model: HAIKU, status: "ok" });
    // Sonnet não começa: o saldo não cobre o seu pior caso.
    expect(run.units.slice(1).every((u) => u.status === "not_run")).toBe(true);
    expect(made.get(SONNET)!.calls).toHaveLength(0);
    expect(run.spentUsd).toBeLessThanOrEqual(limit);
  });
});

// ── Relatórios ────────────────────────────────────────────────────────────

describe("relatórios e revisão humana", () => {
  const runOf = async () => {
    const { providerFor } = mocks({
      [HAIKU]: ["clear"],
      [SONNET]: ["partial"],
    });
    return runVisionEvaluation({
      photos: [photo("foto-01"), photo("foto-02")],
      models: EVAL_VISION_MODELS,
      providerFor,
      budget: createBudget(1),
    });
  };
  const plan = planEvaluation({
    photos: [{ ...TYPICAL_PHOTO, hand: "right" }],
    models: EVAL_VISION_MODELS,
    maxAttempts: 2,
    usdBrl: 5.5,
    budgetBrl: 7,
  });

  it("CSV: ida e volta com vírgulas, aspas e quebras de linha", () => {
    const rows = parseCsv(
      toCsv([
        ["a", "b"],
        ['x, "y"', "linha\nnova"],
      ]),
    );
    expect(rows).toEqual([{ a: 'x, "y"', b: "linha\nnova" }]);
  });

  it("ficha cega: sem nome de modelo; chave separada sorteada por foto", async () => {
    const run = await runOf();
    let n = 0;
    const key = blindKey(run, () => n++ % 2 === 0);
    expect(key.photos["foto-01"]).toEqual({ A: HAIKU, B: SONNET });
    expect(key.photos["foto-02"]).toEqual({ A: SONNET, B: HAIKU });
    const sheet = renderReviewSheet(run, key);
    const ref = renderReferenceCsv(["foto-01", "foto-02"], FEATURE_VALUES);
    const guide = renderReviewGuide(key, FEATURE_VALUES);
    for (const text of [sheet, ref, guide]) {
      expect(text).not.toMatch(/haiku|sonnet|claude|mock|US\$|token/iu);
    }
    expect(parseCsv(sheet)).toHaveLength(2 * FEATURE_IDS.length);
    expect(ref).not.toMatch(/Largura|evid/iu); // referência sem observações dos modelos
  });

  it("relatório técnico: métricas por modelo, sem declarar vencedor", async () => {
    const run = await runOf();
    const key = blindKey(run, () => true);
    const md = renderTechnicalReport(run, plan, key);
    expect(md).toContain(HAIKU);
    expect(md).toMatch(/não exatidão/u);
    expect(md).not.toMatch(/vencedor|melhor modelo|recomendad/iu);
    const s = modelSummary(run, SONNET);
    expect(s.ok).toBe(1 + 1);
    expect(s.notVisible).toBeGreaterThan(0);
    const ag = agreement(run);
    expect(ag.compared).toBe(2 * FEATURE_IDS.length);
  });

  it("apuração: exatidão pela leitura do revisor, não pelo validador", async () => {
    const run = await runOf();
    const key = blindKey(run, () => true); // A = Haiku nas duas fotos
    const sheet = parseCsv(renderReviewSheet(run, key));
    // Revisor concorda com A em tudo; evidências de A conferem.
    const reference = sheet.map((r) => ({
      foto: r.foto,
      caracteristica_id: r.caracteristica_id,
      revisor_visibilidade: r.A_visibilidade,
      revisor_valor: r.A_valor,
    }));
    for (const r of sheet) if (r.A_valor) r.A_evidencia_confere = "sim";
    const scores = scoreReview({ reference, sheet, key });
    const h = scores.find((s) => s.model === HAIKU)!;
    const so = scores.find((s) => s.model === SONNET)!;
    expect(h.correctValue).toBe(h.visibleBoth);
    expect(h.falseVisible).toBe(0);
    expect(h.evidence.sim).toBe(h.visibleBoth);
    expect(
      so.missedClear + so.falseVisible + so.visibleBoth + so.bothHidden,
    ).toBe(2 * FEATURE_IDS.length);
    expect(renderScore(scores)).toMatch(/Falso visível/u);
  });
});

// ── Recebimento das fotos ─────────────────────────────────────────────────

describe("recebimento das fotos", () => {
  it.each([
    ["não é lista", {}],
    ["vazio", []],
    [
      "mais de 8",
      Array.from({ length: 9 }, (_, i) => ({
        arquivo: `f${i}.jpg`,
        mao: "direita",
        autorizacao: `AUT-03F-${String(i).padStart(2, "0")}`,
      })),
    ],
    [
      "caminho no nome",
      [{ arquivo: "../x.jpg", mao: "direita", autorizacao: "AUT-03F-01" }],
    ],
    [
      "nome de pessoa na autorização",
      [{ arquivo: "x.jpg", mao: "direita", autorizacao: "Maria Silva" }],
    ],
    [
      "campo extra",
      [
        {
          arquivo: "x.jpg",
          mao: "direita",
          autorizacao: "AUT-03F-01",
          nome: "Maria",
        },
      ],
    ],
    [
      "mão inválida",
      [{ arquivo: "x.jpg", mao: "ambas", autorizacao: "AUT-03F-01" }],
    ],
  ])("manifesto inválido: %s", (_, raw) => {
    const r = parseManifest(raw);
    expect(r.ok).toBe(false);
  });

  it("prepara como o produto: orientação, tamanho, sem metadados; zera o original", async () => {
    const original = new Uint8Array(
      await sharp({
        create: { width: 4032, height: 3024, channels: 3, background: "#c99" },
      })
        .withMetadata({ orientation: 6 })
        .withExif({ IFD0: { Make: "FakePhone", Model: "Teste" } })
        .jpeg()
        .toBuffer(),
    );
    expect(Buffer.from(original).includes(Buffer.from("FakePhone"))).toBe(true);
    const r = await prepareEvalPhoto(original);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.photo.height).toBeGreaterThan(r.photo.width); // girada (retrato)
    expect(r.photo.visualTokens).toBeLessThanOrEqual(4784);
    expect(Buffer.from(r.photo.bytes).includes(Buffer.from("FakePhone"))).toBe(
      false,
    );
    expect(Buffer.from(r.photo.bytes).includes(Buffer.from("Exif"))).toBe(
      false,
    );
    expect(original.every((b) => b === 0)).toBe(true);
  });

  it("foto pequena ou ilegível é rejeitada", async () => {
    const small = new Uint8Array(
      await sharp({
        create: { width: 500, height: 400, channels: 3, background: "#888" },
      })
        .jpeg()
        .toBuffer(),
    );
    expect(await prepareEvalPhoto(small)).toMatchObject({ ok: false });
    expect(await prepareEvalPhoto(new Uint8Array([1, 2, 3]))).toMatchObject({
      ok: false,
    });
  });
});

// ── Sessão completa ───────────────────────────────────────────────────────

describe("sessão completa (pastas temporárias, simuladores)", () => {
  async function photosDir(n = 2) {
    const dir = await tmp();
    const manifest = [];
    for (let i = 1; i <= n; i++) {
      const file = `voluntario-${i}.jpg`;
      await writeFile(
        path.join(dir, file),
        await sharp({
          create: {
            width: 1200,
            height: 1600,
            channels: 3,
            background: "#b88",
          },
        })
          .jpeg()
          .toBuffer(),
      );
      manifest.push({
        arquivo: file,
        mao: i % 2 ? "direita" : "esquerda",
        autorizacao: `AUT-03F-0${i}`,
      });
    }
    await writeFile(path.join(dir, "manifesto.json"), JSON.stringify(manifest));
    return dir;
  }

  it("sem portão: bloqueada, nenhum provedor criado", async () => {
    let created = 0;
    const r = await runEvaluationSession({
      mode: "run",
      env: { SIDERA_PALM_EVAL_DIR: await photosDir() },
      repoRoot: ROOT,
      providerFor: () => {
        created++;
        return createMockVisionProvider();
      },
    });
    expect(r.kind).toBe("blocked");
    expect(created).toBe(0);
  });

  it("plano: grava só o plano; nenhuma chamada", async () => {
    const out = await tmp();
    let created = 0;
    const r = await runEvaluationSession({
      mode: "plan",
      env: {
        SIDERA_PALM_EVAL_DIR: await photosDir(),
        SIDERA_PALM_EVAL_OUT_DIR: out,
      },
      repoRoot: ROOT,
      providerFor: () => {
        created++;
        return createMockVisionProvider();
      },
    });
    expect(r.kind).toBe("planned");
    expect(created).toBe(0);
    expect((await readdir(out)).sort()).toEqual(["plano.md", "revisao"]);
    expect(await readdir(path.join(out, "revisao"))).toEqual([
      "referencia.csv",
    ]);
  });

  it("foto recusada no plano aparece por identificador, sem nome de arquivo", async () => {
    const dir = await photosDir(2);
    await writeFile(path.join(dir, "voluntario-2.jpg"), "não é imagem");
    const out = await tmp();
    const r = await runEvaluationSession({
      mode: "plan",
      env: { SIDERA_PALM_EVAL_DIR: dir, SIDERA_PALM_EVAL_OUT_DIR: out },
      repoRoot: ROOT,
    });
    expect(r.kind === "planned" && r.rejected).toEqual([
      { id: "foto-02", reason: "Imagem ilegível." },
    ]);
    const md = await readFile(path.join(out, "plano.md"), "utf8");
    expect(md).toContain("foto-02: Imagem ilegível.");
    expect(md).not.toMatch(/voluntario-/u);
  });

  it("acima do orçamento: recusa antes de chamar", async () => {
    const out = await tmp();
    let created = 0;
    const r = await runEvaluationSession({
      mode: "run",
      env: fullGateEnv(await photosDir(), {
        SIDERA_PALM_EVAL_OUT_DIR: out,
        SIDERA_PALM_EVAL_BUDGET_BRL: "0.2",
      }),
      repoRoot: ROOT,
      providerFor: () => {
        created++;
        return createMockVisionProvider();
      },
    });
    expect(r.kind).toBe("over_budget");
    expect(created).toBe(0);
  });

  it("execução: relatórios em revisao/ e restrito/, sem nomes de arquivo, caminhos ou imagens", async () => {
    const dir = await photosDir(2);
    const out = await tmp();
    const { providerFor } = mocks();
    const r = await runEvaluationSession({
      mode: "run",
      env: fullGateEnv(dir, { SIDERA_PALM_EVAL_OUT_DIR: out }),
      repoRoot: ROOT,
      providerFor,
      coin: () => true,
    });
    expect(r.kind).toBe("ran");
    const files = [
      "plano.md",
      "revisao/referencia.csv",
      "revisao/ficha.csv",
      "revisao/guia.md",
      "restrito/chave.json",
      "restrito/resultados.json",
      "restrito/relatorio-tecnico.md",
    ];
    for (const f of files) {
      const text = await readFile(path.join(out, f), "utf8");
      expect(text, f).not.toMatch(/voluntario-|\.jpg|AUT-03F|\/9j\/|base64/u);
      expect(text, f).not.toContain(dir);
    }
    // O mapa identificador → arquivo fica só na pasta das fotos.
    const map = JSON.parse(
      await readFile(path.join(dir, PHOTO_MAP_FILE), "utf8"),
    );
    expect(map["foto-01"].arquivo).toBe("voluntario-1.jpg");
  });

  it("referência preenchida no plano não é sobrescrita pela execução", async () => {
    const dir = await photosDir(1);
    const out = await tmp();
    const env = fullGateEnv(dir, { SIDERA_PALM_EVAL_OUT_DIR: out });
    await runEvaluationSession({ mode: "plan", env, repoRoot: ROOT });
    const file = path.join(out, "revisao/referencia.csv");
    const filled = (await readFile(file, "utf8")).replace(
      /(heart\.length,[^\n]*,)(,)$/mu,
      "$1nitida,long",
    );
    expect(filled).toContain("nitida,long");
    await writeFile(file, filled);
    const { providerFor } = mocks();
    const r = await runEvaluationSession({
      mode: "run",
      env,
      repoRoot: ROOT,
      providerFor,
    });
    expect(r.kind).toBe("ran");
    expect(await readFile(file, "utf8")).toBe(filled);
  });

  it("relatórios dentro do repositório só em avaliacao-ia/", () => {
    expect(() =>
      resolveOutDir(
        { SIDERA_PALM_EVAL_OUT_DIR: path.join(ROOT, "docs") },
        ROOT,
        "x",
      ),
    ).toThrow();
    expect(resolveOutDir({}, ROOT, "x")).toBe(
      path.join(ROOT, "avaliacao-ia", "03f-x"),
    );
  });
});
