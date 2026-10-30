import {
  getFramingHints,
  issueMessages,
  validateImageDimensions,
  validateImageFile,
  type ValidationResult,
} from "./image-validation";

export type LocalPhoto = {
  /** URL `blob:` válida apenas nesta aba; nunca sai do dispositivo. */
  url: string;
  fileName: string;
  sizeBytes: number;
  width: number;
  height: number;
  hints: string[];
};

export type LoadResult =
  { ok: true; photo: LocalPhoto } | Extract<ValidationResult, { ok: false }>;

function decode(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("decode-failed"));
    img.src = url;
  });
}

/**
 * Valida e prepara a pré-visualização local de uma foto.
 * Nada é enviado para servidores: a imagem fica apenas na memória do navegador.
 */
export async function loadLocalPhoto(file: File): Promise<LoadResult> {
  const fileCheck = validateImageFile(file);
  if (!fileCheck.ok) return fileCheck;

  const url = URL.createObjectURL(file);
  try {
    const img = await decode(url);
    const { naturalWidth: width, naturalHeight: height } = img;
    const sizeCheck = validateImageDimensions(width, height);
    if (!sizeCheck.ok) {
      URL.revokeObjectURL(url);
      return sizeCheck;
    }
    return {
      ok: true,
      photo: {
        url,
        fileName: file.name,
        sizeBytes: file.size,
        width,
        height,
        hints: getFramingHints(width, height),
      },
    };
  } catch {
    URL.revokeObjectURL(url);
    return {
      ok: false,
      code: "decode-failed",
      message: issueMessages["decode-failed"],
    };
  }
}
