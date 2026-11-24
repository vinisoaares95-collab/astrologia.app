// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { config, proxy } from "../../proxy";
import { accessDecision, NO_INDEX } from "./access-gate";

const STRONG = "senha-forte-de-teste-123";
const basic = (u: string, p: string) =>
  `Basic ${Buffer.from(`${u}:${p}`).toString("base64")}`;

describe("accessDecision", () => {
  it("local, sem credenciais: aberto (desenvolvimento e testes)", () => {
    expect(accessDecision({}, null)).toEqual({ kind: "open" });
  });

  it("na Vercel sem credenciais: fechado (503), nunca aberto por engano", () => {
    expect(accessDecision({ VERCEL: "1" }, null).kind).toBe("misconfigured");
  });

  it("senha fraca ou usuário ausente: fechado", () => {
    expect(
      accessDecision(
        { SIDERA_ACCESS_USER: "a", SIDERA_ACCESS_PASSWORD: "curta" },
        null,
      ).kind,
    ).toBe("misconfigured");
    expect(accessDecision({ SIDERA_ACCESS_PASSWORD: STRONG }, null).kind).toBe(
      "misconfigured",
    );
  });

  it("com credenciais: pede autenticação, aceita só a correta", () => {
    const env = {
      VERCEL: "1",
      SIDERA_ACCESS_USER: "equipe",
      SIDERA_ACCESS_PASSWORD: STRONG,
    };
    expect(accessDecision(env, null).kind).toBe("challenge");
    expect(
      accessDecision(env, basic("equipe", "errada-errada-errada")).kind,
    ).toBe("challenge");
    expect(accessDecision(env, basic("outro", STRONG)).kind).toBe("challenge");
    expect(accessDecision(env, "Bearer x").kind).toBe("challenge");
    expect(accessDecision(env, basic("equipe", STRONG)).kind).toBe("allow");
  });
});

describe("proxy: homologação protegida", () => {
  afterEach(() => vi.unstubAllEnvs());
  const req = (path: string, auth?: string) =>
    new NextRequest(`https://homolog.example${path}`, {
      headers: auth ? { authorization: auth } : {},
    });

  it("cobre todas as rotas, exceto os estáticos do build", () => {
    const re = new RegExp(`^${config.matcher[0]}$`);
    for (const p of [
      "/",
      "/dados-de-nascimento",
      "/api/leitura-das-maos/analise",
      "/relatorio",
    ])
      expect(re.test(p), p).toBe(true);
    for (const p of ["/_next/static/chunk.js", "/_next/image", "/favicon.ico"])
      expect(re.test(p), p).toBe(false);
  });

  it("sem credenciais na Vercel: 503 em qualquer rota", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("SIDERA_ACCESS_USER", "");
    vi.stubEnv("SIDERA_ACCESS_PASSWORD", "");
    const r = proxy(req("/"));
    expect(r.status).toBe(503);
    expect(r.headers.get("x-robots-tag")).toBe(NO_INDEX);
  });

  it("com credenciais: 401 com desafio Basic; com a senha certa segue, sem indexação", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("SIDERA_ACCESS_USER", "equipe");
    vi.stubEnv("SIDERA_ACCESS_PASSWORD", STRONG);
    const denied = proxy(req("/dados-de-nascimento"));
    expect(denied.status).toBe(401);
    expect(denied.headers.get("www-authenticate")).toMatch(/^Basic realm=/);
    expect(denied.headers.get("cache-control")).toBe("no-store");
    const ok = proxy(req("/dados-de-nascimento", basic("equipe", STRONG)));
    expect(ok.headers.get("x-middleware-next")).toBe("1");
    expect(ok.headers.get("x-robots-tag")).toBe(NO_INDEX);
  });

  it("o bloqueio da leitura interna continua valendo depois do acesso", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("SIDERA_ACCESS_USER", "equipe");
    vi.stubEnv("SIDERA_ACCESS_PASSWORD", STRONG);
    vi.stubEnv("SIDERA_REPORT_READING", "");
    vi.stubEnv("SIDERA_REPORT_DEMO", "");
    expect(
      proxy(req("/relatorio/leitura", basic("equipe", STRONG))).status,
    ).toBe(404);
    expect(
      proxy(req("/relatorio", basic("equipe", STRONG))).headers.get(
        "x-middleware-next",
      ),
    ).toBe("1");
  });
});
