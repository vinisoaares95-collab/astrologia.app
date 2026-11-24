// Fase 04D: capítulos 8 e 9 na jornada interna (desktop e mobile).
//
// Uso (servidor de desenvolvimento; leitura das mãos SIMULADA; nenhuma IA;
// nenhum dado real):
//   [SIDERA_INTERNAL_ENGINE=1] SIDERA_PALM_ANALYSIS_ENABLED=1 SIDERA_REPORT_READING=1 \
//   SIDERA_PALM_VISION_MOCK_SCENARIO=<clear|partial|insufficient> \
//   node scripts/with-tzdata.mjs npx next dev -p 3370
//   node scripts/e2e/04d-jornada.mjs <com-motor|sem-motor> <clear|partial|insufficient> [url] [capturas]
// (em produção a leitura das mãos responde 503 por projeto — Fase 03G.3)
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

import sharp from "sharp";

const require = createRequire(import.meta.url);
const { chromium, devices } = require("playwright");
let axePath = null;
try {
  axePath = require.resolve("axe-core/axe.min.js");
} catch {
  console.log("axe-core indisponível: verificação de acessibilidade pulada");
}
/** WCAG 2 A/AA na leitura (inclui os capítulos 8 e 9). */
async function axe(p) {
  if (!axePath) return null;
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

const engine = process.argv[2] ?? "com-motor";
const scenario = process.argv[3] ?? "clear";
const base = process.argv[4] ?? "http://localhost:3370";
const shots = process.argv[5] ?? null;
const mode = `${engine}/${scenario}`;
if (shots) mkdirSync(shots, { recursive: true });
const dir = mkdtempSync(join(tmpdir(), "sidera-04d-"));
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
const check = (ok, msg) => {
  if (!ok) failures++;
  console.log(`${ok ? "OK  " : "FALHA"} [${mode}] ${msg}`);
};
const chapter = (p, n) =>
  p.locator(`article[aria-labelledby="capitulo-${n}"]:visible`).first();
const chapterText = (p, n) => chapter(p, n).innerText();
const reading = (p) =>
  p.locator("#sumario:visible").first().locator("xpath=..").innerText();
const h1 = (p) => p.getByRole("heading", { level: 1 }).first().waitFor();
const shotOf = async (p, n, name) => {
  if (!shots) return;
  // Só para a captura do elemento: o cabeçalho fixo da jornada e o selo de
  // desenvolvimento do Next.js se sobrepõem ao capítulo durante a rolagem.
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
};
const pageShot = async (p, name) => {
  if (shots) await p.screenshot({ path: join(shots, `${name}.png`) });
};

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

async function birthAndRead(p, label, placeText) {
  await p.locator("summary", { hasText: "Casos de verificação" }).click();
  await p.getByRole("button", { name: label }).click();
  await p.getByText(placeText).first().waitFor({ timeout: 30000 });
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

const status = async (p, n) =>
  (await chapter(p, n).locator("text=Esta parte não pôde ser lida").count())
    ? "indisponível"
    : "disponível";
const counter = (t) => t.match(/(\d) de 9 capítulos/)?.[1] ?? "?";

const browser = await chromium.launch();
for (const [vp, options] of [
  ["desktop", { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }],
  ["mobile", devices["iPhone 13"]],
]) {
  const ip = `203.0.113.${1 + Math.floor(Math.random() * 254)}`;
  const ctx = await browser.newContext({
    ...options,
    extraHTTPHeaders: { "x-client-ip": ip, "x-forwarded-for": ip },
  });
  const p = await ctx.newPage();
  const tag = (m) => `${vp}: ${m}`;
  const external = [];
  const requests = [];
  p.on("request", (r) => {
    const u = new URL(r.url());
    if (
      !["localhost", "127.0.0.1"].includes(u.hostname) &&
      u.protocol.startsWith("http")
    )
      external.push(u.hostname);
    requests.push(`${r.method()} ${u.pathname}`);
  });

  if (engine === "com-motor" && scenario === "clear") {
    // 1. Capítulos 1 a 9 (céu + mãos; Recife 1986, mão clara simulada).
    await palmToBirth(p);
    await birthAndRead(p, "Recife, horário de verão (1986)", /Recife — PE/);
    let t = await reading(p);
    check(
      counter(t) === "9",
      tag(`nove capítulos com leitura (${counter(t)} de 9)`),
    );
    const c8 = await chapterText(p, 8);
    check(
      /Expressão: abertura e reserva/.test(c8) &&
        /Diferença/i.test(c8) &&
        /Vênus em Capricórnio \(cap\. 4\)/.test(c8),
      tag(
        "cap. 8: expressão · diferença, com Vênus (cap. 4) e a linha do coração (cap. 7)",
      ),
    );
    check(
      /leitura das mãos simulada/.test(c8),
      tag("cap. 8: ressalva de leitura simulada"),
    );
    const c9 = await chapterText(p, 9);
    check(
      /Para fechar/.test(c9) &&
        /Prática opcional/.test(c9) &&
        /A partir de/.test(c9),
      tag("cap. 9: temas, prática opcional e fechamento"),
    );
    check(
      !/body-sign|linhas:|heart\.|head\.|identidade:/.test(t),
      tag("nenhum id interno no texto"),
    );
    const violations = await axe(p);
    if (violations)
      check(
        violations.length === 0,
        tag(
          `axe WCAG A/AA: ${violations.length ? violations.join(", ") : "sem violações"}`,
        ),
      );
    check(
      !/15\/01\/1986|14:30|Recife/.test(t),
      tag("leitura sem data, hora ou cidade"),
    );
    // Montagem no navegador: nenhuma requisição ao reabrir a leitura.
    const before = requests.length;
    await p
      .getByRole("link", { name: /Voltar/ })
      .first()
      .click();
    await p.waitForURL(/\/relatorio$/);
    await p
      .getByRole("link", { name: /Abrir a leitura desta jornada/ })
      .click();
    await p.waitForURL(/\/relatorio\/leitura$/);
    await h1(p);
    await p.waitForTimeout(800);
    const posts = requests.slice(before).filter((r) => r.startsWith("POST"));
    check(
      posts.length === 0,
      tag(
        `voltar e reabrir: cap. 8 e 9 preservados, nenhuma requisição POST (${posts.length})`,
      ),
    );
    check(
      counter(await reading(p)) === "9",
      tag("após voltar: continua 9 de 9"),
    );
    await pageShot(p, `04d-${vp}-nove-capitulos`);
    await shotOf(p, 8, `04d-${vp}-cap8-diferenca`);
    await shotOf(p, 9, `04d-${vp}-cap9-completo`);

    // 10. Recarregar: tudo apagado (só memória da aba).
    await p.reload();
    await h1(p);
    t = await reading(p);
    check(
      (await status(p, 8)) === "indisponível" &&
        (await status(p, 9)) === "indisponível" &&
        counter(t) === "0",
      tag("recarregar apaga a jornada: 8 e 9 indisponíveis, 0 de 9"),
    );

    // 6 e 8. Capítulo 8 indisponível e 9 disponível (horário desconhecido, U6).
    await palmToBirth(p);
    await birthAndRead(p, "São Paulo, horário desconhecido", /São Paulo — SP/);
    check(
      (await status(p, 8)) === "indisponível" &&
        (await status(p, 9)) === "disponível",
      tag(
        "horário desconhecido: cap. 8 indisponível (sem posição do mesmo tema), cap. 9 disponível",
      ),
    );
    check(
      /mesmos temas dos traços nítidos/.test(await chapterText(p, 8)),
      tag("cap. 8: motivo real (U6)"),
    );
    await shotOf(p, 8, `04d-${vp}-cap8-indisponivel`);
    await shotOf(p, 9, `04d-${vp}-cap9-sem-cap8`);

    // 10. Sair pelo X: apaga tudo.
    await p.getByRole("link", { name: "Sair da jornada" }).click();
    await p.waitForURL(`${base}/`);

    // 2. Só astrologia (direto aos dados de nascimento, sem mãos).
    await p.goto(`${base}/dados-de-nascimento`);
    await p.waitForLoadState("networkidle");
    await birthAndRead(p, "Recife, horário de verão (1986)", /Recife — PE/);
    t = await reading(p);
    check(
      (await status(p, 8)) === "indisponível" &&
        /leitura das mãos não está nesta jornada/.test(await chapterText(p, 8)),
      tag("só astrologia: cap. 8 indisponível (U1)"),
    );
    check(
      (await status(p, 9)) === "disponível" &&
        !/conex/i.test(await chapterText(p, 9)),
      tag("só astrologia: cap. 9 sem falar em conexões"),
    );
    check(counter(t) === "6", tag(`só astrologia: ${counter(t)} de 9`));
    await pageShot(p, `04d-${vp}-so-astrologia`);
    await shotOf(p, 9, `04d-${vp}-cap9-so-astrologia`);
  }

  if (engine === "com-motor" && scenario === "partial") {
    // 4 e 9. Leitura parcial: traço parcial fora das conexões, com a ressalva.
    await palmToBirth(p);
    await birthAndRead(p, "Recife, horário de verão (1986)", /Recife — PE/);
    const c8 = await chapterText(p, 8);
    check(
      /ficou só parcialmente visível/.test(c8) &&
        !/curvada para cima|traçado reto/.test(c8),
      tag("parcial: traçado do coração fora das conexões, com R-parcial"),
    );
    check(
      /Leitura parcial/.test(await reading(p)),
      tag("parcial: aviso da Parte II preservado"),
    );
    check(
      (await status(p, 9)) === "disponível",
      tag("parcial: cap. 9 disponível"),
    );
    await pageShot(p, `04d-${vp}-parcial`);
    await shotOf(p, 8, `04d-${vp}-cap8-parcial`);
  }

  if (engine === "sem-motor" && scenario === "clear") {
    // 3 e 5. Motor indisponível: só mãos; cap. 9 com conteúdo das mãos.
    await palmToBirth(p);
    await birthAndRead(p, "Recife, horário de verão (1986)", /Recife — PE/);
    check(
      (await status(p, 8)) === "indisponível" &&
        /capítulos do mapa natal não estão/.test(await chapterText(p, 8)),
      tag("motor indisponível: cap. 8 indisponível (U2)"),
    );
    const c9 = await chapterText(p, 9);
    check(
      (await status(p, 9)) === "disponível" &&
        /\(cap\. 7\)/.test(c9) &&
        !/\(cap\. [1-5]\)/.test(c9),
      tag("só mãos: cap. 9 só com referências do cap. 7"),
    );
    check(counter(await reading(p)) === "3", tag("só mãos: 3 de 9"));
    await shotOf(p, 9, `04d-${vp}-cap9-so-maos`);
  }

  if (engine === "sem-motor" && scenario === "insufficient") {
    // 7. Ambos indisponíveis por falta de conteúdo: a foto insuficiente não
    // chega à prévia (a tela pede outra foto) e o motor está desligado.
    await palmToBirth(p).catch(() => null);
    check(
      /\/foto$/.test(p.url()),
      tag(
        "foto insuficiente: permanece na etapa da foto, nada vai para a jornada",
      ),
    );
    await p.goto(`${base}/dados-de-nascimento`);
    await p.waitForLoadState("networkidle");
    await birthAndRead(p, "Recife, horário de verão (1986)", /Recife — PE/);
    check(
      (await status(p, 8)) === "indisponível" &&
        (await status(p, 9)) === "indisponível",
      tag("sem conteúdo: cap. 8 e cap. 9 indisponíveis"),
    );
    check(
      /nenhuma delas está disponível/.test(await chapterText(p, 8)),
      tag("cap. 8: motivo U3"),
    );
    check(
      /Não há temas suficientes nesta jornada/.test(await chapterText(p, 9)),
      tag("cap. 9: motivo V1"),
    );
    check(counter(await reading(p)) === "0", tag("0 de 9"));
    await pageShot(p, `04d-${vp}-sem-conteudo`);
  }

  // Privacidade da execução inteira.
  const storage = await p.evaluate(async () => ({
    local: localStorage.length,
    session: sessionStorage.length,
    cookie: document.cookie,
    idb: (await indexedDB.databases?.())?.length ?? 0,
  }));
  check(
    storage.local === 0 &&
      storage.session === 0 &&
      storage.cookie === "" &&
      storage.idb === 0 &&
      (await ctx.cookies()).length === 0,
    tag("nada em localStorage, sessionStorage, cookies ou IndexedDB"),
  );
  check(
    !/blob:/.test(await p.evaluate(() => document.documentElement.outerHTML)),
    tag("nenhuma foto (blob:) no DOM na leitura (D5)"),
  );
  check(
    external.length === 0,
    tag(
      `nenhuma requisição a outro host (${[...new Set(external)].join(", ") || "nenhuma"})`,
    ),
  );
  await ctx.close();
}
await browser.close();
rmSync(dir, { recursive: true, force: true });
console.log(
  failures
    ? `\n[${mode}] ${failures} falha(s)`
    : `\n[${mode}] todas as verificações passaram`,
);
process.exit(failures ? 1 : 0);
