// Fase 04C: relatório interno com os capítulos 1–7 (céu da biblioteca + mãos).
//
// Uso (servidor de desenvolvimento; leitura das mãos SIMULADA; motor astrológico
// interno; nenhuma IA; nenhum dado real):
//   SIDERA_INTERNAL_ENGINE=1 SIDERA_PALM_ANALYSIS_ENABLED=1 SIDERA_REPORT_READING=1 \
//   node scripts/with-tzdata.mjs npx next dev -p 3370
//   node scripts/e2e/04c-relatorio.mjs <com-motor|sem-motor> [http://localhost:3370] [pasta-de-capturas]
// (em produção a leitura das mãos responde 503 por projeto — Fase 03G.3)
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

import sharp from "sharp";

const { chromium, devices } = createRequire(import.meta.url)("playwright");

const mode = process.argv[2] ?? "com-motor";
const base = process.argv[3] ?? "http://localhost:3370";
const shots = process.argv[4] ?? null;
if (shots) mkdirSync(shots, { recursive: true });
const dir = mkdtempSync(join(tmpdir(), "sidera-04c-"));
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
const html = (p) => p.evaluate(() => document.documentElement.outerHTML);
const visible = (p) => p.locator("body").innerText();
const chapterText = (p, n) =>
  p
    .locator(`article[aria-labelledby="capitulo-${n}"]:visible`)
    .first()
    .innerText();
const shot = async (p, name, full = false) => {
  if (shots)
    await p.screenshot({ path: join(shots, `${name}.png`), fullPage: full });
};
const h1 = (p) => p.getByRole("heading", { level: 1 }).first().waitFor();

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
  const preview = { 6: await chapterText(p, 6), 7: await chapterText(p, 7) };
  await p
    .getByRole("button", { name: /Continuar: dados de nascimento/ })
    .click();
  await p.waitForURL(/dados-de-nascimento$/);
  return preview;
}

async function pickCase(p, label, placeText) {
  await p.locator("summary", { hasText: "Casos de verificação" }).click();
  await p.getByRole("button", { name: label }).click();
  await p.getByText(placeText).first().waitFor({ timeout: 30000 });
  await p.getByRole("button", { name: /Verificar dados/ }).click();
}

async function confirmAndRead(p) {
  await p
    .getByRole("button", { name: /Confirmar e ver a proposta/ })
    .click({ timeout: 120000 });
  await p.waitForURL(/\/relatorio$/);
  await p.getByRole("link", { name: /Abrir a leitura desta jornada/ }).click();
  await p.waitForURL(/\/relatorio\/leitura$/);
  await h1(p);
}

