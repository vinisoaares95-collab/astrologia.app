// @vitest-environment node
/** Limitador (03G.3): funcionamento e expiração das chaves. */
import { afterEach, describe, expect, it, vi } from "vitest";

import { createLimiter } from "./rate-limit";

const HOUR = 60 * 60 * 1000;

afterEach(() => {
  vi.useRealTimers();
});

describe("limite por janela", () => {
  it("aceita até o limite, recusa depois e libera quando a janela passa", () => {
    const l = createLimiter({ limit: 2, windowMs: HOUR, timer: false });
    expect(l.take("a", 0)).toBe(true);
    expect(l.take("a", 1)).toBe(true);
    expect(l.take("a", 2)).toBe(false);
    expect(l.remaining("a", 2)).toBe(0);
    expect(l.take("b", 2)).toBe(true); // chaves independentes
    expect(l.take("a", HOUR + 1)).toBe(true);
  });

  it("devolve a última tentativa", () => {
    const l = createLimiter({ limit: 1, windowMs: HOUR, timer: false });
    l.take("a", 0);
    l.refund("a");
    expect(l.remaining("a", 0)).toBe(1);
    expect(l.size()).toBe(0);
  });

  it("respeita o teto de chaves", () => {
    const l = createLimiter({
      limit: 1,
      windowMs: HOUR,
      maxKeys: 2,
      timer: false,
    });
    l.take("a", 0);
    l.take("b", 0);
    l.take("c", 0);
    expect(l.size()).toBe(2);
    expect(l.remaining("a", 0)).toBe(1); // a mais antiga saiu
  });
});

describe("expiração das chaves", () => {
  it("sweep remove só as chaves cuja janela passou", () => {
    const l = createLimiter({ limit: 5, windowMs: HOUR, timer: false });
    l.take("velha", 0);
    l.take("nova", HOUR - 1);
    l.sweep(HOUR);
    expect(l.size()).toBe(1);
    expect(l.remaining("nova", HOUR)).toBe(4);
  });

  it("o uso normal limpa as vencidas (no máximo a cada sweepEveryMs)", () => {
    const l = createLimiter({
      limit: 5,
      windowMs: HOUR,
      sweepEveryMs: 60_000,
      timer: false,
    });
    for (let i = 0; i < 100; i++) l.take(`k${i}`, 0);
    expect(l.size()).toBe(100);
    l.take("outra", HOUR + 60_000);
    expect(l.size()).toBe(1);
  });

  it("sem tráfego, o temporizador apaga as chaves e depois para", () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const l = createLimiter({ limit: 5, windowMs: HOUR, sweepEveryMs: 60_000 });
    l.take("a");
    l.take("b");
    vi.advanceTimersByTime(HOUR - 60_000);
    expect(l.size()).toBe(2);
    vi.advanceTimersByTime(2 * 60_000); // janela + um intervalo de limpeza
    expect(l.size()).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    l.dispose();
  });

  it("chave mantida enquanto houver tentativa dentro da janela", () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const l = createLimiter({ limit: 5, windowMs: HOUR, sweepEveryMs: 60_000 });
    l.take("a");
    vi.advanceTimersByTime(30 * 60_000);
    l.take("a");
    vi.advanceTimersByTime(HOUR - 60_000);
    expect(l.size()).toBe(1);
    expect(l.remaining("a")).toBe(4);
    vi.advanceTimersByTime(30 * 60_000 + 60_000);
    expect(l.size()).toBe(0);
    l.dispose();
  });
});
