// Fase 04E.2A: experiência de leitura dos capítulos 8 e 9 (desktop, iPhone 13
// e iPhone SE emulados): ressalvas em dois níveis, âncoras sob o cabeçalho
// fixo, teclado, leitor de tela (árvore de acessibilidade), axe e capturas.
//
// Uso (servidor de DESENVOLVIMENTO; leitura das mãos SIMULADA; motor interno;
// nenhuma IA; nenhum dado real):
//   SIDERA_INTERNAL_ENGINE=1 SIDERA_PALM_ANALYSIS_ENABLED=1 SIDERA_REPORT_READING=1 \
//   SIDERA_PALM_VISION_MOCK_SCENARIO=<clear|partial> node scripts/with-tzdata.mjs npx next dev -p 3370
//   node scripts/e2e/04e2a-leitura.mjs <clear|partial> [url] [capturas] [antes|depois] [saida.json]
// "antes" só mede e captura (para a comparação com a versão anterior).
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

import sharp from "sharp";

const require = createRequire(import.meta.url);
const { chromium, devices } = require("playwright");
const axePath = require.resolve("axe-core/axe.min.js");

const scenario = process.argv[2] ?? "clear";
const base = process.argv[3] ?? "http://localhost:3370";
const shots = process.argv[4] ?? null;
const phase = process.argv[5] ?? "depois";
const out = process.argv[6] ?? null;
const after = phase === "depois";
if (shots) mkdirSync(shots, { recursive: true });
const dir = mkdtempSync(join(tmpdir(), "sidera-04e2a-"));
const IMG = join(dir, "sintetica.jpg");
await sharp({
  create: {
    width: 1200,
    height: 1600,
    channels: 3,
    background: { r: 200, g: 150, b: 120 },
  },
})
  .jpeg()
  .toFile(IMG);

let failures = 0;
const metrics = [];
const check = (ok, msg) => {
  if (!ok) failures++;
  console.log(`${ok ? "OK  " : "FALHA"} [${scenario}] ${msg}`);
};
const h1 = (p) => p.getByRole("heading", { level: 1 }).first().waitFor();
const chapter = (p, n) =>
  p.locator(`article[aria-labelledby="capitulo-${n}"]:visible`).first();
const details = (p) => chapter(p, 8).locator("details");

async function axe(p) {
  await p.addScriptTag({ path: axePath });
  const r = await p.evaluate(() =>
    window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
      },
    }),
  );
  return r.violations.map((x) => `${x.id} (${x.nodes.length})`);
}

/** Captura do capítulo inteiro, sem o cabeçalho fixo e o selo do Next.js. */
async function shotOf(p, n, name) {
  if (!shots) return;
  await p.evaluate(() => {
    for (const el of document.querySelectorAll("body *")) {
      const pos = getComputedStyle(el).position;
      if (pos === "sticky" || pos === "fixed") {
        el.dataset.e2eHidden = el.style.visibility;
        el.style.visibility = "hidden";
      }
    }
    document.querySelector("nextjs-portal")?.setAttribute("hidden", "");
  });
  await chapter(p, n).scrollIntoViewIfNeeded();
  await chapter(p, n).screenshot({ path: join(shots, `${name}.png`) });
  await p.evaluate(() => {
    for (const el of document.querySelectorAll("[data-e2e-hidden]")) {
      el.style.visibility = el.dataset.e2eHidden;
      delete el.dataset.e2eHidden;
    }
  });
}

async function palmToBirth(p) {
  await p.goto(`${base}/leitura-das-maos`);
  await p.waitForLoadState("networkidle");
  await p.click('a[href="/leitura-das-maos/consentimento"]');
  await p.waitForURL(/consentimento$/);
  await p.locator('input[type="radio"]').first().check({ force: true });
  for (const c of await p.locator('input[type="checkbox"]').all())
    await c.check({ force: true });
  await p.getByRole("button", { name: /Continuar para a foto/ }).click();
  await p.waitForURL(/\/foto$/);
  await p.locator('input[type="file"]').last().setInputFiles(IMG);
  await p
    .locator('img[alt="Pré-visualização da foto da sua palma"]')
    .waitFor({ timeout: 15000 });
  await p.getByRole("button", { name: /analisar a foto/i }).click();
  await p.waitForURL(/previa$/, { timeout: 20000 });
  await p
    .getByRole("button", { name: /Continuar: dados de nascimento/ })
    .click();
  await p.waitForURL(/dados-de-nascimento$/);
}

