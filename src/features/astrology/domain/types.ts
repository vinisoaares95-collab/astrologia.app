/**
 * Contratos do motor astrológico (Fase 02B — experimental).
 *
 * Tudo aqui descreve fatos calculáveis e verificáveis. Interpretações
 * simbólicas ficam em outra camada, que apenas consome `NatalChart`.
 */

export const BODIES = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
] as const;
export type Body = (typeof BODIES)[number];

export const SIGNS = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
] as const;
export type Sign = (typeof SIGNS)[number];

export type AnglePoint = "asc" | "mc";
export type ChartPoint = Body | AnglePoint;

/**
 * Instante em UTC (antes de 1972, interpretado como UT1).
 * `second` é opcional para compatibilidade; quando informado, é usado
 * exatamente — inclusive a fração — sem arredondamento.
 */
export type UtcInstant = {
  year: number;
  month: number; // 1–12
  day: number;
  hour: number; // 0–23
  minute: number; // 0–59
  second?: number; // 0 ≤ s < 60
};

export type GeoLocation = {
  latitude: number; // graus, norte positivo
  longitude: number; // graus, leste positivo (Brasil é negativo)
};

export type ChartRequest = {
  instant: UtcInstant;
  location: GeoLocation;
  /**
   * `exact`: horário conhecido ao minuto.
   * `unknown`: horário desconhecido — o motor NÃO calcula ângulos nem casas.
   * (`range` — janela aproximada — fica para a Fase 02C, junto dos fusos.)
   */
  timePrecision: "exact" | "unknown";
};

export type ZodiacPosition = {
  longitude: number; // 0 ≤ λ < 360
  sign: Sign;
  degree: number; // 0–29, truncado
  minute: number; // 0–59, truncado
};

export type BodyPosition = ZodiacPosition & {
  body: Body;
  latitude: number;
  speed: number; // graus/dia em longitude
  retrograde: boolean;
  house: number | null; // 1–12; null sem casas
};

export type AspectType =
  "conjunction" | "sextile" | "square" | "trine" | "opposition";

export type Aspect = {
  a: ChartPoint;
  b: ChartPoint;
  type: AspectType;
  exactAngle: number;
  orb: number; // |separação − ângulo exato|
  applying: boolean | null; // null quando não determinável (ângulos)
};

export type AnglesUnavailableReason =
  "BIRTH_TIME_UNKNOWN" | "BIRTH_TIME_APPROXIMATE" | "PLACIDUS_UNDEFINED";

export type NatalChart = {
  meta: {
    calcVersion: string;
    engine: string;
    engineVersion: string;
    ephemeris: string;
    zodiac: "tropical";
    frame: "geocentric-apparent-true-ecliptic-of-date";
    houseSystem: "placidus";
    orbs: string;
  };
  julianDay: { ut: number; tt: number };
  bodies: BodyPosition[];
  angles: { asc: ZodiacPosition; mc: ZodiacPosition } | null;
  houses: { cusps: ZodiacPosition[] } | null;
  unavailable: {
    angles?: AnglesUnavailableReason;
    houses?: AnglesUnavailableReason;
  };
  aspects: Aspect[];
  warnings: { code: string; message: string }[];
};