/** Espera o céu sair de "carregando". */
const skySettled = (p) =>
  p.waitForFunction(
    () => !document.querySelector('#parte-i [aria-busy="true"]'),
    null,
    { timeout: 120000 },
  );

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
  // 9. Nenhuma requisição a outro host durante a jornada.
  const external = [];
  p.on("request", (r) => {
    const u = new URL(r.url());
    if (
      !["localhost", "127.0.0.1"].includes(u.hostname) &&
      u.protocol.startsWith("http")
    )
      external.push(u.hostname);
  });
  let actionPosts = 0;
  p.on("request", (r) => {
    if (
      r.method() === "POST" &&
      r.headers()["next-action"] &&
      r.url().includes("/dados-de-nascimento")
    )
      actionPosts++;
  });

  // 10 e 1. Jornada completa, horário exato.
  const preview = await palmToBirth(p);
  await pickCase(p, "Recife, horário de verão (1986)", /Recife — PE/);
  await p
    .getByRole("button", { name: /Confirmar e ver a proposta/ })
    .waitFor({ timeout: 120000 });
  const before = actionPosts;
  await confirmAndRead(p);
  await skySettled(p);
  // Com motor: exatamente uma geração; sem motor: nenhuma chamada (indisponível).
  const expected = mode === "com-motor" ? 1 : 0;
  check(
    actionPosts - before === expected,
    tag(
      `chamadas de cálculo por confirmação: ${actionPosts - before} (esperado ${expected})`,
    ),
  );
  const r = await visible(p);
  if (mode === "com-motor") {
    // 4. Cinco capítulos do céu com conteúdo.
    const sky = await p.locator("#parte-i article:visible").count();
    const skyWithSynthesis = await p
      .locator("#parte-i article:visible", { hasText: "Síntese" })
      .count();
    check(
      sky === 5 && skyWithSynthesis === 5,
      tag(`capítulos 1–5 com leitura (${skyWithSynthesis}/5)`),
    );
    check(/7 de 9 capítulos com leitura/.test(r), tag("indicador: 7 de 9"));
    check(
      /não são fatos científicos/.test(r),
      tag("aviso de não cientificidade do céu"),
    );
  } else {
    check(
      /não é calculado neste ambiente/.test(r) && /2 de 9 capítulos/.test(r),
      tag("sem motor: Parte I indisponível com o motivo, 2 de 9"),
    );
  }
  // 5. Mãos preservadas.
  check(
    (await chapterText(p, 6)) === preview[6] &&
      (await chapterText(p, 7)) === preview[7],
    tag("capítulos 6 e 7 idênticos aos da prévia"),
  );
  check(
    /Em definição/i.test(r) && /Não é o relatório completo/.test(r),
    tag("8 e 9 em definição; não se apresenta como completo"),
  );
  // A foto não está em lugar nenhum do DOM (nem nas rotas escondidas). A
  // leitura visível não traz data, hora nem local digitados; o formulário de
  // nascimento escondido (<Activity>) mantém os campos na memória da aba,
  // como os textos dizem, até sair da jornada.
  const page = await html(p);
  const reading = await p.locator("#sumario").locator("xpath=..").innerText();
  check(
    !/blob:/.test(page) &&
      !/15\/01\/1986|1986-01-15|14:30|Recife/.test(reading),
    tag("leitura sem foto e sem data, hora ou cidade digitadas"),
  );
  await shot(p, `04c-${vp}-${mode}-leitura`);
  if (mode === "com-motor") {
    await p.locator("#cap-1").scrollIntoViewIfNeeded();
    await p.mouse.wheel(0, 60);
    await p.waitForTimeout(400);
    await shot(p, `04c-${vp}-ceu`);
  }

  // 8. Voltar pelo navegador e confirmar de novo o mesmo envio: não gera de novo.
  await p.goBack();
  await p.waitForURL(/\/relatorio$/);
  await p.goBack();
  await p.waitForURL(/dados-de-nascimento$/);
  const again = actionPosts;
  await p.getByRole("button", { name: /Confirmar e ver a proposta/ }).click();
  await p.waitForURL(/\/relatorio$/);
  await p.waitForTimeout(800);
  check(
    actionPosts === again,
    tag("voltar e confirmar o mesmo envio não gera de novo"),
  );

  // 7. Sair da jornada e voltar: tudo apagado.
  await p.getByRole("link", { name: "Sair da jornada" }).click();
  await p.waitForURL(`${base}/`);
  await p.locator('a[href="/relatorio"]:visible').first().click();
  await p.waitForURL(/\/relatorio$/);
  await p.getByRole("link", { name: /Abrir a leitura desta jornada/ }).click();
  await p.waitForURL(/\/relatorio\/leitura$/);
  await h1(p);
  const gone = await visible(p);
  check(
    /ainda não foram confirmados nesta jornada/.test(gone) &&
      /Não há leitura das mãos nesta jornada/.test(gone),
    tag("sair da jornada apaga céu e mãos"),
  );

  if (mode === "com-motor") {
    // 2. Horário aproximado e desconhecido: limitações do motor.
    for (const [label, place, name] of [
      ["Bom Jesus (PI), horário aproximado", /Bom Jesus/, "aproximado"],
      ["São Paulo, horário desconhecido", /São Paulo — SP/, "desconhecido"],
    ]) {
      await p.goto(`${base}/dados-de-nascimento`);
      await p.waitForLoadState("networkidle");
      await pickCase(p, label, place);
      await p
        .getByRole("button", { name: /Confirmar e ver a proposta/ })
        .waitFor({ timeout: 120000 });
      await confirmAndRead(p);
      await skySettled(p);
      const t = await visible(p);
      check(
        (await p
          .locator("#parte-i article:visible", { hasText: "Síntese" })
          .count()) === 5 && /Limites desta leitura/i.test(t),
        tag(`horário ${name}: cinco capítulos com as limitações do motor`),
      );
      if (name === "desconhecido") await shot(p, `04c-${vp}-desconhecido`);
    }

    // 3. Cidade inválida e horário inexistente: sem confirmação, sem cálculo.
    await p.goto(`${base}/dados-de-nascimento`);
    await p.waitForLoadState("networkidle");
    const posts0 = actionPosts;
    await p.getByRole("button", { name: /Verificar dados/ }).click();
    check(
      await p
        .getByText("Selecione a cidade na lista de resultados.")
        .isVisible(),
      tag("cidade não selecionada: erro no campo"),
    );
    await pickCase(p, "São Paulo, horário inexistente", /São Paulo — SP/);
    await p.waitForTimeout(2000);
    check(
      (await p
        .getByRole("button", { name: /Confirmar e ver a proposta/ })
        .count()) === 0,
      tag("horário inexistente: não há confirmação"),
    );
    await shot(p, `04c-${vp}-horario-inexistente`);
    check(
      actionPosts - posts0 <= 2,
      tag("erros de dados não disparam o cálculo"),
    );

    // 8. Resposta atrasada: sair durante o cálculo não recria nada.
    await p.goto(`${base}/dados-de-nascimento`);
    await p.waitForLoadState("networkidle");
    await pickCase(p, "Recife, horário de verão (1986)", /Recife — PE/);
    await p
      .getByRole("button", { name: /Confirmar e ver a proposta/ })
      .waitFor({ timeout: 120000 });
    await p.route("**/dados-de-nascimento", async (route) => {
      if (
        route.request().method() === "POST" &&
        route.request().headers()["next-action"]
      ) {
        await new Promise((res) => setTimeout(res, 4000));
      }
      await route.continue().catch(() => {});
    });
    await p.getByRole("button", { name: /Confirmar e ver a proposta/ }).click();
    await p.waitForURL(/\/relatorio$/);
    await p.getByRole("link", { name: "Sair da jornada" }).click();
    await p.waitForURL(`${base}/`);
    await p.waitForTimeout(5500);
    await p.unroute("**/dados-de-nascimento");
    await p.locator('a[href="/relatorio"]:visible').first().click();
    await p.waitForURL(/\/relatorio$/);
    await p
      .getByRole("link", { name: /Abrir a leitura desta jornada/ })
      .click();
    await p.waitForURL(/\/relatorio\/leitura$/);
    await h1(p);
    check(
      /ainda não foram confirmados nesta jornada/.test(await visible(p)),
      tag("resposta atrasada depois de sair não recria o céu"),
    );
  }

  // 9. Sem armazenamento e sem envio externo.
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
