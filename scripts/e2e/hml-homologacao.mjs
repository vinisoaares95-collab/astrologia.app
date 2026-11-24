// Fase 03G.1: verificação do ambiente de homologação (local ou na Vercel).
//
// Uso (credenciais SÓ por variável de ambiente; nunca no código, no chat ou
// em logs):
//   HML_USER=… HML_PASSWORD=… node scripts/e2e/hml-homologacao.mjs <url> [capturas]
//
// Só usa casos FICTÍCIOS de verificação ("Casos de verificação" do
// formulário). Nenhuma foto, nenhuma IA, nenhum dado pessoal.
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const { chromium, devices } = require("playwright");

const base = (process.argv[2] ?? "http://localhost:3400").replace(/\/$/, "");
const shots = process.argv[3] ?? null;
const user = process.env.HML_USER;
const password = process.env.HML_PASSWORD;
if (!user || !password) {
  console.error("Defina HML_USER e HML_PASSWORD no ambiente.");
  process.exit(2);
}
if (shots) mkdirSync(shots, { recursive: true });

let failures = 0;
const check = (ok, msg) => {
  if (!ok) failures++;
  console.log(`${ok ? "OK  " : "FALHA"} ${msg}`);
};
const auth = `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;

// 1. Proteção de acesso e indexação (sem navegador).
for (const path of ["/", "/dados-de-nascimento", "/relatorio", "/robots.txt"]) {
  const r = await fetch(base + path, { redirect: "manual" });
  check(
    r.status === 401 || (r.status >= 300 && r.status < 400),
    `sem credenciais ${path}: bloqueado (${r.status})`,
  );
}
const wrong = await fetch(base + "/", {
  headers: {
    authorization: `Basic ${Buffer.from(`${user}:senha-errada`).toString("base64")}`,
  },
});
check(wrong.status === 401, `senha errada: 401 (${wrong.status})`);
const home = await fetch(base + "/", { headers: { authorization: auth } });
check(home.status === 200, `com credenciais: 200 (${home.status})`);
check(
  /noindex/.test(home.headers.get("x-robots-tag") ?? ""),
  `cabeçalho de não indexação (${home.headers.get("x-robots-tag")})`,
);
check(
  /<meta name="robots" content="noindex, nofollow"/.test(await home.text()),
  "meta robots noindex na página",
);
const robots = await fetch(base + "/robots.txt", {
  headers: { authorization: auth },
});
check(/Disallow: \//.test(await robots.text()), "robots.txt bloqueia tudo");
const palm = await fetch(base + "/api/leitura-das-maos/analise", {
  method: "POST",
  headers: { authorization: auth, "content-type": "application/json" },
  body: "{}",
});
check(
  palm.status === 404 || palm.status === 503,
  `leitura das mãos desligada no servidor (${palm.status})`,
);
const reading = await fetch(base + "/relatorio/leitura?cenario=completo", {
  headers: { authorization: auth },
});
check(
  !/Demonstração interna|dados de exemplo/i.test(await reading.text()),
  `demonstração com dados de exemplo desligada (${reading.status})`,
);

const browser = await chromium.launch();
for (const [vp, options] of [
  ["desktop", { viewport: { width: 1440, height: 900 } }],
  ["iphone13", devices["iPhone 13"]],
]) {
  const ctx = await browser.newContext({
    ...options,
    httpCredentials: { username: user, password },
  });
  const p = await ctx.newPage();
  const tag = (m) => `${vp}: ${m}`;
  const errors = [];
  p.on("pageerror", (e) => errors.push(String(e)));
  const overflow = () =>
    p.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );

  // Abertura e navegação.
  await p.goto(base + "/");
  await p.getByRole("heading", { level: 1 }).first().waitFor();
  check((await overflow()) <= 0, tag("início sem rolagem horizontal"));
  if (shots) await p.screenshot({ path: join(shots, `${vp}-inicio.png`) });
  await p.goto(base + "/como-funciona");
  check(
    await p.getByRole("heading", { level: 1 }).first().isVisible(),
    tag("página Como funciona abre"),
  );

  // Formulário: validação.
  await p.goto(base + "/dados-de-nascimento");
  await p.waitForLoadState("networkidle");
  await p.getByRole("button", { name: /Verificar dados/ }).click();
  await p.waitForTimeout(500);
  check(
    (await p.locator('[aria-invalid="true"]').count()) > 0,
    tag("validação: campos obrigatórios marcados"),
  );

  // Busca de cidades.
  const combo = p.getByRole("combobox");
  await combo.fill("Recife");
  const option = p.getByRole("option", { name: /Recife/ }).first();
  await option.waitFor({ timeout: 20000 }).catch(() => {});
  check(await option.isVisible(), tag("busca de cidades: Recife encontrada"));

  // Fuso: horário inexistente (fictício) é tratado, sem cálculo silencioso.
  await p.goto(base + "/dados-de-nascimento");
  await p.waitForLoadState("networkidle");
  await p.locator("summary", { hasText: "Casos de verificação" }).click();
  await p
    .getByRole("button", { name: "São Paulo, horário inexistente" })
    .click();
  await p.getByRole("button", { name: /Verificar dados/ }).click();
  await p.waitForTimeout(3000);
  const gapText = await p.locator("main").innerText();
  check(
    /não existiu|inexistente|horário de verão|adiantad/i.test(gapText),
    tag("fuso: horário inexistente explicado"),
  );

  // Mapa natal e mandala interativa (caso fictício Recife 1986).
  await p.goto(base + "/dados-de-nascimento");
  await p.waitForLoadState("networkidle");
  await p.locator("summary", { hasText: "Casos de verificação" }).click();
  await p
    .getByRole("button", { name: "Recife, horário de verão (1986)" })
    .click();
  await p
    .getByText(/Recife — PE/)
    .first()
    .waitFor({ timeout: 30000 });
  await p.getByRole("button", { name: /Verificar dados/ }).click();
  await p
    .getByRole("button", { name: /Calcular mapa natal/ })
    .click({ timeout: 60000 })
    .catch(() => {});
  const chart = p.locator('section[aria-labelledby="mapa-natal"]');
  await chart.waitFor({ timeout: 60000 }).catch(() => {});
  check(await chart.isVisible(), tag("mapa natal calculado e exibido"));
  const bodies = chart.locator('g[role="button"][data-body]');
  const n = await bodies.count();
  check(n >= 10, tag(`mandala com ${n} corpos clicáveis`));
  if (n) {
    await bodies.first().dispatchEvent("click");
    check(
      (await bodies.first().getAttribute("aria-pressed")) === "true",
      tag("mandala: seleção de corpo"),
    );
  }
  check((await overflow()) <= 0, tag("mapa sem rolagem horizontal"));
  if (shots && (await chart.isVisible()))
    await chart.screenshot({ path: join(shots, `${vp}-mapa.png`) });

  // Relatório: capítulos 1–5 da jornada (sem mãos), na leitura interna.
  await p
    .getByRole("button", { name: /Confirmar e ver a proposta/ })
    .click({ timeout: 60000 });
  await p.waitForURL(/\/relatorio$/);
  await p.getByRole("link", { name: /Abrir a leitura desta jornada/ }).click();
  await p.waitForURL(/\/relatorio\/leitura$/);
  await p
    .getByText(/de 9 capítulos/)
    .first()
    .waitFor({ timeout: 120000 });
  await p.waitForFunction(
    () => !document.querySelector('[aria-busy="true"]'),
    null,
    { timeout: 120000 },
  );
  const text = await p.locator("main").innerText();
  const counter = text.match(/(\d) de 9 capítulos/)?.[1];
  check(
    counter === "6",
    tag(`leitura: ${counter} de 9 capítulos (céu + guia)`),
  );
  check(
    /leitura das mãos não está nesta jornada/.test(text),
    tag("capítulo 8 indisponível sem as mãos (U1)"),
  );
  if (shots) await p.screenshot({ path: join(shots, `${vp}-leitura.png`) });

  // Erro: página inexistente.
  const nf = await p.goto(base + "/pagina-que-nao-existe");
  check(nf?.status() === 404, tag(`página inexistente: 404 (${nf?.status()})`));

  check(errors.length === 0, tag(`sem erros de JavaScript (${errors.length})`));
  await ctx.close();
}
await browser.close();
console.log(
  failures ? `\n${failures} falha(s)` : "\ntodas as verificações passaram",
);
process.exit(failures ? 1 : 0);
