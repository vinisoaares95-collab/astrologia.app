// @vitest-environment node
/**
 * Etapa B da 03F.2 com SIMULADORES e imagens SINTÉTICAS: nenhuma chamada
 * paga, nenhuma foto real. Os provedores simulados usam o nome dos modelos
 * do produto para que os tetos de custo funcionem como na execução real.
 */
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterEach, describe, expect, it } from "vitest";

import { createBudget } from "../../../interpretation/ai/budget";
import {
  createMockPalmTextProvider,
  type MockPalmTextScenario,
} from "../../chapters/mock-text-provider";
import { syntheticJpeg } from "../../server/test-jpeg";
import { PALM_REPORT_BUDGET_USD } from "../../server/config";
import {
  createMockVisionProvider,
  type MockVisionScenario,
} from "../../vision/mock-provider";
import { E2E_BUDGET_BRL, E2E_CONFIRM, e2eBudgetBrl, e2eGate } from "./config";
import {
  e2eSummary,
  parseCsv,
  renderE2EReview,
  renderE2EScore,
  renderE2ESheet,
  renderE2ETechnical,
  scoreE2E,
} from "./report";
import { runE2EEvaluation } from "./run";
import { runE2ESession } from "./session";

const ROOT = path.resolve(__dirname, "../../../../..");
const temps: string[] = [];
afterEach(async () => {
  await Promise.all(
    temps.splice(0).map((d) => rm(d, { recursive: true, force: true })),
  );
});
const tmp = async () => {
  const d = await mkdtemp(path.join(os.tmpdir(), "sidera-03f2b-"));
  temps.push(d);
  return d;
};

const vision = (s: MockVisionScenario[]) =>
  createMockVisionProvider((_, call) => s[Math.min(call, s.length - 1)], {
    model: "claude-sonnet-5-5",
  });
const text = (s: MockPalmTextScenario[] = ["valid"]) =>
  createMockPalmTextProvider(s, { model: "claude-haiku-5-5" });
const photos = () =>
  ["foto-05", "foto-01", "foto-04"].map((id, i) => ({
    id,
    hand: (i % 2 ? "left" : "right") as "left" | "right",
    // Bytes diferentes por foto (senão o cache do endpoint responderia).
    bytes: syntheticJpeg(1200 + i * 8, 1600),
  }));

describe("portão", () => {
  it("bloqueado por padrão; variáveis de outras fases não abrem", () => {
    const g = e2eGate({ SIDERA_PALM_EVAL_DIR: "/tmp/fotos" }, ROOT);
    expect(g.canPlan).toBe(true);
    expect(g.canCall).toBe(false);
    const other = e2eGate(
      {
        SIDERA_PALM_EVAL_DIR: "/tmp/fotos",
        SIDERA_PALM_EVAL_PAID: "1",
        SIDERA_PALM_CHAPTERS_EVAL_PAID: "1",
        SIDERA_PALM_CHAPTERS_EVAL_CONFIRM: "autorizo-capitulos-03f2-etapa-a",
        SIDERA_PALM_VISION_REAL: "1",
        SIDERA_AI_KEY_VIA_PROXY: "1",
      },
      ROOT,
    );
    expect(other.canCall).toBe(false);
    const ok = {
      SIDERA_PALM_EVAL_DIR: "/tmp/fotos",
      SIDERA_PALM_E2E_EVAL_PAID: "1",
      SIDERA_PALM_E2E_EVAL_CONFIRM: E2E_CONFIRM,
      SIDERA_AI_KEY_VIA_PROXY: "1",
    };
    expect(e2eGate(ok, ROOT).canCall).toBe(true);
    expect(e2eGate({ ...ok, NODE_ENV: "production" }, ROOT).canCall).toBe(
      false,
    );
  });

  it("fotos dentro do repositório e saída fora de avaliacao-ia/ são recusadas", () => {
    expect(
      e2eGate({ SIDERA_PALM_EVAL_DIR: path.join(ROOT, "fotos") }, ROOT).canPlan,
    ).toBe(false);
    expect(e2eGate({}, ROOT).canPlan).toBe(false);
    expect(
      e2eGate(
        {
          SIDERA_PALM_EVAL_DIR: "/tmp/f",
          SIDERA_PALM_E2E_EVAL_OUT_DIR: path.join(ROOT, "src"),
        },
        ROOT,
      ).canPlan,
    ).toBe(false);
  });

  it("teto de R$ 3,00 que uma variável só pode baixar", () => {
    expect(E2E_BUDGET_BRL).toBe(3);
    expect(e2eBudgetBrl({})).toBe(3);
    expect(e2eBudgetBrl({ SIDERA_PALM_E2E_EVAL_BUDGET_BRL: "10" })).toBe(3);
    expect(e2eBudgetBrl({ SIDERA_PALM_E2E_EVAL_BUDGET_BRL: "1" })).toBe(1);
  });
});

