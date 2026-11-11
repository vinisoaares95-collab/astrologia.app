/**
 * Limitador em memória por janela deslizante (Fase 03D).
 *
 * Suficiente para o MVP interno (um processo). Em várias instâncias, cada
 * uma teria o próprio contador: antes de abrir ao público, trocar por um
 * armazenamento compartilhado. Guarda só chaves opacas e horários; nenhuma
 * imagem.
 */
export type Limiter = {
  /** Registra uma tentativa; false se o limite da janela foi atingido. */
  take(key: string, now?: number): boolean;
  /** Quantas tentativas ainda restam na janela. */
  remaining(key: string, now?: number): number;
};

export function createLimiter(config: {
  limit: number;
  windowMs: number;
  /** Teto de chaves em memória (as mais antigas saem). */
  maxKeys?: number;
}): Limiter {
  const hits = new Map<string, number[]>();
  const maxKeys = config.maxKeys ?? 10_000;
  const recent = (key: string, now: number) =>
    (hits.get(key) ?? []).filter((t) => now - t < config.windowMs);
  return {
    take(key, now = Date.now()) {
      const list = recent(key, now);
      if (list.length >= config.limit) {
        hits.set(key, list);
        return false;
      }
      list.push(now);
      hits.delete(key);
      hits.set(key, list);
      if (hits.size > maxKeys) hits.delete(hits.keys().next().value!);
      return true;
    },
    remaining(key, now = Date.now()) {
      return Math.max(0, config.limit - recent(key, now).length);
    },
  };
}