async function birthAndRead(p, label, place) {
  await p.locator("summary", { hasText: "Casos de verificação" }).click();
  await p.getByRole("button", { name: label }).click();
  await p.getByText(place).first().waitFor({ timeout: 30000 });
  await p.getByRole("button", { name: /Verificar dados/ }).click();
  await p
    .getByRole("button", { name: /Confirmar e ver a proposta/ })
    .click({ timeout: 120000 });
  await p.waitForURL(/\/relatorio$/);
  await p.getByRole("link", { name: /Abrir a leitura desta jornada/ }).click();
  await p.waitForURL(/\/relatorio\/leitura$/);
  await h1(p);
  await p.waitForFunction(
    () => !document.querySelector('[aria-busy="true"]'),
    null,
    { timeout: 120000 },
  );
}

/** Estado "expandido" exposto aos leitores de tela (árvore do Chromium). */
async function axExpanded(p) {
  const cdp = await p.context().newCDPSession(p);
  const { nodes } = await cdp.send("Accessibility.getFullAXTree");
  await cdp.detach();
  const node = nodes.find(
    (x) =>
      !x.ignored &&
      /Limitações desta análise/.test(x.name?.value ?? "") &&
      x.properties?.some((q) => q.name === "expanded"),
  );
  if (!node) return null;
  return {
    role: node.role?.value,
    expanded: node.properties.find((q) => q.name === "expanded").value.value,
  };
}

/** Anchors: título abaixo do cabeçalho fixo, sem um vão excessivo. */
async function anchorGap(p, n) {
  const link = p.locator(`a[href="#cap-${n}"]:visible`).first();
  await link.click();
  await p.waitForTimeout(700);
  return p.evaluate((n) => {
    const h = document.querySelector(`#capitulo-${n}`);
    const fixed = [...document.querySelectorAll("body *")].filter((el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return (
        (s.position === "sticky" || s.position === "fixed") &&
        r.top <= 1 &&
        r.height < 200 &&
        r.width > innerWidth / 2
      );
    });
    const headerBottom = Math.max(
      0,
      ...fixed.map((el) => el.getBoundingClientRect().bottom),
    );
    return {
      top: Math.round(h.getBoundingClientRect().top),
      articleTop: Math.round(h.closest("article").getBoundingClientRect().top),
      headerBottom: Math.round(headerBottom),
    };
  }, n);
}

