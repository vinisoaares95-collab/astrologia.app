// Fase 04B: o resultado das mãos segue para a jornada, sem a foto.
//
// Uso (servidor de desenvolvimento, análise SIMULADA, sem custo):
//   SIDERA_PALM_ANALYSIS_ENABLED=1 SIDERA_PALM_VISION_MOCK_SCENARIO=<clear|partial|insufficient> \
//   SIDERA_CONSENT_SECRET=… SIDERA_CLIENT_KEY_SECRET=… SIDERA_CLIENT_IP_HEADER=x-client-ip \
//   SIDERA_REPORT_READING=1 SIDERA_REPORT_DEMO=1 node scripts/with-tzdata.mjs npx next dev -p 3360
// (em produção a leitura das mãos responde 503 por projeto — Fase 03G.3)
//   node scripts/e2e/04b-jornada.mjs <clear|partial|insufficient> [http://localhost:3360] [pasta-de-capturas]
//
// Imagem sintética gerada na hora; nenhum dado real. Desktop e iPhone 13.
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

import sharp from "sharp";

const { chromium, devices } = createRequire(import.meta.url)("playwright");

const mode = process.argv[2] ?? "clear";
const base = process.argv[3] ?? "http://localhost:3360";
const shots = process.argv[4] ?? null;
if (shots) mkdirSync(shots, { recursive: true });
const dir = mkdtempSync(join(tmpdir(), "sidera-04b-"));
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
const PREVIEW_IMG = 'img[alt="Pré-visualização da foto da sua palma"]';
// HTML inteiro (inclui rotas escondidas pelo <Activity>): para "nenhuma foto".
const html = (p) => p.evaluate(() => document.documentElement.outerHTML);
// Só o que está visível (as rotas escondidas não contam): para o conteúdo.
const visible = (p) => p.locator("body").innerText();
const blobAlive = (p, url) =>
  p.evaluate(async (u) => {
    try {
      await (await fetch(u)).blob();
      return true;
    } catch {
      return false;
    }
  }, url);
const chapterText = (p, n) =>
  p
    .locator(`article[aria-labelledby="capitulo-${n}"]:visible`)
    .first()
    .innerText();
const shot = async (p, name) => {
  if (shots) await p.screenshot({ path: join(shots, `${name}.png`) });
};

async function startReading(p) {
  await p.goto(`${base}/leitura-das-maos`);
  await p.waitForLoadState("networkidle"); // hidratação (em dev é mais lenta)
  await p.click('a[href="/leitura-das-maos/consentimento"]');
  await p.waitForURL(/consentimento$/);
  await p.locator('input[type="radio"]').first().check({ force: true });
  for (const c of await p.locator('input[type="checkbox"]').all())
    await c.check({ force: true });
  await p.getByRole("button", { name: /Continuar para a foto/ }).click();
  await p.waitForURL(/\/foto$/);
  await p.locator('input[type="file"]').last().setInputFiles(IMG);
  await p.locator(PREVIEW_IMG).waitFor({ timeout: 15000 });
  return p.locator(PREVIEW_IMG).getAttribute("src");
}

/** Parcial: com capítulo indisponível, a pessoa decide seguir; senão, segue direto. */
async function followPartial(p) {
  const seguir = p.getByRole("button", { name: /Seguir com esta leitura/ });
  await Promise.race([
    seguir.first().waitFor({ timeout: 20000 }),
    p.waitForURL(/previa$/, { timeout: 20000 }),
  ]);
  if (!/previa$/.test(p.url())) await seguir.first().click();
}

async function toBirthReportAndReading(p) {
  // Caso fictício do próprio formulário → proposta → leitura (navegação no app).
  await p.locator("summary", { hasText: "Casos de verificação" }).click();
  await p.locator("details button").first().click();
  // O caso carrega a cidade por Server Action: esperar o campo preenchido.
  await p
    .getByText(/Recife — PE/)
    .first()
    .waitFor({ timeout: 30000 });
  await p.getByRole("button", { name: /Verificar dados/ }).click();
  try {
    await p
      .getByRole("button", { name: /Confirmar e ver a proposta/ })
      .click({ timeout: 120000 });
  } catch (error) {
    console.log((await p.locator("main").innerText()).slice(0, 1500));
    throw error;
  }
  await p.waitForURL(/\/relatorio$/);
  await p.getByRole("link", { name: /Abrir a leitura desta jornada/ }).click();
  await p.waitForURL(/\/relatorio\/leitura$/);
  await p.getByRole("heading", { level: 1 }).first().waitFor();
}

