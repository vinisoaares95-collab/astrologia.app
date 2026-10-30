import type { BirthDataInput } from "./contract";
import { ISSUE_MESSAGES } from "./messages";
import { localDateOf, parseBrazilianDate, parseTime24 } from "./parse";

export type BirthDataErrors = Partial<
  Record<"date" | "time" | "place", string>
>;

/**
 * Validação imediata no navegador (formato e campos obrigatórios).
 * A validação definitiva — fuso, horário inexistente ou duplicado — é feita
 * no servidor por `normalizeBirthData`, com as mesmas mensagens.
 */
export function validateBirthData(
  input: Pick<BirthDataInput, "date" | "time" | "placeId">,
  today: Date,
): BirthDataErrors {
  const errors: BirthDataErrors = {};

  const date = parseBrazilianDate(input.date, localDateOf(today));
  if (!date.ok) errors.date = ISSUE_MESSAGES[date.issue];

  if (input.time.precision !== "unknown") {
    const time = parseTime24(input.time.value);
    if (!time.ok) errors.time = ISSUE_MESSAGES[time.issue];
  }

  if (!input.placeId) errors.place = ISSUE_MESSAGES.PLACE_REQUIRED;

  return errors;
}
