// @vitest-environment node
/**
 * Jornada sem armazenamento persistente no navegador (Fase 04B): nenhum
 * código da aplicação usa localStorage, sessionStorage, cookies ou
 * IndexedDB. A memória da jornada é só estado React (journey-context.tsx).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..");
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return n === "generated" ? [] : files(p);
    return /\.(ts|tsx)$/.test(n) && !/\.test\.(ts|tsx)$/.test(n) ? [p] : [];
  });

describe("sem armazenamento persistente no navegador", () => {
  it("nenhum uso de localStorage, sessionStorage, document.cookie ou IndexedDB", () => {
    const pattern =
      /\b(localStorage|sessionStorage|indexedDB)\b|document\.cookie|cookies\(\)\.set/;
    const found = files(ROOT)
      .filter((f) =>
        readFileSync(f, "utf8")
          .split("\n")
          // Comentários podem citar os nomes (ex.: "nada de localStorage").
          .filter((line) => !/^\s*(\*|\/\/|\/\*)/.test(line))
          .some((line) => pattern.test(line)),
      )
      .map((f) => relative(ROOT, f));
    expect(found).toEqual([]);
  });
});
