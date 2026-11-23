/**
 * Limitador em memória por janela deslizante (Fase 03D).
 *
 * Suficiente para o MVP interno (um processo). Em várias instâncias, cada
 * uma teria o próprio contador: antes de abrir ao público, trocar por um
 * armazenamento compartilhado. Guarda só chaves opacas e horários; nenhuma
 * imagem.
 *
 * Expiração (03G.3): uma chave sai da memória quando todos os seus horários
 * saem da janela. A limpeza roda a cada uso (no máximo uma vez por
 * `sweepEveryMs`) e, enquanto houver chaves, também por um temporizador que
 * não segura o processo. Assim, uma chave dura no máximo
 * `windowMs + sweepEveryMs` depois da última tentativa, mesmo sem tráfego.
 */
export type Limiter = {
  /** Registra uma tentativa; false se o limite da janela foi atingido. */
  take(key: string, now?: number): boolean;
  /** Quantas tentativas ainda restam na janela. */
  remaining(key: string, now?: number): number;
  /**
   * Devolve a tentativa mais recente (03F.2, Etapa B): para falhas técnicas
   * que não entregaram resultado à pessoa.
   */
  refund(key: string): void;
  /** Remove as chaves cuja janela já passou. */
  sweep(now?: number): void;
  /** Chaves em memória (para testes e diagnóstico, sem expor as chaves). */
  size(): number;
  /** Para o temporizador de limpeza (testes, encerramento). */
  dispose(): void;
};

export function createLimiter(config: {
  limit: number;
  windowMs: number;
  /** Teto de chaves em memória (as mais antigas saem). */
  maxKeys?: number;
  /** Intervalo da limpeza (padrão: o menor entre a janela e 1 min). */
  sweepEveryMs?: number;
  /** Relógio do temporizador de limpeza (testes). */
  clock?: () => number;
  /** Liga o temporizador de limpeza (padrão: sim). */
  timer?: boolean;
}): Limiter {
  const hits = new Map<string, number[]>();
  const maxKeys = config.maxKeys ?? 10_000;
  const sweepEveryMs = config.sweepEveryMs ?? Math.min(config.windowMs, 60_000);
  const clock = config.clock ?? Date.now;
  let lastSweep = -Infinity;
  let interval: ReturnType<typeof setInterval> | null = null;

  const recent = (key: string, now: number) =>
    (hits.get(key) ?? []).filter((t) => now - t < config.windowMs);

  function stopTimer() {
    if (interval) clearInterval(interval);
    interval = null;
  }
  function sweep(now: number = clock()) {
    lastSweep = now;
    for (const [key, list] of hits)
      if (!list.some((t) => now - t < config.windowMs)) hits.delete(key);
    if (!hits.size) stopTimer();
  }
  function maybeSweep(now: number) {
    if (now - lastSweep >= sweepEveryMs) sweep(now);
  }
  function ensureTimer() {
    if (interval || config.timer === false) return;
    interval = setInterval(() => sweep(clock()), sweepEveryMs);
    (interval as { unref?: () => void }).unref?.();
  }

  return {
    take(key, now = clock()) {
      maybeSweep(now);
      const list = recent(key, now);
      if (list.length >= config.limit) {
        hits.set(key, list);
        return false;
      }
      list.push(now);
      hits.delete(key);
      hits.set(key, list);
      if (hits.size > maxKeys) hits.delete(hits.keys().next().value!);
      ensureTimer();
      return true;
    },
    remaining(key, now = clock()) {
      maybeSweep(now);
      return Math.max(0, config.limit - recent(key, now).length);
    },
    refund(key) {
      const list = hits.get(key);
      if (!list?.length) return;
      list.pop();
      if (!list.length) hits.delete(key);
      if (!hits.size) stopTimer();
    },
    sweep,
    size: () => hits.size,
    dispose: stopTimer,
  };
}
