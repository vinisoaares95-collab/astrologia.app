/** Registro da base de localidades (gerada por scripts/geo/build-places.mjs). */
export type PlaceRecord = {
  id: string; // "ibge:2611606" | "geonames:2267057"
  name: string;
  alt?: string[]; // nomes alternativos (ex.: exônimos em português)
  admin1: string | null; // estado / região
  admin1Code?: string; // UF, só no Brasil
  country: string; // ISO 3166-1 alfa-2
  lat: number;
  lon: number;
  /** Identificador IANA; null quando as fronteiras indicam mais de um fuso. */
  tz: string | null;
  tzCandidates?: string[];
  pop?: number;
  capital?: boolean;
};

/** Localidade como exibida e selecionada pela pessoa. */
export type PlaceSummary = {
  id: string;
  name: string;
  region: string | null; // "Pernambuco" / "Xinjiang"
  regionCode: string | null; // "PE" (Brasil) ou null
  country: string;
  countryName: string; // em português
  /** Rótulo completo e inequívoco: "Recife — PE, Brasil". */
  label: string;
  coordinates: { latitude: number; longitude: number };
  timeZone: string | null;
};
