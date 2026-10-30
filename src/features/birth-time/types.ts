/** Data e horário de relógio, sem fuso (como a pessoa informa). */
export type LocalDateTime = {
  year: number;
  month: number; // 1–12
  day: number;
  hour: number; // 0–23
  minute: number; // 0–59
};

/** Um instante resolvido, com o deslocamento aplicado naquele local e data. */
export type ResolvedInstant = {
  /** ISO 8601 em UTC, com segundos (a hora média local tem segundos). */
  utc: string;
  epochMs: number;
  /** Deslocamento em relação a UTC, em segundos (ex.: −10800 = UTC−03:00). */
  offsetSeconds: number;
  offsetLabel: string; // "UTC−03:00"
  /**
   * Horário de verão vigente, segundo os metadados do ICU (nome longo do
   * fuso: "Summer"/"Daylight" × "Standard"). `null` quando o ICU não tem
   * nome para o período (ex.: antes de 1970 em vários fusos) — indeterminado.
   */
  daylightSaving: boolean | null;
};

export type LocalTimeResolution =
  | { kind: "unique"; instant: ResolvedInstant }
  /** O horário ocorreu duas vezes (fim do horário de verão). Não escolhemos. */
  | { kind: "ambiguous"; earlier: ResolvedInstant; later: ResolvedInstant }
  /** O horário não existiu (o relógio pulou). Não ajustamos sozinhos. */
  | {
      kind: "nonexistent";
      gapMinutes: number;
      /** Mesmo instante físico lido com o deslocamento posterior ao salto. */
      shiftedLocal: LocalDateTime;
      offsetBeforeSeconds: number;
      offsetAfterSeconds: number;
      offsetBeforeLabel: string;
      offsetAfterLabel: string;
    };
