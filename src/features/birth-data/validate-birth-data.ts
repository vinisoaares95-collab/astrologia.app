export type BirthDataInput = {
  date: string; // DD/MM/AAAA
  time: string; // HH:MM (24 h)
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

  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input.date.trim());
  if (!input.date.trim()) {
    errors.date = "Informe sua data de nascimento.";
  } else if (!match) {
    errors.date = "Use o formato DD/MM/AAAA.";
  } else {
    const [d, m, y] = match.slice(1).map(Number);
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

  if (!input.unknownTime) {
    if (!input.time.trim()) {
      errors.time = "Informe o horário ou marque que não sabe.";
    } else if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time.trim())) {
      errors.time = "Use o formato HH:MM, de 00:00 a 23:59.";
    }
  }

  if (input.place.trim().length < 2) {
    errors.place = "Informe a cidade onde você nasceu.";
  }

  return errors;
}
