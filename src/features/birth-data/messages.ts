import type { Issue } from "./contract";

/** Mensagens únicas para validação no navegador e normalização no servidor. */
export const ISSUE_MESSAGES: Record<Issue["code"], string> = {
  DATE_REQUIRED: "Informe sua data de nascimento.",
  DATE_FORMAT: "Use o formato DD/MM/AAAA.",
  DATE_NONEXISTENT: "Esta data não existe.",
  DATE_BEFORE_MIN: "Informe uma data a partir de 1900.",
  DATE_FUTURE: "A data não pode estar no futuro.",
  DATE_NONEXISTENT_IN_ZONE:
    "Esta data não existiu no calendário civil deste local: os relógios saltaram o dia inteiro numa mudança de fuso.",
  TIME_REQUIRED: "Informe o horário ou indique que não sabe.",
  TIME_FORMAT: "Use o formato HH:MM, de 00:00 a 23:59.",
  TIME_NONEXISTENT: "Este horário não existiu nesta data e local.",
  MARGIN_INVALID: "Escolha a margem de incerteza do horário.",
  PLACE_REQUIRED: "Selecione a cidade na lista de resultados.",
  PLACE_NOT_FOUND: "Cidade não encontrada. Busque e selecione novamente.",
  TZDB_VERSION_MISMATCH:
    "A base de fusos horários do servidor não é a versão validada. A conversão foi bloqueada para evitar resultados divergentes.",
  PLACE_INCOMPLETE:
    "Não há informação suficiente sobre o fuso horário desta localidade para calcular com segurança.",
};