describe("fluxo do endpoint com simuladores", () => {
  it("3 relatórios: boa cobertura, poucas linhas, insuficiente", async () => {
    const v = vision(["clear", "lines-missing", "insufficient"]);
    const t = text();
    const run = await runE2EEvaluation({
      photos: photos(),
      vision: v,
      text: t,
      budget: createBudget(0.5),
    });
    expect(run.visionModel).toBe("claude-sonnet-5-5");
    expect(run.textModel).toBe("claude-haiku-5-5");
    expect(run.reportBudgetUsd).toBe(PALM_REPORT_BUDGET_USD);
    const [good, few, bad] = run.cases;
    expect(good.http).toBe(200);
    // Cada foto tem o próprio recibo (3 análises): sobra 2 após a leitura.
    expect(good.remaining).toBe(2);
    expect(good.chapters.map((c) => [c.status, c.source])).toEqual([
      ["content", "ai"],
      ["content", "ai"],
    ]);
    expect(few.chapters.map((c) => c.status)).toEqual([
      "content",
      "unavailable",
    ]);
    expect(few.chapters[1].unavailableMessage).toMatch(/nova foto/u);
    // Insuficiente: nenhuma chamada de texto, pedido de nova foto.
    expect(bad.result?.status).toBe("insufficient");
    expect(bad.result?.retakeRecommended).toBe(true);
    expect(bad.calls.filter((c) => c.kind === "text")).toEqual([]);
    // Cada chamada registrada com modelo, tokens, custo e latência.
    expect(good.calls.map((c) => c.kind).sort()).toEqual([
      "text",
      "text",
      "vision",
    ]);
    for (const c of run.cases.flatMap((x) => x.calls)) {
      expect(c.outcome).toBe("ok");
      expect(c.costUsd).toBeGreaterThan(0);
      expect(c.latencyMs).toBeGreaterThanOrEqual(0);
    }
    expect(run.spentUsd).toBeCloseTo(
      run.cases.reduce((n, c) => n + c.costUsd, 0),
      6,
    );
    // Nada da trilha interna vai ao resultado do cliente.
    expect(JSON.stringify(run.cases.map((c) => c.result))).not.toMatch(
      /"source"|attempts/u,
    );
    // Fotos zeradas na memória depois do envio.
    expect(v.calls).toHaveLength(3);
  });

  it("reserva da biblioteca registrada com motivo", async () => {
    const run = await runE2EEvaluation({
      photos: photos().slice(0, 1),
      vision: vision(["clear"]),
      text: text(["longevity"]),
      budget: createBudget(0.5),
    });
    const [c6, c7] = run.cases[0].chapters;
    expect(c6.source).toBe("ai");
    expect(c7.source).toBe("library");
    expect(c7.fallbackReason).toMatch(/FORBIDDEN_LANGUAGE/u);
    expect(c7.attempts.map((a) => a.outcome)).toEqual([
      "validation_failed",
      "validation_failed",
    ]);
    expect(e2eSummary(run).fromLibrary).toBe(1);
  });

  it("falha da visão: o aparelho recebe o erro genérico e os outros relatórios seguem", async () => {
    const run = await runE2EEvaluation({
      photos: photos().slice(0, 2),
      vision: vision(["error:unavailable", "error:unavailable", "clear"]),
      text: text(),
      budget: createBudget(0.5),
    });
    expect(run.cases[0].http).toBe(503);
    // Falha técnica não consome a tentativa da pessoa.
    expect(run.cases[0].remaining).toBe(3);
    expect(run.cases[0].error).toBe("temporarily_unavailable");
    expect(run.cases[0].calls.map((c) => c.outcome)).toEqual([
      "error:unavailable",
      "error:unavailable",
    ]);
    expect(run.cases[1].http).toBe(200);
  });

  it("chamada interrompida por tempo: custo possível registrado e debitado do teto pelo pior caso", async () => {
    const run = await runE2EEvaluation({
      photos: photos().slice(0, 1),
      vision: vision(["error:timeout", "error:timeout"]),
      text: text(),
      budget: createBudget(0.5),
    });
    const c = run.cases[0];
    expect(c.http).toBe(503);
    expect(c.calls.map((x) => x.outcome)).toEqual([
      "error:timeout",
      "error:timeout",
    ]);
    for (const x of c.calls) {
      expect(x.costUsd).toBeNull();
      expect(x.possibleUsd).toBeGreaterThan(0);
      expect(x.timeoutMs).toBeLessThanOrEqual(45_000);
    }
    expect(c.possibleExtraUsd).toBeGreaterThan(0);
    // O teto já debitou o pior caso das chamadas que podem ter sido cobradas.
    expect(run.spentUsd).toBeCloseTo(c.possibleExtraUsd, 6);
    expect(renderE2ETechnical(run, 5.5)).toMatch(/possível US\$/u);
    // Para "nenhum acima do teto", conta o custo possível.
    expect(e2eSummary(run).maxReportUsd).toBeCloseTo(c.possibleExtraUsd, 6);
  });

  it("sem saldo para o teto de um relatório: nada é chamado", async () => {
    const v = vision(["clear"]);
    const t = text();
    const run = await runE2EEvaluation({
      photos: photos(),
      vision: v,
      text: t,
      budget: createBudget(PALM_REPORT_BUDGET_USD * 0.9),
    });
    expect(run.cases.every((c) => c.status === "not_run")).toBe(true);
    expect(run.stoppedByBudget).toBe(true);
    expect(v.calls).toHaveLength(0);
    expect(t.calls).toHaveLength(0);
  });

  it("modelos diferentes dos do produto são recusados", async () => {
    await expect(
      runE2EEvaluation({
        photos: photos(),
        vision: createMockVisionProvider(["clear"], {
          model: "claude-haiku-5-5",
        }),
        text: text(),
        budget: createBudget(0.5),
      }),
    ).rejects.toThrow(/modelos padrão/u);
  });

  it("relatórios: técnico com origem; revisão e ficha sem origem", async () => {
    const run = await runE2EEvaluation({
      photos: photos(),
      vision: vision(["clear", "lines-missing", "insufficient"]),
      text: text(),
      budget: createBudget(0.5),
    });
    expect(renderE2ETechnical(run, 5.5)).toMatch(/c6: ai/u);
    const review = renderE2EReview(run);
    expect(review).not.toMatch(/\bai\b|biblioteca|library/iu);
    expect(review).toMatch(/Indisponível/u);
    const sheet = parseCsv(renderE2ESheet(run));
    expect(sheet.map((r) => `${r.caso}:${r.capitulo}:${r.status}`)).toEqual([
      "foto-05:6:conteudo",
      "foto-05:7:conteudo",
      "foto-01:6:conteudo",
      "foto-01:7:indisponivel",
      "foto-04:6:indisponivel",
      "foto-04:7:indisponivel",
    ]);
    const filled = sheet.map((r) => ({
      ...r,
      inventou: "nao",
      seguranca: "ok",
      fidelidade_ok: r.status === "conteudo" ? "sim" : "na",
      indisponivel_ok: r.status === "indisponivel" ? "sim" : "na",
      clareza: r.status === "conteudo" ? "5" : "na",
      naturalidade: r.status === "conteudo" ? "4" : "na",
      experiencia: "4",
    }));
    const ok = scoreE2E(filled, run);
    expect(Object.values(ok.approved).every(Boolean)).toBe(true);
    filled[0].seguranca = "problema";
    const bad = scoreE2E(filled, run);
    expect(bad.approved["Nenhum problema de segurança (bloqueante)"]).toBe(
      false,
    );
    expect(renderE2EScore(bad)).toMatch(/\*\*não\*\*/u);
  });
});

