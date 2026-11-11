import {
  getFramingHints,
  issueMessages,
  validateImageDimensions,
  validateImageFile,
  type ImageIssueCode,
} from "./image-validation";
import { prepareImage, type PreparedImage } from "./prepare-image";
import { measureQuality, qualityHints, type QualityHint } from "./quality";

export type LocalPhoto = {
  /** URL `blob:` da imagem PREPARADA, válida apenas nesta aba. */
  url: string;
  /** JPEG reprocessado, sem metadados; nunca sai do dispositivo nesta fase. */
  blob: Blob;
  fileName: string;
  width: number;
  height: number;
  sizeBytes: number;
  original: { width: number; height: number; sizeBytes: number };
  /** Sempre true: o canvas não carrega EXIF/GPS (conferido nos testes). */
  metadataRemoved: true;
  /** Avisos de enquadramento (orientação). */
  hints: string[];
  /** Avisos heurísticos de luz e foco (não bloqueiam). */
  quality: QualityHint[];
};

export type LoadFailure = {
  ok: false;
  code: ImageIssueCode;
  message: string;
};
export type LoadResult = { ok: true; photo: LocalPhoto } | LoadFailure;

type Decoded = {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
};

/** Dependências do navegador, substituíveis nos testes. */
export type LoadDeps = {
  decode: (file: File) => Promise<Decoded>;
  prepare: (
    source: CanvasImageSource,
    width: number,
    height: number,
  ) => Promise<PreparedImage | null>;
  createUrl: (blob: Blob) => string;
};

/**
 * Decodifica aplicando a orientação do EXIF (padrão do navegador), para que
 * a foto redesenhada fique de pé mesmo sem o metadado.
 */
async function decodeInBrowser(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    } catch {
      // Alguns navegadores não decodificam certos formatos aqui; tenta <img>.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode-failed"));
      el.src = url;
    });
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

const browserDeps: LoadDeps = {
  decode: decodeInBrowser,
  prepare: prepareImage,
  createUrl: (blob) => URL.createObjectURL(blob),
};

const fail = (code: ImageIssueCode): LoadFailure => ({
  ok: false,
  code,
  message: issueMessages[code],
});

/**
 * Valida, reprocessa (sem metadados) e mede a foto, tudo no navegador.
 * Nada é enviado para servidores nesta fase.
 */
export async function loadLocalPhoto(
  file: File,
  deps: LoadDeps = browserDeps,
): Promise<LoadResult> {
  const fileCheck = validateImageFile(file);
  if (!fileCheck.ok) return fail(fileCheck.code);

  let decoded: Decoded;
  try {
    decoded = await deps.decode(file);
  } catch {
    return fail("decode-failed");
  }

  try {
    const sizeCheck = validateImageDimensions(decoded.width, decoded.height);
    if (!sizeCheck.ok) return fail(sizeCheck.code);

    let prepared: PreparedImage | null;
    try {
      prepared = await deps.prepare(
        decoded.source,
        decoded.width,
        decoded.height,
      );
    } catch {
      return fail("processing-failed");
    }
    if (!prepared) return fail("prepared-too-large");

    const { data, width, height } = prepared.gray;
    return {
      ok: true,
      photo: {
        url: deps.createUrl(prepared.blob),
        blob: prepared.blob,
        fileName: file.name,
        width: prepared.width,
        height: prepared.height,
        sizeBytes: prepared.blob.size,
        original: {
          width: decoded.width,
          height: decoded.height,
          sizeBytes: file.size,
        },
        metadataRemoved: true,
        hints: getFramingHints(prepared.width, prepared.height),
        quality: qualityHints(measureQuality(data, width, height)),
      },
    };
  } finally {
    decoded.release();
  }
}
