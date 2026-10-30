export type BirthDataInput = {
  date: string; // AAAA-MM-DD (input type="date")
  time: string; // HH:MM (input type="time")
  unknownTime: boolean;
  place: string;
};

export type BirthDataErrors = Partial<
  Record<"date" | "time" | "place", string>
>;

const MIN_YEAR = 1900;

/** Validação local — os dados não são enviados nem armazenados nesta fase. */
export function validateBirthData(
  input: BirthDataInput,
  today: Date,
): BirthDataErrors {
  const errors: BirthDataErrors = {};

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.date);
  if (!match) {
    errors.date = "Informe sua data de nascimento.";
  } else {
    const [, y, m, d] = match.map(Number);
    const date = new Date(y, m - 1, d);
    const valid =
      date.getFullYear() === y &&
      date.getMonth() === m - 1 &&
      date.getDate() === d;
    if (!valid) errors.date = "Esta data não existe.";
    else if (y < MIN_YEAR)
      errors.date = `Informe uma data a partir de ${MIN_YEAR}.`;
    else if (date > today) errors.date = "A data não pode estar no futuro.";
  }

  if (!input.unknownTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time)) {
    errors.time = "Informe o horário ou marque que não sabe.";
  }

  if (input.place.trim().length < 2) {
    errors.place = "Informe a cidade onde você nasceu.";
  }

  return errors;
}