describe("sessão (pastas temporárias, simuladores)", () => {
  async function photosDir(readable = true) {
    const dir = await tmp();
    const files = ["p05.jpg", "p01.jpg", "p04.jpg"];
    for (const [i, f] of files.entries())
      await writeFile(
        path.join(dir, f),
        readable
          ? await sharp({
              create: {
                width: 1200,
                height: 1600 + i * 8,
                channels: 3,
                background: "#c99",
              },
            })
              .jpeg()
              .toBuffer()
          : "não é uma foto",
      );
    await writeFile(
      path.join(dir, "mapa-fotos.json"),
      JSON.stringify({
        "foto-05": { arquivo: "p05.jpg" },
        "foto-01": { arquivo: "p01.jpg" },
        "foto-04": { arquivo: "p04.jpg" },
      }),
    );
    await writeFile(
      path.join(dir, "manifesto.json"),
      JSON.stringify([
        { arquivo: "p05.jpg", mao: "direita" },
        { arquivo: "p01.jpg", mao: "esquerda" },
        { arquivo: "p04.jpg", mao: "esquerda" },
      ]),
    );
    return dir;
  }

  it("plano não abre as fotos e calcula o pior caso pelo teto do produto", async () => {
    // Arquivos ilegíveis: o plano funciona porque não os lê.
    const dir = await photosDir(false);
    const out = await tmp();
    const r = await runE2ESession({
      mode: "plan",
      env: { SIDERA_PALM_EVAL_DIR: dir, SIDERA_PALM_E2E_EVAL_OUT_DIR: out },
      repoRoot: ROOT,
    });
    expect(r.kind).toBe("planned");
    if (r.kind !== "planned") return;
    expect(r.plan.worstUsd).toBeCloseTo(3 * PALM_REPORT_BUDGET_USD, 6);
    expect(r.plan.withinBudget).toBe(true);
    expect(r.plan.perCase.map((c) => [c.id, c.hand])).toEqual([
      ["foto-05", "right"],
      ["foto-01", "left"],
      ["foto-04", "left"],
    ]);
    expect(await readdir(out)).toEqual(["plano.md"]);
  });

  it("execução: só com o portão aberto, uma vez, sem gravar fotos", async () => {
    const dir = await photosDir();
    const out = await tmp();
    const base = {
      SIDERA_PALM_EVAL_DIR: dir,
      SIDERA_PALM_E2E_EVAL_OUT_DIR: out,
    };
    const providers = {
      vision: vision(["clear", "lines-missing", "insufficient"]),
      text: text(),
    };
    expect(
      (
        await runE2ESession({
          mode: "run",
          env: base,
          repoRoot: ROOT,
          providers,
        })
      ).kind,
    ).toBe("blocked");
    expect(providers.vision.calls).toHaveLength(0);
    const env = {
      ...base,
      SIDERA_PALM_E2E_EVAL_PAID: "1",
      SIDERA_PALM_E2E_EVAL_CONFIRM: E2E_CONFIRM,
      SIDERA_AI_KEY_VIA_PROXY: "1",
    };
    const r = await runE2ESession({
      mode: "run",
      env,
      repoRoot: ROOT,
      providers,
    });
    expect(r.kind).toBe("ran");
    const files = (await readdir(out, { recursive: true })).map(String).sort();
    expect(files).toEqual(
      [
        "plano.md",
        "restrito",
        "restrito/relatorio-tecnico.md",
        "restrito/resultados.json",
        "revisao",
        "revisao/ficha-ponta-a-ponta.csv",
        "revisao/guia.md",
        "revisao/relatorios.md",
      ].sort(),
    );
    expect(files.some((f) => /\.(jpe?g|png|webp|heic)$/iu.test(f))).toBe(false);
    const saved = await readFile(
      path.join(out, "restrito/resultados.json"),
      "utf8",
    );
    expect(saved).not.toMatch(/base64|evidence|p0\d\.jpg/u);
    // Não repete.
    const again = await runE2ESession({
      mode: "run",
      env,
      repoRoot: ROOT,
      providers,
    });
    expect(again.kind).toBe("already_ran");
    expect(providers.vision.calls).toHaveLength(3);
  });

  it("apuração a partir da ficha preenchida", async () => {
    const dir = await photosDir();
    const out = await tmp();
    const env = {
      SIDERA_PALM_EVAL_DIR: dir,
      SIDERA_PALM_E2E_EVAL_OUT_DIR: out,
      SIDERA_PALM_E2E_EVAL_PAID: "1",
      SIDERA_PALM_E2E_EVAL_CONFIRM: E2E_CONFIRM,
      SIDERA_AI_KEY_VIA_PROXY: "1",
    };
    await runE2ESession({
      mode: "run",
      env,
      repoRoot: ROOT,
      providers: {
        vision: vision(["clear", "lines-missing", "insufficient"]),
        text: text(),
      },
    });
    const sheetPath = path.join(out, "revisao/ficha-ponta-a-ponta.csv");
    const rows = parseCsv(await readFile(sheetPath, "utf8"));
    const header = Object.keys(rows[0]);
    const filled = rows.map((r) =>
      header.map(
        (h) =>
          (
            ({ inventou: "nao", seguranca: "ok", experiencia: "4" }) as Record<
              string,
              string
            >
          )[h] ??
          (h === "fidelidade_ok"
            ? r.status === "conteudo"
              ? "sim"
              : "na"
            : h === "indisponivel_ok"
              ? r.status === "indisponivel"
                ? "sim"
                : "na"
              : ["clareza", "naturalidade"].includes(h)
                ? r.status === "conteudo"
                  ? "5"
                  : "na"
                : r[h]),
      ),
    );
    await mkdir(path.dirname(sheetPath), { recursive: true });
    await writeFile(
      sheetPath,
      [header.join(","), ...filled.map((r) => r.join(","))].join("\n"),
    );
    expect(
      (await runE2ESession({ mode: "score", env, repoRoot: ROOT })).kind,
    ).toBe("scored");
    expect(
      await readFile(path.join(out, "restrito/apuracao.md"), "utf8"),
    ).toMatch(/Os 3 relatórios respondem/u);
  });
});
