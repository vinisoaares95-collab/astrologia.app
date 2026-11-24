// @vitest-environment node
/**
 * Experimento de repetibilidade visual: ferramenta testada SÓ com dados
 * simulados. Nenhuma foto real, nenhuma rede, nenhuma chamada paga: as
 * "fotos" são bytes sintéticos e o provedor é o simulado.
 */
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { createBudget } from "../../../interpretation/ai/budget";
import {
  clearHand,
  insufficientPhoto,
} from "../../analysis/__fixtures__/observations";
import type { FeatureId } from "../../analysis/contract";
import { worstCallUsd } from "../estimate";
import {
  assertNoImageContent,
  deleteAndRecord,
  findCopies,
  findImageContent,
  matchesRegistered,
  saveRecords,
} from "./audit";
import { REP_MAX_SENDS_PER_PHOTO, REP_MODEL, REP_STAGES } from "./config";
import type { AnalysisRecord, PhotoOrigin, RepPhoto } from "./contract";
import {
  decide,
  evaluatePilotGate,
  summarizeGroup,
  verdictOf,
} from "./decision";
import {
  cellMetrics,
  consensusObservation,
  NONE,
  okObservations,
  pairKind,
  photoMetrics,
  readingOf,
  simulateConsensus,
} from "./metrics";
import { buildReport } from "./report";
import { runRepeatability, sha256 } from "./run";
import {
  createSimulatedRepProvider,
  type Script,
  type ScriptStep,
} from "./simulated-provider";

type Raw = ReturnType<typeof clearHand>;

/** Bytes sintéticos (não são imagem): só identificam a "foto" no simulador. */
const synthetic = (id: string) =>
  new Uint8Array(Buffer.from(`sintetico-${id}-`.repeat(64)));

function photo(
  id: string,
  origin: PhotoOrigin = "original",
  participant = "P1",
): RepPhoto {
  return {
    id,
    hand: "right",
    origin,
    participant,
    authorization: `AUT-REP-${id}`,
    bytes: synthetic(id),
  };
}

const obs = (raw: Raw): ScriptStep => ({ kind: "observation", raw });
const withValue = (f: FeatureId, value: string) => {
  const o = clearHand();
  (o.features[f] as { value: string }).value = value;
  return o;
};
const withHidden = (f: FeatureId, reason: string) => {
  const o = clearHand();
  o.features[f] = { visibility: "not_visible", reason };
  return o;
};

async function run(
  scripts: Record<string, Script>,
  opts: {
    target?: number;
    origin?: PhotoOrigin;
    participants?: string[];
    budgetUsd?: number;
    maxCalls?: number;
    previous?: AnalysisRecord[];
    session?: string;
  } = {},
) {
  const photos = Object.keys(scripts).map((id, i) =>
    photo(id, opts.origin, opts.participants?.[i] ?? `P${i + 1}`),
  );
  const provider = createSimulatedRepProvider(
    new Map(photos.map((p) => [sha256(p.bytes), scripts[p.id]])),
  );
  const result = await runRepeatability({
    photos,
    stage: "A",
    session: opts.session ?? "S1",
    targetPerPhoto: opts.target ?? 5,
    previous: opts.previous,
    provider,
    budget: createBudget(opts.budgetUsd ?? 2),
    maxCalls: opts.maxCalls ?? 70,
  });
  return { result, provider, photos };
}

const cell = (rs: AnalysisRecord[], f: FeatureId) =>
  cellMetrics(rs[0].photoId, f, okObservations(rs));

