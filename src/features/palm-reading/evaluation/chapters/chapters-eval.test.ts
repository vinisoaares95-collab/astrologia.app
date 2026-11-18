// @vitest-environment node
/**
 * Etapa A da 03F.2 com SIMULADORES e observações FICTÍCIAS: nenhuma chamada
 * paga, nenhuma foto, nenhum dado real. Os textos simulados são montados a
 * partir da biblioteca e NÃO medem a qualidade do Haiku.
 */
import {
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
  mkdir,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createBudget } from "../../../interpretation/ai/budget";
import {
  clearHand,
  partialHand,
} from "../../analysis/__fixtures__/observations";
import { buildPalmInterpretation } from "../../analysis/engine";
import { validatePalmObservation } from "../../analysis/validate-observation";
import {
  createMockPalmTextProvider,
  type MockPalmTextScenario,
} from "../../chapters/mock-text-provider";
import {
  buildSnapshot,
  checkSnapshot,
  syntheticCases,
  type EvalCase,
} from "./cases";
import {
  CHAPTERS_EVAL_CONFIRM,
  CHAPTERS_EVAL_MODEL,
  chaptersEvalGate,
} from "./config";
import {
  automaticSummary,
  jaccard,
  parseCsv,
  renderChapterScore,
  renderChapterSheet,
  renderReviewDocument,
  scoreChapterSheet,
} from "./report";
import { caseWorstUsd, runChaptersEvaluation } from "./run";
import { parsePeople, planChapters, runChaptersSession } from "./session";
import { MODEL_PRICES } from "../../../interpretation/ai/pricing";

const ROOT = path.resolve(__dirname, "../../../../..");
const temps: string[] = [];
afterEach(async () => {
  await Promise.all(
    temps.splice(0).map((d) => rm(d, { recursive: true, force: true })),
  );
});
const tmp = async () => {
  const d = await mkdtemp(path.join(os.tmpdir(), "sidera-03f2a-"));
  temps.push(d);
  return d;
};

/** Observação fictícia no formato dos resultados da 03F.1. */
function unitOf(raw: unknown, photoId: string, model = "claude-sonnet-5-5") {
  const hand = (raw as { hand: "right" | "left" }).hand;
  const r = validatePalmObservation(raw, hand);
  if (!r.ok) throw new Error("fixture");
  const features = Object.fromEntries(
    Object.entries(r.observation.features).map(([id, f]) => [
      id,
      f.visibility === "not_visible"
        ? {
            visibility: f.visibility,
            value: null,
            evidence: null,
            reason: f.reason,
          }
        : {
            visibility: f.visibility,
            value: f.value,
            evidence: f.evidence,
            reason: null,
          },
    ]),
  );
  return {
    unit: {
      photoId,
      model,
      status: "ok",
      final: {
        status: r.observation.status,
        quality: r.observation.quality,
        issues: r.observation.issues,
        features,
      },
    },
    hand,
  };
}

function fictitiousCases(): EvalCase[] {
  const a = unitOf(clearHand(), "foto-01");
  const b = unitOf(partialHand(), "foto-02");
  const { snapshot } = buildSnapshot({
    units: [a.unit, b.unit] as never,
    model: "claude-sonnet-5-5",
    hands: { "foto-01": a.hand, "foto-02": b.hand },
    people: { "foto-01": "M01", "foto-02": "M01" },
    source: "fixture",
  });
  return snapshot.cases;
}

const haiku = (scenarios: MockPalmTextScenario[] = ["valid"]) =>
  createMockPalmTextProvider(scenarios, { model: CHAPTERS_EVAL_MODEL });

