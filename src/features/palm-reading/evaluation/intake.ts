/**
 * Recebimento das fotos da avaliação (Fase 03F.1).
 *
 * A pasta (SIDERA_PALM_EVAL_DIR) fica FORA do repositório e contém:
 * - as fotos originais, enviadas pelos voluntários;
 * - `manifesto.json`: [{ "arquivo": "x.jpg", "mao": "direita"|"esquerda",
 *   "autorizacao": "AUT-03F-01" }], sem nomes de pessoas;
 * - `mapa-fotos.json` (gerado aqui): identificador opaco → arquivo, para o
 *   revisor. Fica na pasta das fotos e é apagado junto com elas.
 *
 * Cada foto passa pela MESMA preparação e pelas MESMAS checagens do
 * endpoint comercial: orientação corrigida, lado maior ≤ 2 576 px, ≤ 4 784
 * tokens visuais, JPEG sem metadados, lado menor ≥ 600 px, ≤ 2,5 MB. A
 * preparação usa `sharp` (disponível com o Next) no lugar do canvas do
 * navegador; o resultado é conferido com `inspectJpeg`, como no servidor.
 * Nenhum arquivo preparado é gravado: tudo fica em memória.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { PalmHand } from "../consent";
import { MIN_SHORT_SIDE_PX } from "../lib/image-validation";
import { inspectJpeg } from "../lib/jpeg";
import {
  JPEG_QUALITY_STEPS,
  MAX_LONG_EDGE_PX,
  MAX_PREPARED_BYTES,
  MAX_VISUAL_TOKENS,
  targetDimensions,
  visualTokens,
} from "../lib/prepare-image";
import { EVAL_MAX_PHOTOS } from "./config";
import { diagnose, sampleSize, type TechnicalDiagnosis } from "./technical";

export const MANIFEST_FILE = "manifesto.json";
export const PHOTO_MAP_FILE = "mapa-fotos.json";
const AUTH_RE = /^AUT-03F-\d{2}$/u;
const FILE_RE = /^[\w.-]+\.(?:jpe?g|png|heic|webp)$/iu;

export type ManifestEntry = { file: string; hand: PalmHand; auth: string };

export type ManifestCheck =
  { ok: true; entries: ManifestEntry[] } | { ok: false; errors: string[] };

/** Confere o manifesto (sem ler as fotos). Mensagens sem nomes de arquivo. */
export function parseManifest(raw: unknown): ManifestCheck {
  const errors: string[] = [];
  if (!Array.isArray(raw))
    return { ok: false, errors: ["Manifesto não é uma lista."] };
  if (raw.length === 0) errors.push("Manifesto vazio.");
  if (raw.length > EVAL_MAX_PHOTOS)
    errors.push(`No máximo ${EVAL_MAX_PHOTOS} fotos.`);
  const entries: ManifestEntry[] = [];
  const seenFiles = new Set<string>();
  const seenAuth = new Set<string>();
  raw.forEach((e: Record<string, unknown>, i) => {
    const n = `Item ${i + 1}`;
    const keys = Object.keys(e ?? {})
      .sort()
      .join(",");
    if (keys !== "arquivo,autorizacao,mao") {
      errors.push(`${n}: campos esperados arquivo, mao, autorizacao.`);
      return;
    }
    const file = String(e.arquivo);
    if (!FILE_RE.test(file) || file !== path.basename(file))
      errors.push(`${n}: nome de arquivo inválido (só o nome, sem pastas).`);
    if (seenFiles.has(file)) errors.push(`${n}: arquivo repetido.`);
    seenFiles.add(file);
    const hand =
      e.mao === "direita" ? "right" : e.mao === "esquerda" ? "left" : null;
    if (!hand) errors.push(`${n}: mão deve ser "direita" ou "esquerda".`);
    const auth = String(e.autorizacao);
    if (!AUTH_RE.test(auth))
      errors.push(`${n}: autorização no formato AUT-03F-NN (sem nomes).`);
    if (seenAuth.has(auth)) errors.push(`${n}: autorização repetida.`);
    seenAuth.add(auth);
    if (hand) entries.push({ file, hand, auth });
  });
  return errors.length ? { ok: false, errors } : { ok: true, entries };
}

export type PreparedPhoto = {
  id: string;
  hand: PalmHand;
  bytes: Uint8Array;
  width: number;
  height: number;
  visualTokens: number;
  /** Resolução, compressão, foco e luz (informativo; não bloqueia). */
  diagnosis: Omit<TechnicalDiagnosis, "id">;
};

export type PrepareResult =
  | { ok: true; photo: Omit<PreparedPhoto, "id" | "hand"> }
  | { ok: false; reason: string };

export type SharpLike = (input: Uint8Array) => {
  rotate(): ReturnType<SharpLike>;
  resize(w: number, h: number, o: { fit: "fill" }): ReturnType<SharpLike>;
  jpeg(o: { quality: number }): ReturnType<SharpLike>;
  greyscale(): ReturnType<SharpLike>;
  raw(): ReturnType<SharpLike>;
  metadata(): Promise<{
    width?: number;
    height?: number;
    orientation?: number;
    format?: string;
  }>;
  toBuffer(): Promise<Buffer>;
};

