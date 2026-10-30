import { offsetSecondsAt } from "./zoned-time";

export type Transition = {
  /** Instante UTC da mudança, ISO 8601 (precisão de segundos). */
  at: string;
  fromOffsetSeconds: number;
  toOffsetSeconds: number;
};

const DAY = 86_400_000;

/**
 * Lista as mudanças de deslocamento de um fuso num intervalo, amostrando a
 * cada `stepDays` e localizando cada mudança por busca binária ao segundo.
 * Mudanças que se desfazem dentro de um mesmo passo não são detectadas —
 * use passo curto para fusos com transições muito próximas.
 */
export function listTransitions(
  timeZone: string,
  fromMs: number,
  toMs: number,
  stepDays = 3,
): Transition[] {
  const out: Transition[] = [];
  let t = fromMs;
  let offset = offsetSecondsAt(timeZone, t);
  while (t < toMs) {
    const next = Math.min(t + stepDays * DAY, toMs);
    const nextOffset = offsetSecondsAt(timeZone, next);
    if (nextOffset !== offset) {
      let lo = t;
      let hi = next;
      while (hi - lo > 1000) {
        const mid = Math.floor((lo + hi) / 2000) * 1000;
        if (offsetSecondsAt(timeZone, mid) === offset) lo = mid;
        else hi = mid;
      }
      out.push({
        at: new Date(hi).toISOString().replace(".000Z", "Z"),
        fromOffsetSeconds: offset,
        toOffsetSeconds: nextOffset,
      });
    }
    t = next;
    offset = nextOffset;
  }
  return out;
}
