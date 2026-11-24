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
import { isReportDemoEnabled, isReportReadingEnabled } from "./demo-gate";

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
    vi.stubEnv("SIDERA_REPORT_READING", "");
    const blocked = proxy(req);
    expect(blocked.status).toBe(404);
    expect(blocked.headers.get("x-robots-tag")).toBe("noindex");
    vi.stubEnv("SIDERA_REPORT_DEMO", "1");
    expect(proxy(req).headers.get("x-middleware-next")).toBe("1");
  });

  it("jornada real (04B): SIDERA_REPORT_READING=1, independente dos exemplos", () => {
    expect(isReportReadingEnabled({})).toBe(false);
    expect(isReportReadingEnabled({ SIDERA_REPORT_DEMO: "1" })).toBe(false);
    expect(isReportReadingEnabled({ SIDERA_REPORT_READING: "1" })).toBe(true);
    const req = new NextRequest("http://localhost/relatorio/leitura");
    vi.stubEnv("SIDERA_REPORT_DEMO", "");
    vi.stubEnv("SIDERA_REPORT_READING", "1");
    expect(proxy(req).headers.get("x-middleware-next")).toBe("1");
  });

  it("a página separa os modos: exemplos só com ?cenario= e a trava da demonstração", () => {
    const page = files.find((x) => x.f.endsWith("leitura/page.tsx"))!.text;
    expect(page).toMatch(
      /requested !== undefined[\s\S]*isReportDemoEnabled\(\)[\s\S]*sampleInputs/,
    );
    expect(page).toMatch(
      /isReportReadingEnabled\(\)\) notFound\(\);\s*return <JourneyReading \/>/,
    );
  });

  it("o 404 da leitura só vale para /relatorio/leitura (a página comercial /relatorio segue)", () => {
    vi.stubEnv("SIDERA_REPORT_DEMO", "");
    vi.stubEnv("SIDERA_REPORT_READING", "");
    for (const p of ["/relatorio/leitura", "/relatorio/leitura/x"])
      expect(proxy(new NextRequest(`http://localhost${p}`)).status).toBe(404);
    for (const p of ["/relatorio", "/relatorio/leituras"])
      expect(
        proxy(new NextRequest(`http://localhost${p}`)).headers.get(
          "x-middleware-next",
        ),
      ).toBe("1");
    // O proxy cobre todas as rotas (acesso restrito da homologação, 03G.1).
    expect(config.matcher).toEqual([
      "/((?!_next/static|_next/image|favicon.ico).*)",
    ]);
  });
});
