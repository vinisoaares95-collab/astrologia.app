/**
 * Leitura de cabeçalhos JPEG sem decodificar a imagem (Fases 03B e 03D).
 *
 * Usado no navegador (conferir a foto preparada) e no servidor (conferir o
 * que chegou, sem confiar no tipo, no nome ou no tamanho declarados).
 * Só lê marcadores: não executa nada do arquivo.
 */

const SOF_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

/**
 * Procura metadados num JPEG: segmentos APP1 (EXIF ou XMP), APP13
 * (IPTC/Photoshop) e APP2 (FlashPix/MPF, que pode guardar outra imagem).
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

export type JpegInfo =
  | { ok: true; width: number; height: number; metadata: string[] }
  | { ok: false; reason: "not-jpeg" | "truncated" | "no-frame" };

/**
 * Confere assinatura (FF D8 … FF D9), percorre os segmentos até o quadro
 * (SOF) e devolve as dimensões REAIS gravadas no arquivo.
 */
export function inspectJpeg(bytes: Uint8Array): JpegInfo {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8)
    return { ok: false, reason: "not-jpeg" };
  // Arquivo completo termina com EOI (FF D9).
  if (bytes[bytes.length - 2] !== 0xff || bytes[bytes.length - 1] !== 0xd9)
    return { ok: false, reason: "truncated" };
  let i = 2;
  while (i + 4 <= bytes.length) {
    if (bytes[i] !== 0xff) return { ok: false, reason: "truncated" };
    const marker = bytes[i + 1];
    if (marker === 0xd9 || marker === 0xda) break;
    const length = (bytes[i + 2] << 8) | bytes[i + 3];
    if (length < 2 || i + 2 + length > bytes.length)
      return { ok: false, reason: "truncated" };
    if (SOF_MARKERS.has(marker)) {
      if (length < 7) return { ok: false, reason: "truncated" };
      const height = (bytes[i + 5] << 8) | bytes[i + 6];
      const width = (bytes[i + 7] << 8) | bytes[i + 8];
      if (!width || !height) return { ok: false, reason: "no-frame" };
      return {
        ok: true,
        width,
        height,
        metadata: jpegMetadataSegments(bytes),
      };
    }
    i += 2 + length;
  }
  return { ok: false, reason: "no-frame" };
}
