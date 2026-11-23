// Fase 04A: leitura do relatório integrado em Chromium real.
//
// Uso (servidor com a demonstração interna ligada; só dados de exemplo):
//   SIDERA_REPORT_DEMO=1 npx next start -p 3350   (depois de npm run build)
//   node scripts/e2e/04a-leitura.mjs [http://localhost:3350]
//
// Verifica, em desktop e dois tamanhos de celular, para todos os cenários:
// sem rolagem horizontal; axe-core (WCAG 2 A/AA) sem violações; navegação
// por teclado pelo sumário até um capítulo; foco visível. O axe-core vem das
// dependências instaladas (transitivo); sem ele, essa parte é pulada.
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium, devices } = require("playwright");
let axePath = null;
try {
  axePath = require.resolve("axe-core/axe.min.js");
} catch {
  console.log("axe-core indisponível: verificação de acessibilidade pulada");
}

const base = `${process.argv[2] ?? "http://localhost:3350"}/relatorio/leitura`;
const SCENARIOS = [
  "completo",
  "parcial",
  "insuficiente",
  "sem-maos",
  "sem-ceu",
  "carregando",
];
const VIEWPORTS = [
  ["desktop", { viewport: { width: 1440, height: 900 } }],
  ["iPhone 13", devices["iPhone 13"]],
  ["iPhone SE", devices["iPhone SE"]],
];
let failures = 0;
const check = (ok, msg) => {
  if (!ok) failures++;
  console.log(`${ok ? "OK  " : "FALHA"} ${msg}`);
};

const browser = await chromium.launch();
for (const [name, options] of VIEWPORTS) {
  const ctx = await browser.newContext(options);
  const page = await ctx.newPage();
  for (const s of SCENARIOS) {
    await page.goto(`${base}?cenario=${s}`);
    await page.locator("h1").waitFor();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    check(
      overflow <= 0,
      `${name} · ${s}: sem rolagem horizontal (${overflow}px)`,
    );
    if (axePath) {
      await page.addScriptTag({ path: axePath });
      const result = await page.evaluate(() =>
        window.axe.run(document, {
          runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
          },
        }),
      );
      const v = result.violations.map((x) => `${x.id} (${x.nodes.length})`);
      check(
        v.length === 0,
        `${name} · ${s}: axe WCAG A/AA ${v.length ? v.join(", ") : "sem violações"}`,
      );
    }
  }

  // Teclado: do sumário até o capítulo 6.
  await page.goto(`${base}?cenario=parcial`);
  await page.locator("h1").waitFor();
  let reached = false;
  for (let i = 0; i < 60 && !reached; i++) {
    await page.keyboard.press("Tab");
    reached = await page.evaluate(
      () =>
        document.activeElement?.getAttribute("href") === "#cap-6" &&
        document.activeElement.getBoundingClientRect().width > 0,
    );
  }
  check(
    reached,
    `${name}: o link do capítulo 6 no sumário é alcançável por Tab`,
  );
  const outline = await page.evaluate(
    () => getComputedStyle(document.activeElement).outlineStyle,
  );
  check(outline !== "none", `${name}: foco visível (${outline})`);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(600);
  const inView = await page.evaluate(() => {
    const r = document.getElementById("cap-6").getBoundingClientRect();
    return r.top >= 0 && r.top < window.innerHeight;
  });
  check(
    page.url().endsWith("#cap-6") && inView,
    `${name}: Enter leva ao capítulo 6`,
  );
  await ctx.close();
}
await browser.close();
console.log(
  failures ? `\n${failures} falha(s)` : "\nTodas as verificações passaram",
);
process.exit(failures ? 1 : 0);
