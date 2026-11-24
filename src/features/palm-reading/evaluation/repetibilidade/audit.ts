/**
 * Privacidade do experimento: nenhum conteúdo de imagem nos registros,
 * gravação só em pasta ignorada pelo Git, conferência do arquivo reenviado e
 * exclusão registrada (tamanho, SHA-256, data), com busca de cópias.
 *
 * Nada aqui coleta, baixa ou recupera fotografias.
 */
import { createHash } from "node:crypto";
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import { isIgnoredReportDir } from "../config";
import type { AnalysisRecord } from "./contract";

/** Assinaturas de imagem em texto (base64 de JPEG/PNG/WebP, data URL). */
const IMAGE_PATTERNS: { name: string; re: RegExp }[] = [
  { name: "data URL de imagem", re: /data:image\//i },
  { name: "JPEG em base64", re: /\/9j\/[A-Za-z0-9+/]{20}/ },
  { name: "PNG em base64", re: /iVBORw0KGgo/ },
  { name: "WebP em base64", re: /UklGR[A-Za-z0-9+/]{10,}V0VCU/ },
  // Trecho longo só com caracteres de base64: nenhum campo legítimo tem isso.
  { name: "bloco base64 longo", re: /[A-Za-z0-9+/=]{200,}/ },
];

export function findImageContent(text: string): string[] {
  return IMAGE_PATTERNS.filter((p) => p.re.test(text)).map((p) => p.name);
}

/** Falha se qualquer valor serializado parecer conteúdo de imagem. */
export function assertNoImageContent(value: unknown): void {
  const hits = findImageContent(JSON.stringify(value));
  if (hits.length)
    throw new Error(
      `Conteúdo de imagem nos registros (${hits.join(", ")}): gravação recusada.`,
    );
}

/** Grava os registros só em `avaliacao-ia/…` (ignorada pelo Git). */
export function saveRecords(
  dir: string,
  root: string,
  name: string,
  records: AnalysisRecord[],
): string {
  if (!isIgnoredReportDir(dir, root))
    throw new Error("Os registros só podem ser gravados em avaliacao-ia/.");
  if (!/^[a-z0-9-]+\.json$/.test(name))
    throw new Error("Nome de arquivo de registros inválido.");
  assertNoImageContent(records);
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, name);
  writeFileSync(file, JSON.stringify(records, null, 1));
  return file;
}

export function loadRecords(file: string): AnalysisRecord[] {
  const records = JSON.parse(readFileSync(file, "utf8")) as AnalysisRecord[];
  assertNoImageContent(records);
  return records;
}

export const fileSha256 = (file: string) =>
  createHash("sha256").update(readFileSync(file)).digest("hex");

/**
 * O arquivo reenviado é o mesmo registrado na exclusão de 19/11/2026?
 * O registro guardou os 16 primeiros caracteres do SHA-256.
 */
export function matchesRegistered(
  fullSha256: string,
  prefix16: string,
): boolean {
  return /^[0-9a-f]{16}$/.test(prefix16) && fullSha256.startsWith(prefix16);
}

export type DeletionEntry = {
  file: string;
  bytes: number;
  sha256Prefix16: string;
  deletedAt: string;
};

/** Apaga cada arquivo e devolve o registro (sem conteúdo, só metadados). */
export function deleteAndRecord(
  files: string[],
  now: () => Date = () => new Date(),
): DeletionEntry[] {
  return files.map((file) => {
    const bytes = statSync(file).size;
    const sha = fileSha256(file).slice(0, 16);
    rmSync(file);
    return {
      file: path.basename(file),
      bytes,
      sha256Prefix16: sha,
      deletedAt: now().toISOString(),
    };
  });
}

/** Procura, sob `dir`, arquivos com algum dos SHA-256 (prefixo) informados. */
export function findCopies(dir: string, prefixes: string[]): string[] {
  const found: string[] = [];
  const walk = (d: string) => {
    let entries: string[];
    try {
      entries = readdirSync(d);
    } catch {
      return;
    }
    for (const e of entries) {
      if (e === "node_modules" || e === ".git") continue;
      const p = path.join(d, e);
      let st;
      try {
        st = statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) walk(p);
      else if (st.isFile() && st.size > 0 && st.size < 50_000_000) {
        const sha = fileSha256(p);
        if (prefixes.some((x) => sha.startsWith(x))) found.push(p);
      }
    }
  };
  walk(dir);
  return found;
}
