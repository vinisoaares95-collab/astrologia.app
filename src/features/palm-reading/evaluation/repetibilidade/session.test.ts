// @vitest-environment node
/**
 * Ponto de entrada do piloto: testado SÓ com entradas sintéticas (imagens de
 * cor sólida geradas aqui, nenhuma fotografia) e provedor simulado. Nenhuma
 * rede, nenhum crédito.
 */
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { beforeEach, describe, expect, it } from "vitest";

import { clearHand } from "../../analysis/__fixtures__/observations";
import { fileSha256, findImageContent } from "./audit";
import { REP_STAGES } from "./config";
import type { AnalysisRecord } from "./contract";
import { evaluatePilotGate } from "./decision";
import { parseManifest, REP_TERM_VERSION } from "./manifest";
import {
  createRealRepProvider,
  executeStage,
  recordDeletion,
  repConfirmPhrase,
  repRealGate,
} from "./session";
import { createSimulatedRepProvider } from "./simulated-provider";

const TODAY = "2026-12-02";

async function syntheticJpeg(file: string, rgb: [number, number, number]) {
  await sharp({
    create: {
      width: 1200,
      height: 1600,
      channels: 3,
      background: { r: rgb[0], g: rgb[1], b: rgb[2] },
    },
  })
    .jpeg()
    .toFile(file);
}

type PhotoSpec = Record<string, unknown>;
const consent = (over: Record<string, unknown> = {}) => ({
  assinado: true,
  data: "2026-12-01",
  enviosAutorizados: 12,
  abrange: "original",
  ...over,
});

let repo: string;
let photosDir: string;
let outDir: string;
let manifestFile: string;

async function setup(specs: PhotoSpec[] = []) {
  repo = mkdtempSync(path.join(tmpdir(), "rep-repo-"));
  photosDir = mkdtempSync(path.join(tmpdir(), "rep-fotos-"));
  outDir = path.join(repo, "avaliacao-ia", "repetibilidade");
  mkdirSync(outDir, { recursive: true });
  await syntheticJpeg(path.join(photosDir, "p05.jpg"), [200, 150, 120]);
  await syntheticJpeg(path.join(photosDir, "p06.jpg"), [120, 150, 200]);
  const fotos = specs.length
    ? specs
    : [
        {
          codigo: "p05",
          arquivo: "p05.jpg",
          mao: "direita",
          origem: "original",
          pessoa: "P3",
          autorizacao: "AUT-REP-03",
          sha256Registrado: fileSha256(path.join(photosDir, "p05.jpg")).slice(
            0,
            16,
          ),
          consentimento: consent(),
        },
        {
          codigo: "p06",
          arquivo: "p06.jpg",
          mao: "esquerda",
          origem: "original",
          pessoa: "P3",
          autorizacao: "AUT-REP-03",
          sha256Registrado: fileSha256(path.join(photosDir, "p06.jpg")).slice(
            0,
            16,
          ),
          consentimento: consent(),
        },
      ];
  manifestFile = path.join(photosDir, "manifesto.json");
  writeFileSync(
    manifestFile,
    JSON.stringify({
      experimento: "repetibilidade-visual",
      termo: REP_TERM_VERSION,
      fotos,
    }),
  );
}

const provider = () =>
  createSimulatedRepProvider(new Map(), {
    fallback: () => ({ kind: "observation", raw: clearHand() }),
    matchHand: true,
  });

const stage = (
  s: "piloto" | "A",
  session: string,
  p = provider(),
  extra: { budgetUsd?: number } = {},
) =>
  executeStage({
    stage: s,
    session,
    photosDir,
    manifestFile,
    repoRoot: repo,
    outDir,
    provider: p,
    today: TODAY,
    ...extra,
  });

describe("piloto de ponta a ponta (sintético)", () => {
  beforeEach(() => setup());

  it("2 fotos × 5 análises: registros sem imagem, relatório, exclusão registrada", async () => {
    const p = provider();
    const r = await stage("piloto", "S1", p);
    expect(r.kind).toBe("done");
    if (r.kind !== "done") return;
    expect(p.calls).toBe(REP_STAGES.piloto.maxCalls);
    expect(r.run.records.filter((x) => x.outcome === "ok")).toHaveLength(10);
    expect(r.recordsFile).toMatch(
      /avaliacao-ia\/repetibilidade\/restrito\/piloto-s1\.json$/,
    );
    const raw = readFileSync(r.recordsFile, "utf8");
    expect(findImageContent(raw)).toEqual([]);
    expect(raw).not.toContain("p05.jpg");
    expect(readFileSync(r.reportFile, "utf8")).toContain(
      "Decisão pré-registrada",
    );
    // Critérios operacionais: tudo ok, menos a exclusão (ainda pendente).
    expect(r.pilotGate!.passed).toBe(false);
    expect(r.pilotGate!.checks.filter((c) => !c.ok).map((c) => c.name)).toEqual(
      ["exclusão feita e registrada"],
    );

    const log = recordDeletion({
      photosDir,
      manifestFile,
      files: ["p05.jpg", "p06.jpg"],
      searchRoots: [photosDir, repo],
      outDir,
      repoRoot: repo,
      now: () => new Date("2026-12-02T18:00:00Z"),
    });
    expect(log.entries.map((e) => e.file)).toEqual([
      "p05.jpg",
      "p06.jpg",
      "manifesto.json",
    ]);
    expect(log.copiesFound).toEqual([]);
    expect(existsSync(path.join(photosDir, "p05.jpg"))).toBe(false);
    expect(
      existsSync(path.join(outDir, "restrito", "exclusao-2026-12-02.json")),
    ).toBe(true);
    const records = JSON.parse(raw) as AnalysisRecord[];
    expect(
      evaluatePilotGate(records, {
        imageContentFound: false,
        deletionRecorded: true,
      }).passed,
    ).toBe(true);
  });

  it("Ampliação A é cumulativa: as 2 fotos do piloto recebem só mais 5", async () => {
    await stage("piloto", "S1");
    const p = provider();
    const r = await stage("A", "S2", p);
    expect(r.kind).toBe("done");
    if (r.kind !== "done") return;
    expect(p.calls).toBe(10);
    expect(new Set(r.run.records.map((x) => x.index))).toEqual(
      new Set([6, 7, 8, 9, 10]),
    );
  });

  it("não sobrescreve uma sessão e não aumenta o teto aprovado", async () => {
    const first = await stage("piloto", "S1", provider(), { budgetUsd: 5 });
    expect(first.kind === "done" && first.budgetUsd).toBe(
      REP_STAGES.piloto.budgetUsd,
    );
    const again = await stage("piloto", "S1");
    expect(again.kind).toBe("refused");
  });
});

