export type ChartErrorCode =
  | "INVALID_DATE"
  | "DATE_OUT_OF_RANGE"
  | "INVALID_COORDINATES"
  | "EPHEMERIS_FILES_MISSING"
  | "EPHEMERIS_FALLBACK"
  | "ENGINE_FAILURE";

/** Erro tipado do motor — a interface traduz o código em mensagem amigável. */
export class ChartError extends Error {
  constructor(
    readonly code: ChartErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ChartError";
  }
}
