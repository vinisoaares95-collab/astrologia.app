/**
 * Diagnóstico técnico das fotos do piloto (Fase 03F.1), SÓ INFORMATIVO.
 *
 * Registra separadamente resolução, compressão, foco e iluminação, para
 * cruzar depois com o que os modelos e o revisor viram. Não bloqueia nem
 * aprova nada: o mínimo técnico continua o do produto (600 px no lado
 * menor), sem ampliação de fotos pequenas. "Tecnicamente aceita" não quer
 * dizer "leitura confiável" — isso só a revisão humana diz.
 *
 * Foco e iluminação usam as MESMAS heurísticas da tela de foto
 * (lib/quality.ts) sobre uma amostra de 512 px em tons de cinza; os
 * limiares de compressão abaixo são provisórios, para calibrar no piloto.
 */
import {
  measureQuality,
  qualityHints,
  type QualityMetrics,
} from "../lib/quality";

/** Preferência dos TESTES (não requisito do produto). */
export const TEST_PREFERRED_SHORT_SIDE_PX = 1500;
const QUALITY_SAMPLE_LONG_EDGE = 512;

/** Tabela de luminância padrão do JPEG (ITU-T T.81, Anexo K), em zigue-zague. */
const STD_LUMA_ZIGZAG = [
  16, 11, 12, 14, 12, 10, 16, 14, 13, 14, 18, 17, 16, 19, 24, 40, 26, 24, 22,
  22, 24, 49, 35, 37, 29, 40, 58, 51, 61, 60, 57, 51, 56, 55, 64, 72, 92, 78,
  64, 68, 87, 69, 55, 56, 80, 109, 81, 87, 95, 98, 103, 104, 103, 62, 77, 113,
  121, 112, 100, 120, 92, 101, 103, 99,
];

/**
 * Qualidade aproximada (escala IJG 1–100) a partir da 1ª tabela de
 * quantização do arquivo. null se não houver tabela legível.
 */
export function estimateJpegQuality(bytes: Uint8Array): number | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let i = 2;
  while (i + 4 <= bytes.length) {
    if (bytes[i] !== 0xff) return null;
    const marker = bytes[i + 1];
    if (marker === 0xda || marker === 0xd9) return null;
    const length = (bytes[i + 2] << 8) | bytes[i + 3];
    if (marker === 0xdb && i + 4 + 65 <= bytes.length) {
      const pq = bytes[i + 4] >> 4; // 0: 8 bits
      if (pq !== 0) return null;
      let sum = 0;
      for (let k = 0; k < 64; k++)
        sum += (bytes[i + 5 + k] * 100) / STD_LUMA_ZIGZAG[k];
      const scale = sum / 64;
      const q = scale <= 100 ? (200 - scale) / 2 : 5000 / scale;
      return Math.max(1, Math.min(100, Math.round(q)));
    }
    i += 2 + length;
  }
  return null;
}

export type TechnicalDiagnosis = {
  id: string;
  resolution: {
    original: { width: number; height: number };
    prepared: { width: number; height: number };
    shortSide: number;
    /** Abaixo da preferência dos testes (informativo; o produto aceita ≥ 600). */
    belowTestPreference: boolean;
  };
  compression: {
    format: string;
    bytes: number;
    /** Bits por pixel do arquivo recebido. */
    bitsPerPixel: number;
    /** Qualidade JPEG estimada (null: PNG ou sem tabela). */
    jpegQuality: number | null;
    flag: "forte" | "moderada" | "baixa" | "indeterminada";
  };
  focus: { sharpness: number; flag: "possivelmente desfocada" | "sem alerta" };
  lighting: {
    meanLuma: number;
    darkFraction: number;
    brightFraction: number;
    contrast: number;
    flags: string[];
  };
};

/** Provisório: calibrar com o piloto. */
function compressionFlag(
  format: string,
  bpp: number,
  q: number | null,
): TechnicalDiagnosis["compression"]["flag"] {
  if (format !== "jpeg") return "indeterminada";
  if ((q !== null && q < 60) || bpp < 0.5) return "forte";
  if ((q !== null && q < 80) || bpp < 1.5) return "moderada";
  return "baixa";
}

export function diagnose(input: {
  original: {
    bytes: Uint8Array;
    width: number;
    height: number;
    format: string;
  };
  prepared: { width: number; height: number };
  /** Amostra em cinza (≤ 512 px) da foto preparada. */
  gray: { data: ArrayLike<number>; width: number; height: number };
}): Omit<TechnicalDiagnosis, "id"> {
  const { original, prepared } = input;
  const bpp = (original.bytes.length * 8) / (original.width * original.height);
  const jpegQuality =
    original.format === "jpeg" ? estimateJpegQuality(original.bytes) : null;
  const m: QualityMetrics = measureQuality(
    input.gray.data,
    input.gray.width,
    input.gray.height,
  );
  const hints = qualityHints(m).map((h) => h.code);
  const shortSide = Math.min(original.width, original.height);
  return {
    resolution: {
      original: { width: original.width, height: original.height },
      prepared,
      shortSide,
      belowTestPreference: shortSide < TEST_PREFERRED_SHORT_SIDE_PX,
    },
    compression: {
      format: original.format,
      bytes: original.bytes.length,
      bitsPerPixel: Math.round(bpp * 100) / 100,
      jpegQuality,
      flag: compressionFlag(original.format, bpp, jpegQuality),
    },
    focus: {
      sharpness: Math.round(m.sharpness),
      flag: hints.includes("maybe-blurry")
        ? "possivelmente desfocada"
        : "sem alerta",
    },
    lighting: {
      meanLuma: Math.round(m.meanLuma),
      darkFraction: Math.round(m.darkFraction * 100) / 100,
      brightFraction: Math.round(m.brightFraction * 100) / 100,
      contrast: Math.round(m.contrast),
      flags: hints.filter((h) => h !== "maybe-blurry"),
    },
  };
}

export const sampleSize = (width: number, height: number) => {
  const s = Math.min(1, QUALITY_SAMPLE_LONG_EDGE / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * s)),
    height: Math.max(1, Math.round(height * s)),
  };
};

export function renderTechnicalDiagnosis(list: TechnicalDiagnosis[]): string {
  const rows = list.map(
    (d) =>
      `| ${d.id} | ${d.resolution.original.width}×${d.resolution.original.height}${d.resolution.belowTestPreference ? " ¹" : ""} | ${d.compression.format}, ${d.compression.bitsPerPixel} bpp${d.compression.jpegQuality !== null ? `, q≈${d.compression.jpegQuality}` : ""} → ${d.compression.flag} | ${d.focus.flag} (${d.focus.sharpness}) | ${d.lighting.flags.join(", ") || "sem alerta"} (média ${d.lighting.meanLuma}, contraste ${d.lighting.contrast}) |`,
  );
  return [
    "## Diagnóstico técnico das fotos (informativo; não bloqueia)",
    "",
    "| Foto | Resolução | Compressão | Foco | Iluminação |",
    "| --- | --- | --- | --- | --- |",
    ...rows,
    "",
    "¹ Abaixo da preferência dos testes (1 500 px no lado menor). O produto aceita a partir de 600 px; fotos menores não são ampliadas.",
    "",
    "Heurísticas da tela de foto (foco e luz) e limiares provisórios de compressão. Foto tecnicamente aceita não garante leitura confiável: a legibilidade das linhas vem da revisão humana (`revisao/qualidade-fotos.csv`).",
    "",
  ].join("\n");
}