describe("casos simulados do protocolo", () => {
  it("1. classificações idênticas: concordância total, nenhuma divergência", async () => {
    const { result } = await run({ p01: () => obs(clearHand()) });
    const rs = result.records;
    expect(rs).toHaveLength(5);
    expect(rs.every((r) => r.outcome === "ok")).toBe(true);
    for (const f of ["hand.palmShape", "head.length", "life.arc"] as const) {
      const c = cell(rs, f);
      expect(c.agreement).toBe(1);
      expect(c.inversions + c.oscillations + c.reasonOnly).toBe(0);
    }
    const p = photoMetrics(rs);
    expect([p.ch6Agreement, p.ch7Agreement]).toEqual([1, 1]);
    expect(p.statusStable && p.retakeStable).toBe(true);
  });

  it("2. divergência gradual (média ↔ longa): inversão gradual, não oposta", async () => {
    const { result } = await run({
      p01: (n) => obs(n === 3 ? withValue("head.length", "long") : clearHand()),
    });
    const c = cell(result.records, "head.length");
    expect(
      pairKind("head.length", ...pairOf(result.records, "head.length", 1, 3)),
    ).toBe("inversao_gradual");
    expect(c.gradual).toBe(4);
    expect(c.opposite).toBe(0);
    expect(c.agreement).toBe(0.8);
  });

  it("3. inversão de significado (quadrada ↔ retangular): oposta e muda o capítulo 6", async () => {
    const { result } = await run({
      p01: (n) =>
        obs(n % 2 ? clearHand() : withValue("hand.palmShape", "rectangular")),
    });
    const c = cell(result.records, "hand.palmShape");
    expect(c.opposite).toBe(6); // 3 quadradas × 2 retangulares
    expect(c.gradual).toBe(0);
    const p = photoMetrics(result.records);
    expect(p.ch6Agreement).toBe(0.6);
    expect(p.ch7Agreement).toBe(1);
  });

  it("4. característica clara que vira indeterminada: oscilação, sem inversão", async () => {
    const { result } = await run({
      p01: (n) =>
        obs(n <= 2 ? withHidden("life.arc", "ambiguous") : clearHand()),
    });
    const c = cell(result.records, "life.arc");
    expect(c.inversions).toBe(0);
    expect(c.oscillations).toBe(6);
    expect(c.indeterminateShare).toBe(0.4);
    expect(c.modal).toBe("wide");
  });

  it("5. só o motivo de indisponibilidade muda: concordância de leitura total, estrita menor", async () => {
    const { result } = await run({
      p01: (n) =>
        obs(withHidden("fate.presence", n % 2 ? "too_faint" : "ambiguous")),
    });
    const c = cell(result.records, "fate.presence");
    expect(c.agreement).toBe(1);
    expect(c.modal).toBe(NONE);
    expect(c.strictAgreement).toBe(0.6);
    expect(c.reasonOnly).toBe(6);
    expect(c.inversions + c.oscillations).toBe(0);
  });

  it("6. alternância entre leitura completa e pedido de nova foto", async () => {
    const { result } = await run({
      p01: (n) => obs(n % 2 ? clearHand() : (insufficientPhoto() as Raw)),
    });
    const p = photoMetrics(result.records);
    expect(p.statusStable).toBe(false);
    expect(p.retakeStable).toBe(false);
    expect(p.retakeShare).toBe(0.4);
  });

  it("7. saída inválida: registrada, conta como envio, fica fora das métricas", async () => {
    const { result } = await run({
      p01: (n) => (n === 2 ? { kind: "invalid-json" } : obs(clearHand())),
    });
    const rs = result.records;
    expect(rs).toHaveLength(5);
    expect(rs[1].outcome).toBe("invalid_output");
    const p = photoMetrics(rs);
    expect([p.executed, p.valid, p.invalid]).toEqual([5, 4, 1]);
    expect(cell(rs, "hand.palmShape").n).toBe(4);
  });

  it("8. consenso entre três análises: divergência vira indeterminada; 2 de 3 fica com a maioria", () => {
    const a = clearHand();
    const b = withValue("hand.palmShape", "rectangular");
    const v = (raw: Raw) => okFrom(raw);
    const sample = [v(a), v(a), v(b)];
    expect(
      readingOf(consensusObservation(sample, "3de3"), "hand.palmShape"),
    ).toBe(NONE);
    expect(
      readingOf(consensusObservation(sample, "2de3"), "hand.palmShape"),
    ).toBe("square");
    expect(readingOf(consensusObservation(sample, "3de3"), "head.length")).toBe(
      "medium",
    );
    // Simulação determinística: 10 análises, 1 inversão isolada.
    const many = Array.from({ length: 10 }, (_, i) => v(i === 4 ? b : a));
    const s1 = simulateConsensus("p01", many)!;
    const s2 = simulateConsensus("p01", many)!;
    expect(s1).toEqual(s2);
    expect(s1.inversions["hand.palmShape"].k).toBe(0);
    // A palma divergente sai do consenso em parte dos sorteios, mas o
    // capítulo 6 continua disponível (dedos e tipo de mão não dependem só
    // dela): perder um item não é perder o capítulo.
    expect(
      readingOf(
        consensusObservation([many[4], many[0], many[1]], "3de3"),
        "hand.palmShape",
      ),
    ).toBe(NONE);
    expect(s1.ch6Loss).toBe(0);
    expect(s1.ch7Loss).toBe(0);
  });

  it("9. característica com amostra insuficiente: inconclusiva, nunca estável", async () => {
    // 2 fotos só (mínimo: 3 fotos com ≥ 5 classificadas).
    const { result } = await run({
      p01: () => obs(clearHand()),
      p02: () => obs(clearHand()),
    });
    const g = summarizeGroup("original", result.records);
    expect(g.features.every((f) => f.verdict === "inconclusiva")).toBe(true);
    // Uma célula com 4 classificadas não conta como avaliável.
    const cells = ["a", "b", "c"].map((id) =>
      cellMetrics(id, "life.arc", [
        ...Array.from({ length: 4 }, () => okFrom(clearHand())),
        okFrom(withHidden("life.arc", "too_faint")),
      ]),
    );
    expect(verdictOf(cells).verdict).toBe("inconclusiva");
    expect(decide([g], result.records).primary).toBe("inconclusivo");
  });

  it("10. interrupção por orçamento: para antes de reservar além do teto", async () => {
    const worst = worstCallUsd(REP_MODEL, "right");
    const { result, provider } = await run(
      { p01: () => obs(clearHand()), p02: () => obs(clearHand()) },
      { budgetUsd: worst * 1.2, target: 5 },
    );
    expect(provider.calls).toBe(1);
    expect(result.stoppedBy).toBe("budget");
    expect(result.records.at(-1)!.outcome).toBe("not_run");
    expect(result.spentUsd).toBeLessThanOrEqual(worst * 1.2);
  });
});