const browser = await chromium.launch();
for (const [vp, options] of [
  ["desktop", { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }],
  ["iphone13", devices["iPhone 13"]],
  ["iphoneSE", devices["iPhone SE"]],
]) {
  const ip = `203.0.113.${1 + Math.floor(Math.random() * 254)}`;
  const ctx = await browser.newContext({
    ...options,
    extraHTTPHeaders: { "x-client-ip": ip, "x-forwarded-for": ip },
  });
  const p = await ctx.newPage();
  const tag = (m) => `${vp}: ${m}`;
  const m = { vp, scenario, phase };

  await palmToBirth(p);
  await birthAndRead(p, "Recife, horário de verão (1986)", /Recife — PE/);
  const c8 = chapter(p, 8);
  m.cap8Height = Math.round((await c8.boundingBox()).height);
  m.cap9Height = Math.round((await chapter(p, 9).boundingBox()).height);
  // Palavras visíveis no capítulo 8 (texto renderizado, sem o que está recolhido).
  m.cap8VisibleWords = (await c8.innerText()).trim().split(/\s+/).length;
  m.cap8AllWords = (await c8.evaluate((e) => e.textContent))
    .trim()
    .split(/\s+/).length;
  for (const n of [8, 9]) m[`anchor${n}`] = await anchorGap(p, n);
  await shotOf(p, 8, `04e2a-${phase}-${vp}-cap8-${scenario}`);
  if (scenario === "clear")
    await shotOf(p, 9, `04e2a-${phase}-${vp}-cap9-${scenario}`);
  if (shots && vp === "iphoneSE") {
    await p.locator('a[href="#cap-8"]:visible').first().click();
    await p.waitForTimeout(700);
    await p.screenshot({
      path: join(shots, `04e2a-${phase}-${vp}-cap8-ancora-${scenario}.png`),
    });
  }

  if (after) {
    for (const n of [8, 9]) {
      const a = m[`anchor${n}`];
      check(
        a.articleTop >= a.headerBottom && a.articleTop - a.headerBottom <= 48,
        tag(
          `sumário → cap. ${n}: capítulo ${a.articleTop - a.headerBottom} px e título ${a.top - a.headerBottom} px abaixo do cabeçalho fixo (até ${a.headerBottom} px)`,
        ),
      );
    }
    const t8 = await c8.innerText();
    check(
      /Semelhanças entre tradições simbólicas não comprovam/.test(t8),
      tag("cap. 8: aviso essencial (R0) visível com a seção recolhida"),
    );
    check(
      (await details(p).count()) === 1 &&
        !(await details(p).evaluate((d) => d.open)),
      tag("cap. 8: limitações técnicas numa seção expansível, recolhida"),
    );
    const hiddenBefore = await details(p).evaluate((d) =>
      [...d.querySelectorAll("li")].map((li) => li.textContent),
    );
    check(
      hiddenBefore.some((x) => /tratam de outros temas/.test(x)) &&
        hiddenBefore.some((x) => /leitura das mãos simulada/.test(x)) &&
        (scenario !== "partial" ||
          hiddenBefore.some((x) => /parcialmente visível/.test(x))),
      tag(
        `cap. 8: ressalvas técnicas preservadas na seção (${hiddenBefore.length})`,
      ),
    );
    check(
      !/tratam de outros temas/.test(t8),
      tag("cap. 8: ressalvas técnicas fora da leitura inicial"),
    );
    let ax = await axExpanded(p);
    check(
      ax?.expanded === false,
      tag(
        `leitor de tela: "Limitações desta análise" com estado recolhido (${ax ? `${ax.role}, expanded=${ax.expanded}` : "não encontrado"})`,
      ),
    );
    // Teclado: Tab até o resumo, foco visível, Enter expande, Enter recolhe.
    await p.evaluate(() => window.scrollTo(0, 0));
    await p
      .locator("#sumario:visible")
      .first()
      .click({ position: { x: 1, y: 1 } });
    let focus = null;
    for (let i = 0; i < 200; i++) {
      await p.keyboard.press("Tab");
      focus = await p.evaluate(() => {
        const el = document.activeElement;
        if (el?.tagName !== "SUMMARY" || !/Limitações/.test(el.textContent))
          return null;
        const s = getComputedStyle(el);
        return s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0;
      });
      if (focus !== null) break;
    }
    check(
      focus === true,
      tag("teclado: resumo alcançado por Tab, com foco visível"),
    );
    await p.keyboard.press("Enter");
    await p.waitForTimeout(150);
    ax = await axExpanded(p);
    check(
      (await details(p).evaluate((d) => d.open)) && ax?.expanded === true,
      tag("teclado: Enter expande; leitor de tela anuncia expandido"),
    );
    const t8open = await c8.innerText();
    check(
      /tratam de outros temas/.test(t8open) &&
        /leitura das mãos simulada/.test(t8open),
      tag("expandida: ressalvas técnicas visíveis"),
    );
    m.cap8HeightOpen = Math.round((await c8.boundingBox()).height);
    await shotOf(p, 8, `04e2a-${phase}-${vp}-cap8-${scenario}-aberta`);
    const overflow = await p.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    check(overflow <= 0, tag(`sem rolagem horizontal (${overflow} px)`));
    const v = await axe(p);
    check(
      v.length === 0,
      tag(
        `axe WCAG A/AA, seção aberta: ${v.length ? v.join(", ") : "sem violações"}`,
      ),
    );
    await details(p).locator("summary").focus();
    await p.keyboard.press("Space");
    await p.waitForTimeout(150);
    check(
      !(await details(p).evaluate((d) => d.open)),
      tag("teclado: Espaço recolhe a seção"),
    );
    const v2 = await axe(p);
    check(
      v2.length === 0,
      tag(
        `axe WCAG A/AA, seção recolhida: ${v2.length ? v2.join(", ") : "sem violações"}`,
      ),
    );
    const all = await p
      .locator("#sumario:visible")
      .first()
      .locator("xpath=..")
      .innerText();
    m.simulatedVisible = (all.match(/simulad/gi) ?? []).length;
    check(
      m.simulatedVisible <= 2,
      tag(`avisos de simulação visíveis na leitura: ${m.simulatedVisible}`),
    );
  }

  if (scenario === "clear") {
    // Capítulo 8 indisponível: a mensagem continua visível, sem seção expansível.
    await p.getByRole("link", { name: "Sair da jornada" }).click();
    await p.waitForURL(`${base}/`);
    await palmToBirth(p);
    await birthAndRead(p, "São Paulo, horário desconhecido", /São Paulo — SP/);
    const u = await chapter(p, 8).innerText();
    if (after)
      check(
        /mesmos temas dos traços nítidos/.test(u) &&
          (await details(p).count()) === 0,
        tag("cap. 8 indisponível: motivo visível, nada recolhido"),
      );
    await shotOf(p, 8, `04e2a-${phase}-${vp}-cap8-indisponivel`);
    await shotOf(p, 9, `04e2a-${phase}-${vp}-cap9-sem-cap8`);
  }
  metrics.push(m);
  await ctx.close();
}
await browser.close();
rmSync(dir, { recursive: true, force: true });
if (out) writeFileSync(out, JSON.stringify(metrics, null, 1));
console.log(JSON.stringify(metrics));
console.log(
  failures ? `\n${failures} falha(s)` : "\ntodas as verificações passaram",
);
process.exit(failures ? 1 : 0);