describe("portão (bloqueado por padrão)", () => {
  it("sem variáveis: só planeja; variáveis de outras fases não abrem", () => {
    const g = chaptersEvalGate({}, ROOT);
    expect(g.canPlan).toBe(true);
    expect(g.canCall).toBe(false);
    const other = chaptersEvalGate(
      {
        SIDERA_PALM_EVAL_PAID: "1",
        SIDERA_AI_PAID_TESTS: "1",
        SIDERA_AI_KEY_VIA_PROXY: "1",
        SIDERA_PALM_EVAL_CONFIRM: "autorizo-avaliacao-visual-03f",
      },
      ROOT,
    );
    expect(other.canCall).toBe(false);
  });

  it("relatórios no repositório só em avaliacao-ia/", () => {
    expect(
      chaptersEvalGate(
        { SIDERA_PALM_CHAPTERS_EVAL_OUT_DIR: path.join(ROOT, "docs") },
        ROOT,
      ).canPlan,
    ).toBe(false);
  });

  it("tudo presente: pode chamar; o valor da chave não aparece", () => {
    const g = chaptersEvalGate(
      {
        SIDERA_PALM_CHAPTERS_EVAL_PAID: "1",
        SIDERA_PALM_CHAPTERS_EVAL_CONFIRM: CHAPTERS_EVAL_CONFIRM,
        SIDERA_ANTHROPIC_API_KEY: "valor-ficticio",
      },
      ROOT,
    );
    expect(g.canCall).toBe(true);
    expect(JSON.stringify(g)).not.toContain("valor-ficticio");
  });

  it("o modelo de texto avaliado é o do produto (Haiku 5.5)", () => {
    expect(CHAPTERS_EVAL_MODEL).toBe("claude-haiku-5-5");
  });
});

describe("casos", () => {
  it("revalida as observações e só aceita as do modelo de visão escolhido", () => {
    const a = unitOf(clearHand(), "foto-01");
    const haikuUnit = unitOf(clearHand(), "foto-01", "claude-haiku-5-5");
    const { snapshot, rejected } = buildSnapshot({
      units: [a.unit, haikuUnit.unit] as never,
      model: "claude-sonnet-5-5",
      hands: { "foto-01": a.hand },
      people: {},
      source: "fixture",
    });
    expect(rejected).toEqual([]);
    expect(snapshot.cases.filter((c) => c.kind === "real")).toHaveLength(1);
    expect(snapshot.cases.filter((c) => c.kind === "synthetic")).toHaveLength(
      2,
    );
    expect(checkSnapshot(JSON.parse(JSON.stringify(snapshot)))).not.toBeNull();
  });

  it("observação adulterada ou sem mão conhecida é recusada", () => {
    const a = unitOf(clearHand(), "foto-01");
    (a.unit.final.features["heart.length"] as { value: string }).value =
      "infinite";
    const b = unitOf(clearHand(), "foto-02");
    const { rejected } = buildSnapshot({
      units: [a.unit, b.unit] as never,
      model: "claude-sonnet-5-5",
      hands: { "foto-01": a.hand },
      people: {},
      source: "fixture",
    });
    expect(rejected.sort()).toEqual(["foto-01", "foto-02"]);
  });

  it("sintéticos: um só com a mão (cap. 7 indisponível), outro só com uma linha (cap. 6 indisponível)", () => {
    const [onlyHand, oneLine] = syntheticCases();
    const r1 = buildPalmInterpretation(onlyHand.observation);
    const r2 = buildPalmInterpretation(oneLine.observation);
    expect(r1.chapters.map((c) => c.items.length > 0)).toEqual([true, false]);
    expect(r2.chapters.map((c) => c.items.length > 0)).toEqual([false, true]);
    expect(onlyHand.description).toMatch(/SINTÉTICO/u);
  });

  it("agrupamento por pessoa sem nomes", () => {
    expect(parsePeople("foto-01=M01, foto-02=M01,foto-03=Maria")).toEqual({
      "foto-01": "M01",
      "foto-02": "M01",
    });
  });
});

