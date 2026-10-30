import type { Body, GeoLocation, UtcInstant } from "../domain/types";

/**
 * Fronteira entre o produto e a biblioteca de efemérides.
 * Qualquer implementação (Swiss Ephemeris hoje; outra no futuro) precisa
 * devolver posições geocêntricas APARENTES na eclíptica e equinócio
 * VERDADEIROS da data, zodíaco tropical.
 */
export interface EphemerisProvider {
  readonly info: {
    engine: string;
    engineVersion: string;
    ephemeris: string;
    /** Faixa de datas suportada pelos arquivos de efemérides (UTC, inclusiva). */
    supportedYears: { from: number; to: number };
  };

  /** Converte UTC em dia juliano (UT1 aproximado por UTC e TT). */
  julianDay(instant: UtcInstant): { ut: number; tt: number };

  bodyPosition(
    jdUt: number,
    body: Body,
  ): { longitude: number; latitude: number; speed: number };

  /**
   * Ascendente, Meio do Céu e cúspides Placidus.
   * `cusps` é null quando Placidus é indefinido (latitudes polares);
   * nesse caso o provedor NÃO pode devolver cúspides de outro sistema.
   */
  housesPlacidus(
    jdUt: number,
    location: GeoLocation,
  ): { asc: number; mc: number; cusps: number[] | null };
}
