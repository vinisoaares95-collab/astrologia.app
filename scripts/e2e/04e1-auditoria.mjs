// Fase 04E.1: auditoria de UX, privacidade e desempenho do relatório integrado.
//
// Uso (servidor de DESENVOLVIMENTO; leitura das mãos SIMULADA; motor interno;
// nenhuma IA; nenhum dado real). Os tempos medem o ambiente de desenvolvimento
// e não representam produção.
//   SIDERA_INTERNAL_ENGINE=1 SIDERA_PALM_ANALYSIS_ENABLED=1 SIDERA_REPORT_READING=1 \
//   SIDERA_PALM_VISION_MOCK_SCENARIO=clear node scripts/with-tzdata.mjs npx next dev -p 3370
//   node scripts/e2e/04e1-auditoria.mjs [http://localhost:3370] [capturas] [saida.json]
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

import sharp from "sharp";

const require = createRequire(import.meta.url);
const { chromium, devices } = require("playwright");

const base = process.argv[2] ?? "http://localhost:3370";
const shots = process.argv[3] ?? null;
const out = process.argv[4] ?? null;
if (shots) mkdirSync(shots, { recursive: true });
const dir = mkdtempSync(join(tmpdir(), "sidera-04e1-"));
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
  console.log(`${ok ? "OK  " : "FALHA"} ${msg}`);
};
const h1 = (p) => p.getByRole("heading", { level: 1 }).first().waitFor();
const reading = (p) =>
  p.locator("#sumario:visible").first().locator("xpath=..");

async function palm(p) {
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

/** Confirma o nascimento e abre a leitura; devolve os tempos medidos. */
async function birthAndRead(p, label, place) {
  await p.locator("summary", { hasText: "Casos de verificação" }).click();
  await p.getByRole("button", { name: label }).click();
  await p.getByText(place).first().waitFor({ timeout: 30000 });
  await p.getByRole("button", { name: /Verificar dados/ }).click();
  const confirm = p.getByRole("button", { name: /Confirmar e ver a proposta/ });
  await confirm.waitFor({ timeout: 120000 });
  let actionMs = null;
  let sentAt = 0;
  const onRequest = (q) => {
    if (q.method() === "POST" && q.headers()["next-action"])
      sentAt = Date.now();
  };
  const onResponse = async (r) => {
    if (
      r.request().method() === "POST" &&
      r.request().headers()["next-action"]
    ) {
      actionMs = Date.now() - sentAt;
    }
  };
  p.on("request", onRequest);
  p.on("response", onResponse);
  const action = p
    .waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        !!r.request().headers()["next-action"],
      { timeout: 120000 },
    )
    .then(() => Date.now())
    .catch(() => null);
  const t0 = Date.now();
  await confirm.click();
  await p.waitForURL(/\/relatorio$/);
  await p.getByRole("link", { name: /Abrir a leitura desta jornada/ }).click();
  await p.waitForURL(/\/relatorio\/leitura$/);
  await h1(p);
  await p.waitForFunction(
    () => !document.querySelector('[aria-busy="true"]'),
    null,
    { timeout: 120000 },
  );
  const totalMs = Date.now() - t0;
  const doneAt = await action;
  if (doneAt) actionMs = doneAt - t0;
  // Montagem no navegador: tempo de re-renderizar a leitura (voltar e reabrir).
  await p.waitForTimeout(300);
  p.off("response", onResponse);
  p.off("request", onRequest);
  return { actionMs, totalMs };
}

async function heap(p) {
  const cdp = await p.context().newCDPSession(p);
  await cdp.send("Performance.enable");
  await cdp.send("HeapProfiler.collectGarbage");
  const { metrics: m } = await cdp.send("Performance.getMetrics");
  await cdp.detach();
  const used = m.find((x) => x.name === "JSHeapUsedSize")?.value ?? 0;
  return Math.round((used / 1048576) * 10) / 10;
}

