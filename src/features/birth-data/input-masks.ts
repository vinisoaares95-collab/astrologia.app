/**
 * Máscaras para os campos de nascimento no padrão brasileiro, independentes
 * do idioma do navegador (inputs nativos de data/hora seguem o locale do
 * sistema e podem exibir mm/dd/aaaa ou relógio de 12 horas).
 */

function digits(value: string, max: number) {
  return value.replace(/\D/g, "").slice(0, max);
}

/** "14031992" → "14/03/1992" (formatação progressiva durante a digitação). */
export function maskDateBR(value: string): string {
  const d = digits(value, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** "0930" → "09:30" (relógio de 24 horas). */
export function maskTime24(value: string): string {
  const d = digits(value, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}:${d.slice(2)}`;
}
