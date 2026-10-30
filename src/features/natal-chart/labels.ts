import type { AspectType, Body, Sign } from "../astrology/domain/types";

export const BODY_NAMES: Record<Body, string> = {
  sun: "Sol",
  moon: "Lua",
  mercury: "Mercúrio",
  venus: "Vênus",
  mars: "Marte",
  jupiter: "Júpiter",
  saturn: "Saturno",
  uranus: "Urano",
  neptune: "Netuno",
  pluto: "Plutão",
};

export const SIGN_NAMES: Record<Sign, string> = {
  aries: "Áries",
  taurus: "Touro",
  gemini: "Gêmeos",
  cancer: "Câncer",
  leo: "Leão",
  virgo: "Virgem",
  libra: "Libra",
  scorpio: "Escorpião",
  sagittarius: "Sagitário",
  capricorn: "Capricórnio",
  aquarius: "Aquário",
  pisces: "Peixes",
};

export const ASPECT_NAMES: Record<AspectType, string> = {
  conjunction: "Conjunção",
  sextile: "Sextil",
  square: "Quadratura",
  trine: "Trígono",
  opposition: "Oposição",
};

export const POINT_NAMES: Record<string, string> = {
  ...BODY_NAMES,
  asc: "Ascendente",
  mc: "Meio do Céu",
};

/** "21°43′" (grau e minuto já truncados pelo motor). */
export const formatDegree = (degree: number, minute: number) =>
  `${degree}°${String(minute).padStart(2, "0")}′`;

/** "21°43′ de Touro". */
export const formatPosition = (p: {
  sign: Sign;
  degree: number;
  minute: number;
}) => `${formatDegree(p.degree, p.minute)} de ${SIGN_NAMES[p.sign]}`;

/** Longitude absoluta em graus decimais, para conferência técnica. */
export const formatLongitude = (lon: number) =>
  `${lon.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}°`;