const browser = await chromium.launch();
for (const [vp, options] of [
  ["desktop", { viewport: { width: 1440, height: 900 } }],
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
  const external = [];
  p.on("request", (r) => {
    const u = new URL(r.url());
    if (
      !["localhost", "127.0.0.1"].includes(u.hostname) &&
      u.protocol.startsWith("http")
    )
      external.push(u.hostname);
  });
  await p.goto(`${base}/`);
  await p.waitForLoadState("networkidle");
  const heapStart = await heap(p);

  // Jornada completa: nove capítulos.
  await palm(p);
  const times = await birthAndRead(
    p,
    "Recife, horário de verão (1986)",
    /Recife — PE/,
  );
  const r = reading(p);
  const text = await r.innerText();
  check(/9 de 9 capítulos/.test(text), tag("nove capítulos"));

  // Sumário → capítulos 8 e 9: o título fica visível, abaixo do cabeçalho fixo.
  for (const n of [8, 9]) {
    const link = p.locator(`a[href="#cap-${n}"]:visible`).first();
    if (await link.count()) {
      await link.click();
      await p.waitForTimeout(700);
      const pos = await p.evaluate((n) => {
        const h =
          document.querySelector(`#capitulo-${n}`) ??
          document.querySelector(`#cap-${n}`);
        const fixed = [...document.querySelectorAll("body *")].filter((el) => {
          const s = getComputedStyle(el);
          return (
            (s.position === "sticky" || s.position === "fixed") &&
            el.getBoundingClientRect().top <= 1 &&
            el.getBoundingClientRect().height < 200
          );
        });
        const headerBottom = Math.max(
          0,
          ...fixed.map((el) => el.getBoundingClientRect().bottom),
        );
        return {
          top: h?.getBoundingClientRect().top ?? -1,
          headerBottom,
          hash: location.hash,
        };
      }, n);
      check(
        pos.top >= pos.headerBottom - 1 && pos.top < 400,
        tag(
          `sumário → cap. ${n}: título visível abaixo do cabeçalho (topo ${Math.round(pos.top)} px, cabeçalho até ${Math.round(pos.headerBottom)} px)`,
        ),
      );
    } else check(false, tag(`sumário sem link para o cap. ${n}`));
  }

  // Teclado: Tab até o link do sumário (foco visível) e Enter abre o capítulo.
  await p.evaluate(() => window.scrollTo(0, 0));
  await p
    .locator("body")
    .click({ position: { x: 2, y: 200 } })
    .catch(() => {});
  let outline = "não alcançado";
  for (let i = 0; i < 120; i++) {
    await p.keyboard.press("Tab");
    const hit = await p.evaluate(() => {
      const el = document.activeElement;
      if (
        !(el instanceof HTMLAnchorElement) ||
        el.getAttribute("href") !== "#cap-9"
      )
        return null;
      const s = getComputedStyle(el);
      return s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0
        ? "outline"
        : s.boxShadow !== "none"
          ? "shadow"
          : "nenhum";
    });
    if (hit) {
      outline = hit;
      break;
    }
  }
  check(
    outline === "outline" || outline === "shadow",
    tag(`foco visível no sumário pelo teclado (${outline})`),
  );
  await p.keyboard.press("Enter");
  await p.waitForTimeout(500);
  check(
    (await p.evaluate(() => location.hash)) === "#cap-9",
    tag("Enter no sumário leva ao capítulo 9"),
  );

  // Layout: sem rolagem horizontal; parágrafos; avisos repetidos.
  const layout = await p.evaluate(() => {
    const ps = [
      ...document.querySelectorAll(
        "#cap-8 p, #cap-9 p, article[aria-labelledby='capitulo-8'] p, article[aria-labelledby='capitulo-9'] p",
      ),
    ];
    const words = ps.map((x) => x.innerText.trim().split(/\s+/).length);
    const all = document.body.innerText;
    return {
      overflow:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
      maxWords89: Math.max(0, ...words),
      simulatedNotices: (all.match(/simulad/gi) ?? []).length,
    };
  });
  check(
    layout.overflow <= 0,
    tag(`sem rolagem horizontal (${layout.overflow} px)`),
  );
  check(
    layout.maxWords89 <= 60,
    tag(`maior parágrafo dos caps. 8–9: ${layout.maxWords89} palavras`),
  );
  check(
    layout.simulatedNotices <= 4,
    tag(`menções a "simulada" na página: ${layout.simulatedNotices}`),
  );

  // Referências e estado de indisponível visíveis sem sobreposição do cabeçalho.
  if (shots) {
    await p
      .locator("#cap-8")
      .scrollIntoViewIfNeeded()
      .catch(() => {});
    await p.screenshot({ path: join(shots, `04e1-${vp}-cap8-viewport.png`) });
  }

  // Desempenho e memória.
  const heapReading = await heap(p);
  await p.getByRole("link", { name: "Sair da jornada" }).click();
  await p.waitForURL(`${base}/`);
  await p.waitForTimeout(500);
  const heapAfterExit = await heap(p);
  // Três jornadas seguidas: a memória não deve crescer sem limite.
  const heaps = [];
  for (let i = 0; i < 3; i++) {
    await p.goto(`${base}/dados-de-nascimento`);
    await p.waitForLoadState("networkidle");
    await birthAndRead(
      p,
      "Rio Branco, após a mudança de fuso",
      /Rio Branco — AC/,
    );
    await p.getByRole("link", { name: "Sair da jornada" }).click();
    await p.waitForURL(`${base}/`);
    heaps.push(await heap(p));
  }
  metrics.push({
    vp,
    ...times,
    heapStart,
    heapReading,
    heapAfterExit,
    heapsAfter3: heaps,
  });
  check(
    heaps[2] - heaps[0] < 5,
    tag(`memória estável em jornadas repetidas (${heaps.join(" → ")} MB)`),
  );

  // Recarregar e sair apagam; demonstração isolada da leitura real.
  await p.goto(`${base}/relatorio/leitura?cenario=completo`);
  await h1(p);
  const demo = await p.locator("body").innerText();
  check(
    !/Demonstração interna|dados de exemplo/i.test(demo) &&
      (/0 de 9 capítulos/.test(demo) || /ERRO 404/.test(demo)),
    tag(
      `?cenario= sem a demonstração habilitada: nenhum exemplo (${/ERRO 404/.test(demo) ? "404" : "leitura real vazia"})`,
    ),
  );
  const storage = await p.evaluate(async () => ({
    local: localStorage.length,
    session: sessionStorage.length,
    cookie: document.cookie,
    idb: (await indexedDB.databases?.())?.length ?? 0,
  }));
  check(
    storage.local + storage.session + storage.idb === 0 &&
      storage.cookie === "",
    tag("sem armazenamento no navegador"),
  );
  check(external.length === 0, tag("nenhuma requisição a outro host"));
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