describe("limites, meta cumulativa e separação dos grupos", () => {
  it("meta cumulativa: as 5 do piloto contam para as 10 da Ampliação A", async () => {
    const scripts = { p01: () => obs(clearHand()) };
    const pilot = await run(scripts, { target: 5, session: "S1" });
    const ampl = await run(scripts, {
      target: 10,
      previous: pilot.result.records,
      session: "S2",
    });
    expect(ampl.result.calls).toBe(5);
    expect(ampl.result.records.map((r) => r.index)).toEqual([6, 7, 8, 9, 10]);
    const all = [...pilot.result.records, ...ampl.result.records];
    expect(Object.keys(photoMetrics(all).bySession)).toEqual(["S1", "S2"]);
  });

  it("limite de chamadas da etapa e teto de envios por foto", async () => {
    const byCalls = await run(
      { p01: () => obs(clearHand()) },
      {
        target: 10,
        maxCalls: 3,
      },
    );
    expect(byCalls.result.calls).toBe(3);
    expect(byCalls.result.stoppedBy).toBe("max_calls");
    const bySends = await run(
      { p01: () => obs(clearHand()) },
      {
        target: 20,
      },
    );
    expect(bySends.result.calls).toBe(REP_MAX_SENDS_PER_PHOTO);
    expect(bySends.result.stoppedBy).toBe("max_sends");
  });

  it("rodadas: cada foto uma vez por rodada; tokens, custo e duração registrados", async () => {
    const { result } = await run({
      p01: () => obs(clearHand()),
      p02: () => obs(clearHand()),
    });
    expect(
      result.records.map((r) => `${r.round}:${r.photoId}`).slice(0, 4),
    ).toEqual(["1:p01", "1:p02", "2:p01", "2:p02"]);
    const p = photoMetrics(result.records.filter((r) => r.photoId === "p02"));
    expect(p.inputTokens).toBeGreaterThan(0);
    expect(p.outputTokens).toBe(5 * 500);
    expect(p.meanWarmCostUsd).toBeLessThan(0.02);
    expect(result.records.every((r) => r.latencyMs >= 0)).toBe(true);
  });

  it("originais e novas nunca se misturam; diversidade de fotos e de pessoas", async () => {
    const orig = await run(
      { p01: () => obs(clearHand()), p02: () => obs(clearHand()) },
      { participants: ["P1", "P1"] },
    );
    const novas = await run(
      { n01: () => obs(clearHand()) },
      { origin: "nova", participants: ["P5"] },
    );
    const report = buildReport([
      ...orig.result.records,
      ...novas.result.records,
    ]);
    expect(
      report.groups.map((g) => [g.origin, g.photos.length, g.participants]),
    ).toEqual([
      ["original", 2, 1],
      ["nova", 1, 1],
    ]);
    expect(report.markdown).toContain("Arquivos originais reenviados");
    expect(report.markdown).toContain("Fotografias recém-capturadas");
  });
});

