// @vitest-environment node
/**
 * Isolamento da leitura do relatório (Fase 04A): sem checkout, sem estado da
 * leitura das mãos (D5 inalterado), sem registro de consentimento, sem IA, e
 * só em demonstração interna.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { proxy, config } from "../../../proxy";
import { isReportDemoEnabled } from "./demo-gate";

const SRC = join(__dirname, "..", "..", "..");
const files = [
  ...readdirSync(__dirname)
    .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))
    .map((f) => join(__dirname, f)),
  join(SRC, "app/(jornada)/relatorio/leitura/page.tsx"),
].map((f) => ({ f, text: readFileSync(f, "utf8") }));

describe("isolamento", () => {
  it("não importa checkout, catálogo, preços nem a oferta", () => {
    for (const { f, text } of files)
      expect([
        f,
        /content\/catalog|offer-summary|formatBRL|priceCents/.test(text),
      ]).toEqual([f, false]);
  });

  it("não toca no estado da foto, no consentimento nem nos provedores reais", () => {
    for (const { f, text } of files)
      expect([
        f,
        /palm-photo-context|consent-ledger|server\/handlers|anthropic-provider|api-key|getDb|@\/lib\/db/.test(
          text,
        ),
      ]).toEqual([f, false]);
  });

  it("os exemplos usam só o provedor simulado das mãos e as fixtures da biblioteca", () => {
    const samples = files.find((x) => x.f.endsWith("samples.ts"))!.text;
    expect(samples).toMatch(
      /createMockPalmTextProvider\(\["error:unavailable"\]\)/,
    );
    expect(samples).not.toMatch(/fetch\(|SIDERA_AI|generateReport\(/);
  });
});

describe("demonstração interna", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("só com SIDERA_REPORT_DEMO=1", () => {
    expect(isReportDemoEnabled({})).toBe(false);
    expect(isReportDemoEnabled({ SIDERA_REPORT_DEMO: "true" })).toBe(false);
    expect(isReportDemoEnabled({ SIDERA_REPORT_DEMO: "1" })).toBe(true);
  });

  it("proxy: 404 antes de renderizar sem a variável; segue com ela", () => {
    const req = new NextRequest(
      "http://localhost/relatorio/leitura?cenario=completo",
    );
    vi.stubEnv("SIDERA_REPORT_DEMO", "");
    const blocked = proxy(req);
    expect(blocked.status).toBe(404);
    expect(blocked.headers.get("x-robots-tag")).toBe("noindex");
    vi.stubEnv("SIDERA_REPORT_DEMO", "1");
    expect(proxy(req).headers.get("x-middleware-next")).toBe("1");
  });

  it("o proxy só cobre a leitura (a página comercial /relatorio fica fora)", () => {
    expect(config.matcher).toEqual([
      "/relatorio/leitura",
      "/relatorio/leitura/:path*",
    ]);
  });
});
