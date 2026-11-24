/**
 * Ponto de entrada de uma etapa do experimento (piloto, A ou B).
 *
 * manifesto → consentimento e envios → SHA-256 do original → preparação →
 * análises (provedor INJETADO, teto da etapa) → registros sem imagem →
 * relatório. A exclusão das fotos é um passo separado (`recordDeletion`).
 *
 * Tudo falha fechado: com qualquer problema no manifesto ou nos arquivos,
 * nenhuma análise é feita.
 *
 * Conexão real: travada no código (`REP_REAL_CONNECTION_ENABLED = false`) e,
 * além disso, atrás de um portão de variáveis. Nesta versão, só provedores
 * simulados podem ser usados.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { anthropicApiKey } from "../../../interpretation/ai/api-key";
import { createBudget } from "../../../interpretation/ai/budget";
import { createAnthropicVisionProvider } from "../../vision/anthropic-provider";
import type { VisionProvider } from "../../vision/contract";
import { isIgnoredReportDir, isOutside } from "../config";
import { prepareEvalPhoto, type PrepareResult } from "../intake";
import {
  deleteAndRecord,
  fileSha256,
  findCopies,
  findImageContent,
  loadRecords,
  matchesRegistered,
  saveRecords,
  type DeletionEntry,
} from "./audit";
import {
  REP_MODEL,
  REP_PILOT_PER_PHOTO,
  REP_STAGES,
  REP_TARGET_PER_PHOTO,
  type RepStage,
} from "./config";
import type { AnalysisRecord, RepPhoto, RunResult } from "./contract";
import { evaluatePilotGate, type PilotGate } from "./decision";
import { parseManifest, type ManifestPhoto } from "./manifest";
import { buildReport } from "./report";
import { runRepeatability, sha256 } from "./run";

type Env = Record<string, string | undefined>;

/**
 * Trava de código: a conexão real só pode ser ligada por uma mudança
 * revisada neste arquivo, depois da autorização específica da execução.
 */
export const REP_REAL_CONNECTION_ENABLED = false;

export const repConfirmPhrase = (stage: RepStage) =>
  `autorizo-repetibilidade-${stage}`;

export type RepGate = { canCall: boolean; reasons: string[] };

/** Portão da conexão real. Nunca lê nem devolve o valor da chave. */
export function repRealGate(
  env: Env,
  stage: RepStage,
  repoRoot: string,
): RepGate {
  const reasons: string[] = [];
  if (!REP_REAL_CONNECTION_ENABLED)
    reasons.push(
      "Conexão real travada no código até a autorização específica da execução.",
    );
  if (env.SIDERA_REP_REAL !== "1")
    reasons.push("Sem autorização de chamadas pagas (SIDERA_REP_REAL=1).");
  if (env.SIDERA_REP_CONFIRM !== repConfirmPhrase(stage))
    reasons.push(
      `Confirmação ausente (SIDERA_REP_CONFIRM=${repConfirmPhrase(stage)}).`,
    );
  const dir = env.SIDERA_REP_PHOTOS_DIR?.trim();
  if (!dir || !isOutside(dir, repoRoot))
    reasons.push(
      "Pasta das fotos ausente ou dentro do repositório (SIDERA_REP_PHOTOS_DIR).",
    );
  if (!anthropicApiKey(env) && env.SIDERA_AI_KEY_VIA_PROXY !== "1")
    reasons.push("Credencial ausente no servidor.");
  if (env.NODE_ENV === "production")
    reasons.push("O experimento não roda em produção.");
  return { canCall: reasons.length === 0, reasons };
}

/** Provedor real, só com o portão aberto (hoje, impossível: trava de código). */
export function createRealRepProvider(
  env: Env,
  stage: RepStage,
  repoRoot: string,
): VisionProvider {
  const gate = repRealGate(env, stage, repoRoot);
  if (!gate.canCall)
    throw new Error(`Conexão real desabilitada: ${gate.reasons.join(" ")}`);
  return createAnthropicVisionProvider({
    model: REP_MODEL,
    effort: "medium",
    apiKey: anthropicApiKey(env) ?? undefined,
  });
}