async function goReadingViaSite(p) {
  await p.goto(`${base}/`);
  await p.waitForLoadState("networkidle");
  await p.locator('a[href="/relatorio"]:visible').first().click();
  await p.waitForURL(/\/relatorio$/);
  await p.getByRole("link", { name: /Abrir a leitura desta jornada/ }).click();
  await p.waitForURL(/\/relatorio\/leitura$/);
  await p.getByRole("heading", { level: 1 }).first().waitFor();
}

const absent = /Não há leitura das mãos nesta jornada/;

const browser = await chromium.launch();
for (const [vp, options] of [
  ["desktop", { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }],
  ["mobile", devices["iPhone 13"]],
]) {
  const ctx = await browser.newContext({
    ...options,
    // IP de documentação aleatório por contexto: os limites por cliente
    // (10/h) não se somam entre execuções.
    // (Em desenvolvimento, sem SIDERA_CLIENT_IP_HEADER, vale x-forwarded-for.)
    extraHTTPHeaders: (() => {
      const ip = `203.0.113.${1 + Math.floor(Math.random() * 254)}`;
      return { "x-client-ip": ip, "x-forwarded-for": ip };
    })(),
  });
  const p = await ctx.newPage();
  const tag = (m) => `${vp}: ${m}`;

  // 1. Captura e análise.
  const url = await startReading(p);
  await p.getByRole("button", { name: /analisar a foto/i }).click();
  if (mode === "insufficient") {
    await p
      .getByText(/Nenhum dos dois capítulos pôde ser feito com esta foto/)
      .first()
      .waitFor({ timeout: 20000 });
    check(
      (await p
        .getByRole("button", { name: /Seguir com esta leitura/ })
        .count()) === 0,
      tag(
        "foto insuficiente: não há como seguir com a leitura (orientação de nova foto mantida)",
      ),
    );
    await shot(p, `04b-${vp}-insuficiente-foto`);
    // Sair pela jornada e abrir a leitura: Parte II indisponível, sem exemplos.
    await goReadingViaSite(p);
    const t = await visible(p);
    const raw = await html(p);
    check(
      absent.test(t) && !/blob:/.test(raw),
      tag("leitura sem as mãos: motivo explicado, sem foto"),
    );
    await shot(p, `04b-${vp}-insuficiente-leitura`);
    await ctx.close();
    continue;
  }
  if (mode === "partial") await followPartial(p);
  await p.waitForURL(/previa$/, { timeout: 20000 });
  const preview = { 6: await chapterText(p, 6), 7: await chapterText(p, 7) };
  await shot(p, `04b-${vp}-${mode}-previa`);

  // 2. Transferência sem foto.
  await p
    .getByRole("button", { name: /Continuar: dados de nascimento/ })
    .click();
  await p.waitForURL(/dados-de-nascimento$/);
  await p.waitForTimeout(500);
  const h = await html(p);
  check(
    !/blob:/.test(h) && (await p.locator('img[alt="Sua foto"]').count()) === 0,
    tag("no nascimento: nenhuma referência à foto no DOM"),
  );
  check(!(await blobAlive(p, url)), tag("URL local da foto revogada"));
  await shot(p, `04b-${vp}-${mode}-nascimento`);

  // 5. Voltar pelo navegador: a foto não volta; o texto segue na jornada.
  await p.goBack();
  await p.waitForURL(/previa$/);
  await p.waitForTimeout(500);
  check(
    (await p.locator('img[alt="Sua foto"]').count()) === 0,
    tag("voltar à prévia não restaura a foto"),
  );
  check(
    await p
      .getByText(/texto da sua leitura continua na memória desta jornada/)
      .isVisible(),
    tag("a prévia avisa que o texto segue na jornada"),
  );
  await p.goForward();
  await p.waitForURL(/dados-de-nascimento$/);

  // 1 e 3. Nascimento → proposta → leitura: capítulos 6 e 7 idênticos à prévia.
  await toBirthReportAndReading(p);
  check(
    (await chapterText(p, 6)) === preview[6],
    tag("capítulo 6 idêntico ao da prévia"),
  );
  check(
    (await chapterText(p, 7)) === preview[7],
    tag("capítulo 7 idêntico ao da prévia"),
  );
  const r = await visible(p);
  check(
    /Leitura interna/.test(r) &&
      /não é calculado neste ambiente|Em integração/i.test(r) &&
      !/Em definição/i.test(r) &&
      /capítulos do mapa natal não estão nesta jornada/.test(r),
    tag(
      "1–5 sem motor (indisponível com o motivo); 04D: cap. 8 indisponível pela causa real (U2), sem 'em definição'",
    ),
  );
  check(
    !/blob:/.test(await html(p)) &&
      !/Demonstração interna com dados de exemplo/.test(r),
    tag("leitura real: sem foto e sem exemplos"),
  );
  if (mode === "partial")
    check(/Leitura parcial/.test(r), tag("leitura parcial sinalizada"));
  await shot(p, `04b-${vp}-${mode}-leitura`);
  await p.locator("#parte-ii").scrollIntoViewIfNeeded();
  await p.mouse.wheel(0, 120);
  await p.waitForTimeout(500);
  await shot(p, `04b-${vp}-${mode}-leitura-maos`);

  // 9. Exemplos separados: ?cenario= mostra exemplos, não a jornada.
  await p.goto(`${base}/relatorio/leitura?cenario=completo`);
  await p.getByRole("heading", { level: 1 }).first().waitFor();
  const demo = await visible(p);
  check(
    // Marcadores exclusivos de cada modo: a demonstração não lê a jornada
    // (céu de exemplo preenchido, sem o aviso da jornada real).
    /Demonstração interna com dados de exemplo/.test(demo) &&
      /Sol em Touro/.test(demo) &&
      !/Leitura interna em construção/.test(demo),
    tag("exemplos isolados da jornada real"),
  );

  // 7. Recarregar: a carga nova não tem a leitura.
  await toBirthAgain(p);
  async function toBirthAgain(page) {
    await page.goto(`${base}/relatorio/leitura`);
    await page.getByRole("heading", { level: 1 }).first().waitFor();
  }
  check(
    absent.test(await visible(p)),
    tag("recarregar/abrir de novo: a leitura não existe mais"),
  );

  // 6. Sair da jornada e voltar: o texto foi apagado.
  await startReading(p);
  await p.getByRole("button", { name: /analisar a foto/i }).click();
  if (mode === "partial") await followPartial(p);
  await p.waitForURL(/previa$/, { timeout: 20000 });
  await p
    .getByRole("button", { name: /Continuar: dados de nascimento/ })
    .click();
  await p.waitForURL(/dados-de-nascimento$/);
  await p.getByRole("link", { name: "Sair da jornada" }).click();
  await p.waitForURL(`${base}/`);
  await p.locator('a[href="/relatorio"]:visible').first().click();
  await p.waitForURL(/\/relatorio$/);
  await p.getByRole("link", { name: /Abrir a leitura desta jornada/ }).click();
  await p.waitForURL(/\/relatorio\/leitura$/);
  await p.getByRole("heading", { level: 1 }).first().waitFor();
  check(
    absent.test(await visible(p)),
    tag("sair da jornada (X) e voltar: texto apagado"),
  );
  await p.goBack(); // de volta à proposta, depois ao nascimento escondido
  await p.waitForTimeout(400);

  // 8. Resposta atrasada: sair durante a análise não recria nada.
  let held = 0;
  await p.route("**/api/leitura-das-maos/analise", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    held++;
    await new Promise((res) => setTimeout(res, 4000));
    await route.continue().catch(() => {});
  });
  await startReading(p);
  await p.getByRole("button", { name: /analisar a foto/i }).click();
  await p.waitForTimeout(300);
  await p.getByRole("link", { name: "Sair da jornada" }).click();
  await p.waitForURL(`${base}/`);
  await p.waitForTimeout(5500);
  check(
    p.url() === `${base}/` && held === 1,
    tag("resposta atrasada não leva de volta à prévia"),
  );
  await p.unroute("**/api/leitura-das-maos/analise");
  await p.locator('a[href="/relatorio"]:visible').first().click();
  await p.waitForURL(/\/relatorio$/);
  await p.getByRole("link", { name: /Abrir a leitura desta jornada/ }).click();
  await p.waitForURL(/\/relatorio\/leitura$/);
  await p.getByRole("heading", { level: 1 }).first().waitFor();
  check(
    absent.test(await visible(p)) && !/blob:/.test(await html(p)),
    tag("resposta atrasada não recria a leitura nem a foto"),
  );
  await shot(p, `04b-${vp}-${mode}-leitura-ausente`);

  // 10. Nenhum armazenamento persistente.
  const storage = await p.evaluate(async () => ({
    local: localStorage.length,
    session: sessionStorage.length,
    cookie: document.cookie,
    idb: (await indexedDB.databases?.())?.length ?? 0,
  }));
  const cookies = await ctx.cookies();
  check(
    storage.local === 0 &&
      storage.session === 0 &&
      storage.cookie === "" &&
      storage.idb === 0 &&
      cookies.length === 0,
    tag(
      `nada em localStorage, sessionStorage, cookies ou IndexedDB (${JSON.stringify(storage)}, cookies=${cookies.length})`,
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