describe("decisões pré-registradas", () => {
  const three = (script: Script) => ({ p01: script, p02: script, p03: script });

  it("tudo estável em 3 fotos com 10 análises: manter", async () => {
    const { result } = await run(
      three(() => obs(clearHand())),
      { target: 10 },
    );
    const r = buildReport(result.records);
    expect(r.decision.primary).toBe("manter");
  });

  it("formato da palma instável e o resto estável: restringir", async () => {
    const { result } = await run(
      three((n) =>
        obs(
          n % 3 === 0
            ? withValue("hand.palmShape", "rectangular")
            : clearHand(),
        ),
      ),
      { target: 10 },
    );
    const r = buildReport(result.records);
    expect(r.decision.verdicts["hand.palmShape"]).toBe("instavel");
    expect(r.decision.primary).toBe("restringir");
  });

  it("instabilidade espalhada também nas claras, com consenso que resolve: consenso", async () => {
    const { result } = await run(
      three((n) => {
        if (n === 4) return obs(withValue("hand.palmShape", "rectangular"));
        if (n === 7) return obs(withValue("life.arc", "close"));
        if (n === 9) return obs(withValue("head.start", "separate"));
        return obs(clearHand());
      }),
      { target: 10 },
    );
    const r = buildReport(result.records);
    expect(r.decision.triggered.map((t) => t.key)).toContain("consenso");
    expect(r.decision.primary).toBe("consenso");
  });

  it("piloto: critérios só operacionais", async () => {
    const { result } = await run({
      p01: () => obs(clearHand()),
      p02: () => obs(clearHand()),
    });
    const ok = evaluatePilotGate(result.records, {
      imageContentFound: false,
      deletionRecorded: true,
    });
    expect(ok.passed).toBe(true);
    const bad = evaluatePilotGate(result.records, {
      imageContentFound: false,
      deletionRecorded: false,
    });
    expect(bad.passed).toBe(false);
  });
});

describe("privacidade e auditoria", () => {
  it("registros sem conteúdo de imagem; bytes zerados ao fim", async () => {
    const { result, photos } = await run({ p01: () => obs(clearHand()) });
    expect(() => assertNoImageContent(result.records)).not.toThrow();
    expect(photos[0].bytes.every((b) => b === 0)).toBe(true);
    const report = buildReport(result.records);
    // O relatório não traz a evidência textual do modelo.
    expect(report.markdown).not.toContain(
      clearHand().features["head.length"].evidence as string,
    );
  });

  it("detecta base64 de imagem e data URL; recusa gravar fora de avaliacao-ia/", () => {
    expect(findImageContent("x /9j/4AAQSkZJRgABAQAAAQABAAD y")).toContain(
      "JPEG em base64",
    );
    expect(findImageContent("data:image/jpeg;base64,AAAA")).toContain(
      "data URL de imagem",
    );
    expect(
      findImageContent("Linha central termina sob o dedo anelar."),
    ).toEqual([]);
    const root = mkdtempSync(path.join(tmpdir(), "rep-root-"));
    expect(() =>
      saveRecords(path.join(root, "docs"), root, "r.json", []),
    ).toThrow(/avaliacao-ia/);
    const file = saveRecords(
      path.join(root, "avaliacao-ia", "repetibilidade", "restrito"),
      root,
      "piloto.json",
      [],
    );
    expect(readFileSync(file, "utf8")).toBe("[]");
  });

  it("exclusão registrada (tamanho e SHA-256) e busca de cópias, com arquivo sintético", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "rep-del-"));
    const f = path.join(dir, "p01.bin");
    writeFileSync(f, Buffer.from("conteudo-sintetico"));
    const copy = path.join(dir, "copia.bin");
    writeFileSync(copy, Buffer.from("conteudo-sintetico"));
    const [entry] = deleteAndRecord(
      [f],
      () => new Date("2026-11-24T00:00:00Z"),
    );
    expect(entry.bytes).toBe(18);
    expect(entry.sha256Prefix16).toMatch(/^[0-9a-f]{16}$/);
    expect(findCopies(dir, [entry.sha256Prefix16])).toEqual([copy]);
    expect(
      matchesRegistered(
        `${entry.sha256Prefix16}${"0".repeat(48)}`,
        entry.sha256Prefix16,
      ),
    ).toBe(true);
    expect(matchesRegistered("ff".repeat(32), entry.sha256Prefix16)).toBe(
      false,
    );
  });

  it("orçamento das etapas: teto total e pior caso coberto no piloto", () => {
    const worst = worstCallUsd(REP_MODEL, "right");
    expect(REP_STAGES.piloto.maxCalls * worst).toBeLessThanOrEqual(
      REP_STAGES.piloto.budgetUsd,
    );
    const total = Object.values(REP_STAGES).reduce(
      (n, s) => n + s.budgetUsd,
      0,
    );
    expect(total).toBeCloseTo(5.2, 6);
  });
});

// ── auxiliares ─────────────────────────────────────────────────────────────

import { validatePalmObservation } from "../../analysis/validate-observation";

function okFrom(raw: Raw) {
  const v = validatePalmObservation(raw, raw.hand);
  if (!v.ok) throw new Error(JSON.stringify(v.errors));
  return v.observation;
}

function pairOf(rs: AnalysisRecord[], f: FeatureId, i: number, j: number) {
  const os = okObservations(rs);
  return [os[i - 1].features[f], os[j - 1].features[f]] as const;
}