export type StageOutcome =
  | { kind: "refused"; problems: string[] }
  | {
      kind: "done";
      run: RunResult;
      /** Teto efetivo da etapa (nunca acima do aprovado). */
      budgetUsd: number;
      recordsFile: string;
      reportFile: string;
      /** Só no piloto: critérios operacionais (a exclusão ainda pendente). */
      pilotGate: PilotGate | null;
    };

const STAGE_TARGET: Record<RepStage, number> = {
  piloto: REP_PILOT_PER_PHOTO,
  A: REP_TARGET_PER_PHOTO,
  B: REP_TARGET_PER_PHOTO,
};

function previousRecords(dir: string): AnalysisRecord[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /^(piloto|a|b)-s\d{1,2}\.json$/.test(f))
    .sort()
    .flatMap((f) => loadRecords(path.join(dir, f)));
}

export async function executeStage(input: {
  stage: RepStage;
  /** Sessão (dia): S1, S2… */
  session: string;
  photosDir: string;
  manifestFile: string;
  repoRoot: string;
  /** `avaliacao-ia/repetibilidade` (ignorada pelo Git). */
  outDir: string;
  provider: VisionProvider;
  /** Pode só REDUZIR o teto da etapa; nunca aumentar. */
  budgetUsd?: number;
  today: string;
  prepare?: (bytes: Uint8Array) => Promise<PrepareResult>;
}): Promise<StageOutcome> {
  const problems: string[] = [];
  const cfg = REP_STAGES[input.stage];
  if (!/^S\d{1,2}$/.test(input.session)) problems.push("Sessão deve ser SNN.");
  if (!isOutside(input.photosDir, input.repoRoot))
    problems.push("A pasta das fotos precisa ficar FORA do repositório.");
  if (!isIgnoredReportDir(input.outDir, input.repoRoot))
    problems.push("Os registros só podem ir para avaliacao-ia/.");
  if (input.budgetUsd !== undefined && !(input.budgetUsd > 0))
    problems.push("Teto informado inválido.");
  if (problems.length) return { kind: "refused", problems };

  const recordsDir = path.join(input.outDir, "restrito");
  const recordsName = `${input.stage}-${input.session}.json`.toLowerCase();
  if (existsSync(path.join(recordsDir, recordsName)))
    return {
      kind: "refused",
      problems: [
        `Já existem registros de ${input.stage} na sessão ${input.session}.`,
      ],
    };

  let manifest;
  try {
    manifest = parseManifest(
      JSON.parse(readFileSync(input.manifestFile, "utf8")),
      input.stage,
      input.today,
    );
  } catch {
    return { kind: "refused", problems: ["Manifesto ausente ou ilegível."] };
  }
  if (!manifest.ok) return { kind: "refused", problems: manifest.problems };

  const previous = previousRecords(recordsDir);
  const prepare = input.prepare ?? ((b: Uint8Array) => prepareEvalPhoto(b));
  const photos: RepPhoto[] = [];
  const byCode = new Map<string, ManifestPhoto>();
  for (const m of manifest.photos) {
    byCode.set(m.code, m);
    const file = path.join(input.photosDir, m.file);
    if (!existsSync(file)) {
      problems.push(`${m.code}: arquivo ausente.`);
      continue;
    }
    if (
      m.origin === "original" &&
      !matchesRegistered(fileSha256(file), m.registeredSha256!)
    ) {
      problems.push(
        `${m.code}: o arquivo não é o original registrado (SHA-256 diferente). Recusado.`,
      );
      continue;
    }
    const original = new Uint8Array(readFileSync(file));
    const prepared = await prepare(original);
    original.fill(0);
    if (!prepared.ok) {
      problems.push(`${m.code}: ${prepared.reason}`);
      continue;
    }
    const used = previous.filter(
      (r) => r.photoId === m.code && r.outcome !== "not_run",
    );
    if (used.length && used[0].inputSha256 !== sha256(prepared.photo.bytes)) {
      problems.push(`${m.code}: a entrada preparada difere da usada antes.`);
      continue;
    }
    if (used.length >= m.sendsAllowed) {
      problems.push(
        `${m.code}: envios autorizados já usados (${used.length}).`,
      );
      continue;
    }
    photos.push({
      id: m.code,
      hand: m.hand,
      origin: m.origin,
      participant: m.participant,
      authorization: m.authorization,
      bytes: prepared.photo.bytes,
    });
  }
  if (problems.length) {
    for (const p of photos) p.bytes.fill(0);
    return { kind: "refused", problems };
  }

  const budgetUsd = Math.min(input.budgetUsd ?? cfg.budgetUsd, cfg.budgetUsd);
  const budget = createBudget(budgetUsd);
  const run = await runRepeatability({
    photos,
    stage: input.stage,
    session: input.session,
    targetPerPhoto: STAGE_TARGET[input.stage],
    previous,
    provider: input.provider,
    budget,
    maxCalls: cfg.maxCalls,
    sendsAllowed: (id) => byCode.get(id)!.sendsAllowed,
  });
  const recordsFile = saveRecords(
    recordsDir,
    input.repoRoot,
    recordsName,
    run.records,
  );
  const all = [...previous, ...run.records];
  const report = buildReport(all, [{ stage: input.stage, result: run }]);
  const reportFile = path.join(
    input.outDir,
    `relatorio-${input.stage.toLowerCase()}-${input.session.toLowerCase()}.md`,
  );
  if (findImageContent(report.markdown).length)
    throw new Error("Conteúdo de imagem no relatório: gravação recusada.");
  writeFileSync(reportFile, report.markdown);
  const pilotGate =
    input.stage === "piloto"
      ? evaluatePilotGate(run.records, {
          imageContentFound:
            findImageContent(readFileSync(recordsFile, "utf8")).length > 0,
          deletionRecorded: false,
        })
      : null;
  return { kind: "done", run, budgetUsd, recordsFile, reportFile, pilotGate };
}

