/**
 * Reprocessamento da foto no navegador (Fase 03B).
 *
 * A imagem é redesenhada num canvas e codificada de novo em JPEG. O canvas
 * não carrega metadados, então EXIF, GPS, modelo do aparelho e miniaturas
 * embutidas são descartados. A orientação é aplicada antes (o navegador lê
 * o EXIF de orientação ao decodificar), para a palma não ficar deitada.
 *
 * Resolução: os limites vêm da documentação oficial de visão do Claude
 * (platform.claude.com/docs/en/build-with-claude/vision): até 2 576 px no
 * lado maior e 4 784 tokens visuais (blocos de 28 × 28 px). Acima disso o
 * provedor reduz a imagem por conta própria; reduzir aqui, uma única vez e
 * com suavização de alta qualidade, evita uma segunda reamostragem e envio
 * de bytes que seriam descartados. Imagens menores nunca são ampliadas.
 *
 * Compressão: JPEG de alta qualidade (0,92), uma só passagem, para não
 * borrar linhas finas. Só se o arquivo passar do limite de envio a
 * qualidade desce em passos pequenos, até 0,85 no mínimo.
 */

/** Lado do bloco de imagem usado na contagem de tokens visuais. */
export const VISUAL_TOKEN_PATCH_PX = 28;
/** Limites do nível de alta resolução (modelos 4.7 e posteriores, inclui Haiku 5.5). */
export const MAX_LONG_EDGE_PX = 2576;
export const MAX_VISUAL_TOKENS = 4784;

export const JPEG_QUALITY_STEPS = [0.92, 0.88, 0.85] as const;
/**
 * Teto do arquivo preparado. O envio (Fase 03D) precisará de
 * `serverActions.bodySizeLimit` acima do padrão de 1 MB do Next.js 16; este
 * teto deixa folga para o envelope multipart.
 */
export const MAX_PREPARED_BYTES = 2.5 * 1024 * 1024;

export const visualTokens = (width: number, height: number) =>
  Math.ceil(width / VISUAL_TOKEN_PATCH_PX) *
  Math.ceil(height / VISUAL_TOKEN_PATCH_PX);

/**
 * Maior tamanho (mesma proporção, sem ampliar) que cabe nos dois limites:
 * lado maior ≤ 2 576 px e ≤ 4 784 tokens visuais.
 */
export function targetDimensions(width: number, height: number) {
  if (!(width > 0 && height > 0)) throw new Error("Dimensões inválidas.");
  let scale = Math.min(1, MAX_LONG_EDGE_PX / Math.max(width, height));
  // Estimativa pela área, depois ajuste fino (o arredondamento por blocos
  // pode passar do limite por alguns tokens).
  const area = width * height * scale * scale;
  const areaLimit =
    MAX_VISUAL_TOKENS * VISUAL_TOKEN_PATCH_PX * VISUAL_TOKEN_PATCH_PX;
  if (area > areaLimit) scale *= Math.sqrt(areaLimit / area);
  let w = Math.max(1, Math.floor(width * scale));
  let h = Math.max(1, Math.floor(height * scale));
  while (visualTokens(w, h) > MAX_VISUAL_TOKENS) {
    scale *= 0.99;
    w = Math.max(1, Math.floor(width * scale));
    h = Math.max(1, Math.floor(height * scale));
  }
  return { width: w, height: h, scaled: w !== width || h !== height };
}

/**
 * Procura metadados num JPEG: segmentos APP1 (EXIF ou XMP), APP13
 * (IPTC/Photoshop) e APP2 (FlashPix/MPF, que pode guardar outra imagem).
 * Usado para conferir o arquivo preparado.
 */
export function jpegMetadataSegments(bytes: Uint8Array): string[] {
  const found: string[] = [];
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return found;
  let i = 2;
  while (i + 4 <= bytes.length) {
    if (bytes[i] !== 0xff) break;
    const marker = bytes[i + 1];
    // Início dos dados da imagem: não há mais segmentos de metadados.
    if (marker === 0xda || marker === 0xd9) break;
    const length = (bytes[i + 2] << 8) | bytes[i + 3];
    const payload = bytes.subarray(i + 4, i + 2 + length);
    const head = String.fromCharCode(...payload.subarray(0, 28));
    if (marker === 0xe1 && head.startsWith("Exif")) found.push("EXIF");
    else if (marker === 0xe1 && head.startsWith("http://ns.adobe.com/xap"))
      found.push("XMP");
    else if (marker === 0xed) found.push("IPTC");
    else if (marker === 0xe2 && !head.startsWith("ICC_PROFILE"))
      found.push("APP2");
    i += 2 + length;
  }
  return found;
}

export type Encoder = (quality: number) => Promise<Blob | null>;

/**
 * Codifica com a maior qualidade que cabe no teto. Devolve null se nem a
 * menor qualidade couber (a foto deve ser trocada).
 */
export async function encodeWithinLimit(
  encode: Encoder,
  maxBytes = MAX_PREPARED_BYTES,
): Promise<{ blob: Blob; quality: number } | null> {
  for (const quality of JPEG_QUALITY_STEPS) {
    const blob = await encode(quality);
    if (!blob) throw new Error("encode-failed");
    if (blob.size <= maxBytes) return { blob, quality };
  }
  return null;
}

export type PreparedImage = {
  blob: Blob;
  width: number;
  height: number;
  quality: number;
  /** Cinza reduzido (lado maior ~512 px), para as verificações locais. */
  gray: { data: Uint8ClampedArray; width: number; height: number };
};

const QUALITY_SAMPLE_LONG_EDGE = 512;

function canvasOf(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas-unavailable");
  return { canvas, ctx };
}

/**
 * Redesenha (já com a orientação aplicada pelo navegador), reduz e codifica.
 * `source` é uma imagem decodificada pelo navegador.
 */
export async function prepareImage(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
): Promise<PreparedImage | null> {
  const target = targetDimensions(sourceWidth, sourceHeight);
  const { canvas, ctx } = canvasOf(target.width, target.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, target.width, target.height);

  const encoded = await encodeWithinLimit(
    (quality) =>
      new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality)),
  );
  if (!encoded) return null;

  const s = Math.min(
    1,
    QUALITY_SAMPLE_LONG_EDGE / Math.max(target.width, target.height),
  );
  const gw = Math.max(1, Math.round(target.width * s));
  const gh = Math.max(1, Math.round(target.height * s));
  const small = canvasOf(gw, gh);
  small.ctx.drawImage(canvas, 0, 0, gw, gh);
  const rgba = small.ctx.getImageData(0, 0, gw, gh).data;
  const gray = new Uint8ClampedArray(gw * gh);
  for (let p = 0, q = 0; p < rgba.length; p += 4, q++)
    gray[q] = 0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2];

  // Libera a memória do canvas grande (relevante em celulares).
  canvas.width = canvas.height = 0;
  return {
    blob: encoded.blob,
    width: target.width,
    height: target.height,
    quality: encoded.quality,
    gray: { data: gray, width: gw, height: gh },
  };
}