describe("recusas (nenhuma análise é feita)", () => {
  const refuses = async (mutate: (f: PhotoSpec) => void, re: RegExp) => {
    await setup();
    const m = JSON.parse(readFileSync(manifestFile, "utf8"));
    mutate(m.fotos[0]);
    writeFileSync(manifestFile, JSON.stringify(m));
    const p = provider();
    const r = await stage("piloto", "S1", p);
    expect(r.kind).toBe("refused");
    if (r.kind === "refused") expect(r.problems.join(" ")).toMatch(re);
    expect(p.calls).toBe(0);
  };

  it("sem termo assinado", () =>
    refuses(
      (f) => ((f.consentimento as PhotoSpec).assinado = false),
      /não assinado/,
    ));
  it("arquivo diferente do original registrado", () =>
    refuses((f) => (f.sha256Registrado = "0".repeat(16)), /SHA-256 diferente/));
  it("campo não previsto (ex.: nome da pessoa)", () =>
    refuses((f) => (f.nome = "Fulana"), /campo não previsto "nome"/));
  it("envios autorizados acima de 12", () =>
    refuses(
      (f) => ((f.consentimento as PhotoSpec).enviosAutorizados = 20),
      /envios autorizados/,
    ));
  it("consentimento com data futura", () =>
    refuses(
      (f) => ((f.consentimento as PhotoSpec).data = "2027-01-01"),
      /no futuro/,
    ));
  it("foto nova no piloto (só originais)", () =>
    refuses(
      (f) => (f.origem = "nova"),
      /só aceita fotos de origem "original"/,
    ));
  it("consentimento que não abrange a origem", () =>
    refuses(
      (f) => ((f.consentimento as PhotoSpec).abrange = "nova"),
      /não abrange/,
    ));
  it("arquivo ausente", () =>
    refuses((f) => (f.arquivo = "p09.jpg"), /arquivo ausente/));

  it("pasta das fotos dentro do repositório; termo de outra versão; fotos demais", async () => {
    await setup();
    const inside = await executeStage({
      stage: "piloto",
      session: "S1",
      photosDir: path.join(repo, "fotos"),
      manifestFile,
      repoRoot: repo,
      outDir,
      provider: provider(),
      today: TODAY,
    });
    expect(inside.kind === "refused" && inside.problems.join(" ")).toMatch(
      /FORA do repositório/,
    );
    expect(
      parseManifest(
        { experimento: "repetibilidade-visual", termo: "REP-0", fotos: [{}] },
        "piloto",
        TODAY,
      ),
    ).toMatchObject({ ok: false });
    const three = Array.from({ length: 3 }, () => ({}));
    const r = parseManifest(
      {
        experimento: "repetibilidade-visual",
        termo: REP_TERM_VERSION,
        fotos: three,
      },
      "piloto",
      TODAY,
    );
    expect(r.ok === false && r.problems.join(" ")).toMatch(/no máximo 2 fotos/);
  });

  it("envios autorizados esgotados: a foto é recusada antes de qualquer chamada", async () => {
    await setup();
    const m = JSON.parse(readFileSync(manifestFile, "utf8"));
    for (const f of m.fotos)
      (f.consentimento as PhotoSpec).enviosAutorizados = 5;
    writeFileSync(manifestFile, JSON.stringify(m));
    await stage("piloto", "S1");
    const p = provider();
    const r = await stage("A", "S2", p);
    expect(r.kind === "refused" && r.problems.join(" ")).toMatch(
      /envios autorizados já usados/,
    );
    expect(p.calls).toBe(0);
  });
});

describe("conexão real desabilitada", () => {
  it("travada no código mesmo com todas as variáveis", () => {
    const env = {
      SIDERA_REP_REAL: "1",
      SIDERA_REP_CONFIRM: repConfirmPhrase("piloto"),
      SIDERA_REP_PHOTOS_DIR: tmpdir(),
      SIDERA_AI_KEY_VIA_PROXY: "1",
    };
    const gate = repRealGate(env, "piloto", "/nao/existe/repo");
    expect(gate.canCall).toBe(false);
    expect(gate.reasons.join(" ")).toMatch(/travada no código/);
    expect(() =>
      createRealRepProvider(env, "piloto", "/nao/existe/repo"),
    ).toThrow(/desabilitada/);
  });

  it("sem variáveis, todas as razões aparecem", () => {
    const gate = repRealGate({}, "A", "/repo");
    expect(gate.reasons.length).toBeGreaterThanOrEqual(5);
  });
});
