// 03G.3, D5: saída do fluxo da leitura das mãos, em Chromium real.
//
// Uso (servidor local em modo SIMULADO, sem provedor de IA e sem custo):
//   SIDERA_PALM_ANALYSIS_ENABLED=1 npx next dev -p 3330      # ou next start,
//     com SIDERA_CONSENT_SECRET, SIDERA_CLIENT_KEY_SECRET e
//     SIDERA_CLIENT_IP_HEADER=x-client-ip (o roteiro envia esse cabeçalho)
//   node scripts/e2e/d5-saida-do-fluxo.mjs [http://localhost:3330]
//
// Usa uma imagem sintética gerada na hora (nenhuma foto real).
import { mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

import sharp from "sharp";

// O Playwright vem pré-instalado no ambiente (fora das dependências).
const { chromium } = createRequire(import.meta.url)("playwright");

const base = process.argv[2] ?? "http://localhost:3330";
const dir = mkdtempSync(join(tmpdir(), "sidera-d5-"));
const IMG = join(dir, "sintetica.jpg");
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(
    `${ok ? "OK  " : "FALHA"} ${name}${detail ? " — " + detail : ""}`,
  );
};
const PREVIEW = 'img[alt="Pré-visualização da foto da sua palma"]';

async function consent(p) {
  await p.goto(base + "/leitura-das-maos");
  await p.click('a[href="/leitura-das-maos/consentimento"]');
  await p.waitForURL(/consentimento/);
  await p.locator('input[type="radio"]').first().check({ force: true });
  for (const c of await p.locator('input[type="checkbox"]').all())
    await c.check({ force: true });
  await p.getByRole("button", { name: /Continuar para a foto/ }).click();
  await p.waitForURL(/\/leitura-das-maos\/foto/);
}
async function upload(p) {
  await p.locator('input[type="file"]').last().setInputFiles(IMG);
  await p.locator(PREVIEW).waitFor({ timeout: 15000 });
  return p.locator(PREVIEW).getAttribute("src");
}
const html = (p) => p.evaluate(() => document.documentElement.outerHTML);
const blobAlive = (p, url) =>
  p.evaluate(async (u) => {
    try {
      await (await fetch(u)).blob();
      return true;
    } catch {
      return false;
    }
  }, url);

(async () => {
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
  const b = await chromium.launch();
  const ctx = await b.newContext({
    extraHTTPHeaders: { "x-client-ip": "203.0.113.10" },
  });
  const p = await ctx.newPage();

  // 1. Etapas internas
  await consent(p);
  const url1 = await upload(p);
  await p.getByRole("button", { name: /analisar a foto/i }).click();
  await p.waitForURL(/previa/, { timeout: 20000 });
  check("1a. análise simulada leva à prévia", true);
  await p.goBack();
  await p.waitForURL(/\/foto$/);
  await p.waitForTimeout(500);
  const keptPhoto = (await p.locator(PREVIEW).count()) === 1;
  check(
    "1b. voltar para a etapa da foto mantém a foto",
    keptPhoto && (await blobAlive(p, url1)),
  );
  await p.goBack();
  await p.waitForURL(/consentimento$/);
  const checked = await p.locator('input[type="checkbox"]:checked').count();
  check(
    "1c. voltar ao consentimento mantém as escolhas",
    checked === 2,
    `${checked} caixas marcadas`,
  );
  await p.goForward();
  await p.waitForURL(/\/foto$/);

  // 2. Saída para a página inicial
  await p.click('a[href="/"]');
  await p.waitForURL(base + "/");
  await p.waitForTimeout(800);
  const h2 = await html(p);
  check(
    "2a. nenhuma referência blob: na página (rotas ocultas incluídas)",
    !/blob:/.test(h2),
  );
  check(
    "2b. prévia da foto não existe no DOM oculto",
    (await p.locator(PREVIEW).count()) === 0,
  );
  check("2c. URL local da foto revogada", !(await blobAlive(p, url1)));
  check(
    "2d. nenhum campo de arquivo guarda a foto original",
    await p.evaluate(() =>
      [...document.querySelectorAll('input[type="file"]')].every(
        (i) => !i.files || i.files.length === 0,
      ),
    ),
  );

  // 3. Voltar pelo navegador
  await p.goBack();
  await p.waitForURL(/\/foto$/);
  await p.waitForTimeout(800);
  check(
    "3a. de volta à foto: pede o consentimento de novo",
    await p.getByText("Antes da foto").isVisible(),
  );
  check(
    "3b. a foto anterior não reaparece",
    (await p.locator(PREVIEW).count()) === 0,
  );
  await p.click('a[href="/leitura-das-maos/consentimento"]');
  await p.waitForURL(/consentimento$/);
  check(
    "3c. consentimento recomeça com as caixas desmarcadas",
    (await p.locator('input[type="checkbox"]:checked').count()) === 0 &&
      (await p.locator('input[type="radio"]:checked').count()) === 0,
  );

  // 4. Saída com análise em andamento (resposta atrasada 5 s)
  let analysisRequests = 0;
  await p.route("**/api/leitura-das-maos/analise", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    analysisRequests++;
    await new Promise((r) => setTimeout(r, 5000));
    await route.continue().catch(() => {});
  });
  await p.locator('input[type="radio"]').first().check({ force: true });
  for (const c of await p.locator('input[type="checkbox"]').all())
    await c.check({ force: true });
  await p.getByRole("button", { name: /Continuar para a foto/ }).click();
  await p.waitForURL(/\/foto$/);
  const url4 = await upload(p);
  await p.getByRole("button", { name: /analisar a foto/i }).click();
  await p.waitForTimeout(300);
  await p.click('a[href="/"]');
  await p.waitForURL(base + "/");
  await p.waitForTimeout(7000); // a resposta chegaria aqui
  check(
    "4a. resposta atrasada não leva de volta à prévia",
    p.url() === base + "/",
    p.url(),
  );
  const h4 = await html(p);
  check(
    "4b. nada restaurado no DOM oculto (blob, prévia, resultado)",
    !/blob:/.test(h4) &&
      (await p.locator(PREVIEW).count()) === 0 &&
      !/Análise simulada concluída|Capítulo 6/i.test(h4),
  );
  check("4c. URL da foto revogada", !(await blobAlive(p, url4)));
  check(
    "4d. houve exatamente um envio",
    analysisRequests === 1,
    `${analysisRequests}`,
  );
  await p.unroute("**/api/leitura-das-maos/analise");
  await p.goBack();
  await p.waitForTimeout(800);
  check(
    "4e. voltar depois da saída pede o consentimento",
    await p.getByText("Antes da foto").isVisible(),
  );

  // 5. Recarregar e entrar de novo
  await p.reload();
  check(
    "5a. depois de recarregar, a etapa da foto pede o consentimento",
    await p.getByText("Antes da foto").isVisible(),
  );
  await consent(p);
  await upload(p);
  await p.getByRole("button", { name: /analisar a foto/i }).click();
  await p.waitForURL(/previa/, { timeout: 20000 });
  check("5b. novo fluxo completo funciona", true);

  await b.close();
  rmSync(dir, { recursive: true, force: true });
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} verificações`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error("ERRO", e.message);
  process.exit(2);
});