describe("execução com simulador", () => {
  it("gera os capítulos, revalida o texto final e mede custo", async () => {
    const run = await runChaptersEvaluation({
      cases: fictitiousCases(),
      provider: haiku(),
      budget: createBudget(1),
    });
    const s = automaticSummary(run);
    expect(s.casesRun).toBe(4);
    expect(s.fromLibrary).toBe(0);
    expect(s.recheckFailures).toBe(0);
    expect(s.languageFailures).toBe(0);
    expect(s.costUsd).toBeGreaterThan(0);
    expect(s.respondedModels).toEqual([CHAPTERS_EVAL_MODEL]);
    // Indisponíveis não chamam a IA.
    expect(s.unavailable).toBe(2);
    const sint = run.cases.find((c) => c.id === "sint-01")!;
    expect(sint.chapters[1].attempts).toHaveLength(0);
    expect(sint.chapters[1].client.unavailableMessage).toMatch(/nova foto/u);
    // O que ficou de fora é listado para o revisor.
    expect(sint.chapters[0].unused.map((u) => u.feature)).toContain(
      "hand.fingerLength",
    );
  });

  it.each<[string, MockPalmTextScenario[]]>([
    ["falha do provedor", ["error:timeout"]],
    ["característica inventada", ["unsupported-feature"]],
    ["longevidade", ["longevity"]],
  ])(
    "%s → biblioteca, com motivo registrado e texto final seguro",
    async (_, scenarios) => {
      const run = await runChaptersEvaluation({
        cases: fictitiousCases().slice(0, 1),
        provider: haiku(scenarios),
        budget: createBudget(1),
      });
      const s = automaticSummary(run);
      expect(s.fromLibrary).toBeGreaterThan(0);
      expect(s.fallbackReasons[0].reason).toBeTruthy();
      expect(s.recheckFailures).toBe(0);
      expect(s.languageFailures).toBe(0);
    },
  );

  it("teto: verificação prévia por caso e interrupção", async () => {
    const price = MODEL_PRICES[CHAPTERS_EVAL_MODEL];
    // Menor primeiro; o teto cobre só ele: o maior não pode começar.
    const all = fictitiousCases();
    const cases = [
      all.find((c) => c.id === "sint-01")!,
      all.find((c) => c.id === "foto-01")!,
    ];
    expect(caseWorstUsd(cases[1], price)).toBeGreaterThan(
      caseWorstUsd(cases[0], price) * 1.05,
    );
    const limit = caseWorstUsd(cases[0], price) * 1.05;
    const provider = haiku();
    const run = await runChaptersEvaluation({
      cases,
      provider,
      budget: createBudget(limit),
    });
    expect(run.cases.map((c) => c.status)).toEqual(["ok", "not_run"]);
    expect(run.stoppedByBudget).toBe(true);
    expect(run.spentUsd).toBeLessThanOrEqual(limit);
  });

  it("plano: chamadas e pior caso conferem com a reserva do orçamento", () => {
    const cases = fictitiousCases();
    const plan = planChapters(
      {
        version: "03f2a.1",
        source: "x",
        model: "x",
        observationVersion: "03c.2",
        cases,
      },
      5.5,
      1,
    );
    expect(plan.chapterCalls).toBe(6); // 2 reais × 2 + 2 sintéticos × 1
    expect(plan.maxCalls).toBe(12);
    expect(plan.worstUsd).toBeCloseTo(
      cases.reduce(
        (n, c) => n + caseWorstUsd(c, MODEL_PRICES[CHAPTERS_EVAL_MODEL]),
        0,
      ),
    );
    expect(plan.withinBudget).toBe(true);
  });
});

describe("relatórios e apuração", () => {
  it("material de revisão sem origem do texto, modelo nem custo", async () => {
    const run = await runChaptersEvaluation({
      cases: fictitiousCases(),
      provider: haiku(["error:timeout"]),
      budget: createBudget(1),
    });
    const doc = renderReviewDocument(run, {});
    expect(doc).not.toMatch(
      /biblioteca|library|source|haiku|claude|US\$|token|fallback/iu,
    );
    expect(doc).toMatch(/SINTÉTICO/u);
    expect(doc).toMatch(/Não usado \(não interpretado\)/u);
    expect(parseCsv(renderChapterSheet(run))).toHaveLength(8);
  });

  it("similaridade: texto igual = 1, diferente < 1", () => {
    expect(
      jaccard(
        "a linha da vida faz um arco amplo",
        "a linha da vida faz um arco amplo",
      ),
    ).toBe(1);
    expect(
      jaccard(
        "a linha da vida faz um arco amplo",
        "o formato da palma é mais quadrado",
      ),
    ).toBeLessThan(0.2);
  });

  it("apuração aplica os critérios aprovados; invenção é bloqueante", async () => {
    const run = await runChaptersEvaluation({
      cases: fictitiousCases(),
      provider: haiku(),
      budget: createBudget(1),
    });
    const sheet = parseCsv(renderChapterSheet(run)).map((r) => ({
      ...r,
      secoes_sem_apoio: "0",
      inventou: "nao",
      indeterminadas_ok: r.status === "conteudo" ? "sim" : "na",
      clareza: "5",
      naturalidade: "4",
      personalizacao: r.status === "conteudo" ? "4" : "na",
      repeticao: "baixa",
      seguranca: "ok",
      pouca_info_ok: r.status === "indisponivel" ? "sim" : "na",
    }));
    const ok = scoreChapterSheet(sheet, run, 0.0128);
    expect(Object.values(ok.approved).every(Boolean)).toBe(true);
    sheet[0].inventou = "sim";
    const bad = scoreChapterSheet(sheet, run, 0.0128);
    expect(bad.approved["Nenhuma característica inventada (bloqueante)"]).toBe(
      false,
    );
    expect(renderChapterScore(bad)).toMatch(/\*\*não\*\*/u);
  });
});

