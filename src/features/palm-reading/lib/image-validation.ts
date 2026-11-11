/** Regras de aceitação da fotografia da palma (verificadas apenas no navegador). */
export const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

const ACCEPTED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
];

export const MAX_FILE_BYTES = 15 * 1024 * 1024;
export const MIN_SHORT_SIDE_PX = 600;

/** Valor para o atributo `accept` dos inputs de arquivo. */
export const ACCEPT_ATTRIBUTE = [
  ...ACCEPTED_MIME_TYPES,
  ...ACCEPTED_EXTENSIONS,
].join(",");

export type ImageIssueCode =
  | "unsupported-type"
  | "too-large"
  | "empty"
  | "too-small"
  | "decode-failed"
  | "processing-failed"
  | "prepared-too-large";

export type ValidationResult =
  { ok: true } | { ok: false; code: ImageIssueCode; message: string };

export const issueMessages: Record<ImageIssueCode, string> = {
  "unsupported-type":
    "Este formato não é aceito. Envie uma foto em JPG, PNG, WEBP ou HEIC.",
  "too-large": "A foto passa de 15 MB. Tente uma imagem menor.",
  empty: "O arquivo parece estar vazio. Tente selecionar a foto novamente.",
  "too-small":
    "A resolução é baixa demais para enxergar as linhas. Use uma foto com pelo menos 600 px no lado menor.",
  "decode-failed":
    "Não conseguimos abrir esta imagem neste navegador. Se for HEIC, tente tirar a foto pela câmera ou exportá-la em JPG.",
  "processing-failed":
    "Não conseguimos preparar esta foto neste aparelho. Tente outra foto ou feche outros aplicativos e tente de novo.",
  "prepared-too-large":
    "Mesmo depois de preparada, esta foto ficou grande demais. Tente outra foto, de preferência sem filtros ou zoom digital.",
};

function fail(code: ImageIssueCode): ValidationResult {
  return { ok: false, code, message: issueMessages[code] };
}

function hasAcceptedExtension(name: string) {
  const lower = name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function validateImageFile(
  file: Pick<File, "name" | "size" | "type">,
): ValidationResult {
  // Alguns navegadores Android não informam o MIME type; usamos a extensão.
  const typeOk = file.type
    ? (ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type)
    : hasAcceptedExtension(file.name);

  if (!typeOk) return fail("unsupported-type");
  if (file.size === 0) return fail("empty");
  if (file.size > MAX_FILE_BYTES) return fail("too-large");
  return { ok: true };
}

export function validateImageDimensions(
  width: number,
  height: number,
): ValidationResult {
  if (Math.min(width, height) < MIN_SHORT_SIDE_PX) return fail("too-small");
  return { ok: true };
}

/** Avisos não bloqueantes sobre o enquadramento. */
export function getFramingHints(width: number, height: number): string[] {
  const hints: string[] = [];
  if (width > height * 1.15) {
    hints.push(
      "A foto está na horizontal. Na vertical, a palma costuma ocupar mais espaço e as linhas ficam mais nítidas.",
    );
  }
  return hints;
}
