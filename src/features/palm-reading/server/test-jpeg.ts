/**
 * JPEG sintético para testes (só cabeçalhos válidos, sem imagem real).
 * Nenhuma foto de pessoa é usada nos testes.
 */
export function syntheticJpeg(
  width: number,
  height: number,
  options: { exif?: boolean; padTo?: number; truncate?: boolean } = {},
): Uint8Array {
  const bytes: number[] = [0xff, 0xd8];
  const segment = (marker: number, payload: number[]) => {
    const length = payload.length + 2;
    bytes.push(0xff, marker, length >> 8, length & 0xff, ...payload);
  };
  const text = (s: string) => [...s].map((c) => c.charCodeAt(0));
  segment(0xe0, [...text("JFIF"), 0, 1, 1, 0, 0, 1, 0, 1, 0, 0]);
  if (options.exif) segment(0xe1, [...text("Exif"), 0, 0, ...text("GPS")]);
  // SOF0: precisão, altura, largura, 3 componentes.
  segment(0xc0, [
    8,
    height >> 8,
    height & 0xff,
    width >> 8,
    width & 0xff,
    3,
    1, 0x22, 0,
    2, 0x11, 1,
    3, 0x11, 1,
  ]); // prettier-ignore
  segment(0xda, [3, 1, 0, 2, 0x11, 3, 0x11, 0, 63, 0]);
  const pad = Math.max(0, (options.padTo ?? 0) - bytes.length - 2);
  for (let i = 0; i < pad; i++) bytes.push(0x55);
  if (!options.truncate) bytes.push(0xff, 0xd9);
  return new Uint8Array(bytes);
}