describe("sessão completa (pastas temporárias, simulador)", () => {
  async function source() {
    const round = await tmp();
    const photos = await tmp();
    const a = unitOf(clearHand(), "foto-01");
    const b = unitOf(partialHand(), "foto-02");
    await mkdir(path.join(round, "restrito"), { recursive: true });
    await writeFile(
      path.join(round, "restrito/resultados.json"),
      JSON.stringify({ units: [a.unit, b.unit] }),
    );
    await writeFile(
      path.join(photos, "manifesto.json"),
      JSON.stringify([
        {
          arquivo: "p01.jpg",
          mao: a.hand === "right" ? "direita" : "esquerda",
          autorizacao: "AUT-03F-01",
        },
        {
          arquivo: "p02.jpg",
          mao: b.hand === "right" ? "direita" : "esquerda",
          autorizacao: "AUT-03F-02",
        },
      ]),
    );
    return { round, photos };
  }

  it("plano monta a entrada sem chamar; execução e apuração com simulador", async () => {
    const { round, photos } = await source();
    const out = await tmp();
    const base = {
      SIDERA_PALM_CHAPTERS_EVAL_OUT_DIR: out,
      SIDERA_PALM_CHAPTERS_EVAL_SOURCE: round,
      SIDERA_PALM_EVAL_DIR: photos,
    };
    const provider = haiku();
    const planned = await runChaptersSession({
      mode: "plan",
      env: base,
      repoRoot: ROOT,
      provider,
    });
    expect(planned.kind).toBe("planned");
    expect(provider.calls).toHaveLength(0);
    expect((await readdir(out)).sort()).toEqual(["entrada", "plano.md"]);

    const blocked = await runChaptersSession({
      mode: "run",
      env: base,
      repoRoot: ROOT,
      provider,
    });
    expect(blocked.kind).toBe("blocked");
    expect(provider.calls).toHaveLength(0);

    const env = {
      ...base,
      SIDERA_PALM_CHAPTERS_EVAL_PAID: "1",
      SIDERA_PALM_CHAPTERS_EVAL_CONFIRM: CHAPTERS_EVAL_CONFIRM,
      SIDERA_AI_KEY_VIA_PROXY: "1",
    };
    const ran = await runChaptersSession({
      mode: "run",
      env,
      repoRoot: ROOT,
      provider,
    });
    expect(ran.kind).toBe("ran");
    for (const f of [
      "revisao/capitulos.md",
      "revisao/ficha-capitulos.csv",
      "revisao/guia.md",
      "restrito/resultados.json",
      "restrito/relatorio-tecnico.md",
    ])
      expect(await readFile(path.join(out, f), "utf8")).toBeTruthy();
    // A ficha não é sobrescrita por uma nova execução.
    await writeFile(
      path.join(out, "revisao/ficha-capitulos.csv"),
      "preenchida",
    );
    await runChaptersSession({ mode: "run", env, repoRoot: ROOT, provider });
    expect(
      await readFile(path.join(out, "revisao/ficha-capitulos.csv"), "utf8"),
    ).toBe("preenchida");
  });

  it("sem fonte nem entrada: não monta nada nem chama", async () => {
    const out = await tmp();
    const r = await runChaptersSession({
      mode: "plan",
      env: { SIDERA_PALM_CHAPTERS_EVAL_OUT_DIR: out },
      repoRoot: ROOT,
      provider: haiku(),
    });
    expect(r.kind).toBe("no_input");
  });
});