async function loadSharp(): Promise<SharpLike> {
  const mod = (await import("sharp")) as unknown as { default: SharpLike };
  return mod.default;
}

/** Prepara UMA foto como o produto faria e aplica as checagens do servidor. */
export async function prepareEvalPhoto(
  original: Uint8Array,
  sharp?: SharpLike,
): Promise<PrepareResult> {
  const s = sharp ?? (await loadSharp());
  try {
    const meta = await s(original).metadata();
    if (!meta.width || !meta.height)
      return { ok: false, reason: "Imagem ilegível." };
    // Orientações 5–8 trocam largura e altura.
    const swap = (meta.orientation ?? 1) >= 5;
    const w0 = swap ? meta.height : meta.width;
    const h0 = swap ? meta.width : meta.height;
    if (Math.min(w0, h0) < MIN_SHORT_SIDE_PX)
      return {
        ok: false,
        reason: `Resolução abaixo do mínimo (${w0}×${h0}; mínimo ${MIN_SHORT_SIDE_PX} px no lado menor, sem ampliação).`,
      };
    const t = targetDimensions(w0, h0);
    for (const q of JPEG_QUALITY_STEPS) {
      const out = await s(original)
        .rotate()
        .resize(t.width, t.height, { fit: "fill" })
        .jpeg({ quality: Math.round(q * 100) })
        .toBuffer();
      if (out.byteLength > MAX_PREPARED_BYTES) {
        out.fill(0);
        continue;
      }
      const bytes = new Uint8Array(out);
      const info = inspectJpeg(bytes);
      if (
        !info.ok ||
        info.metadata.length > 0 ||
        Math.min(info.width, info.height) < MIN_SHORT_SIDE_PX ||
        Math.max(info.width, info.height) > MAX_LONG_EDGE_PX ||
        visualTokens(info.width, info.height) > MAX_VISUAL_TOKENS
      ) {
        bytes.fill(0);
        return {
          ok: false,
          reason: "A foto preparada não passou nas checagens do servidor.",
        };
      }
      // Amostra em cinza da foto preparada, como na tela de foto.
      const g = sampleSize(info.width, info.height);
      const gray = await s(bytes)
        .resize(g.width, g.height, { fit: "fill" })
        .greyscale()
        .raw()
        .toBuffer();
      const diagnosis = diagnose({
        original: {
          bytes: original,
          width: w0,
          height: h0,
          format: meta.format ?? "desconhecido",
        },
        prepared: { width: info.width, height: info.height },
        gray: { data: gray, width: g.width, height: g.height },
      });
      gray.fill(0);
      return {
        ok: true,
        photo: {
          bytes,
          width: info.width,
          height: info.height,
          visualTokens: visualTokens(info.width, info.height),
          diagnosis,
        },
      };
    }
    return { ok: false, reason: "A foto não coube no limite de 2,5 MB." };
  } catch {
    return { ok: false, reason: "Imagem ilegível." };
  } finally {
    original.fill(0);
  }
}

export type IntakeResult = {
  photos: PreparedPhoto[];
  /** Só identificadores e motivos (sem nomes de arquivo). */
  rejected: { id: string; reason: string }[];
  errors: string[];
};

/**
 * Lê o manifesto e prepara as fotos em memória. Grava apenas o
 * `mapa-fotos.json` na própria pasta das fotos (fora do repositório).
 */
export async function intakePhotos(
  dir: string,
  options: { sharp?: SharpLike; writeMap?: boolean } = {},
): Promise<IntakeResult> {
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(path.join(dir, MANIFEST_FILE), "utf8"));
  } catch {
    return {
      photos: [],
      rejected: [],
      errors: [`Manifesto ausente ou inválido (${MANIFEST_FILE}).`],
    };
  }
  const manifest = parseManifest(raw);
  if (!manifest.ok)
    return { photos: [], rejected: [], errors: manifest.errors };

  const photos: PreparedPhoto[] = [];
  const rejected: IntakeResult["rejected"] = [];
  const map: Record<string, { arquivo: string; autorizacao: string }> = {};
  for (const [i, e] of manifest.entries.entries()) {
    const id = `foto-${String(i + 1).padStart(2, "0")}`;
    map[id] = { arquivo: e.file, autorizacao: e.auth };
    let original: Uint8Array;
    try {
      original = new Uint8Array(await readFile(path.join(dir, e.file)));
    } catch {
      rejected.push({ id, reason: "Arquivo não encontrado." });
      continue;
    }
    const r = await prepareEvalPhoto(original, options.sharp);
    if (r.ok) photos.push({ id, hand: e.hand, ...r.photo });
    else rejected.push({ id, reason: r.reason });
  }
  if (options.writeMap !== false)
    await writeFile(
      path.join(dir, PHOTO_MAP_FILE),
      JSON.stringify(map, null, 2) + "\n",
      { mode: 0o600 },
    );
  return { photos, rejected, errors: [] };
}