export type DeletionLog = {
  deletedAt: string;
  entries: DeletionEntry[];
  copiesFound: string[];
  note: string;
};

/**
 * Exclusão ao término: apaga as fotos do manifesto e o próprio manifesto,
 * procura cópias e grava o registro (sem conteúdo) em `restrito/`.
 */
export function recordDeletion(input: {
  photosDir: string;
  manifestFile: string;
  /** Arquivos do manifesto (nomes, sem pastas). */
  files: string[];
  searchRoots: string[];
  outDir: string;
  repoRoot: string;
  now?: () => Date;
}): DeletionLog {
  const now = input.now ?? (() => new Date());
  const targets = [
    ...input.files.map((f) => path.join(input.photosDir, path.basename(f))),
    input.manifestFile,
  ].filter((f) => existsSync(f));
  const entries = deleteAndRecord(targets, now);
  const copiesFound = input.searchRoots.flatMap((r) =>
    findCopies(
      r,
      entries.map((e) => e.sha256Prefix16),
    ),
  );
  const log: DeletionLog = {
    deletedAt: now().toISOString(),
    entries,
    copiesFound,
    note: "Exclusão local com remoção comum de arquivo. Não alcança o que já foi enviado ao provedor, que segue a retenção dele.",
  };
  const dir = path.join(input.outDir, "restrito");
  if (!isIgnoredReportDir(dir, input.repoRoot))
    throw new Error("O registro de exclusão só pode ir para avaliacao-ia/.");
  writeFileSync(
    path.join(dir, `exclusao-${log.deletedAt.slice(0, 10)}.json`),
    JSON.stringify(log, null, 1),
  );
  return log;
}
