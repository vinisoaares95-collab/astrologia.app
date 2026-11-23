// @vitest-environment node
/**
 * Chave do cliente (03G.3): HMAC com segredo e fronteira de confiança do IP.
 * O HMAC não resolve a falsificação de cabeçalho; estes testes conferem as
 * duas partes separadamente.
 */
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  clientKeySecret,
  clientKeyerFromEnv,
  createClientKeyer,
  extractClientIp,
  readClientIpSource,
} from "./client-key";

const SECRET = Buffer.alloc(32, 1);
const req = (headers: Record<string, string>) =>
  new Request("http://localhost/api", { headers });

describe("pseudonimização do IP", () => {
  const key = createClientKeyer({
    secret: SECRET,
    source: { kind: "untrusted-dev" },
  });

  it("não é o SHA-256 simples de antes nem contém o IP", () => {
    const k = key(req({ "x-forwarded-for": "203.0.113.7" }))!;
    expect(k).toMatch(/^[0-9a-f]{64}$/);
    expect(k).not.toBe(
      createHash("sha256").update("client:203.0.113.7").digest("hex"),
    );
    expect(k).not.toContain("203.0.113.7");
  });

  it("estável para o mesmo IP e segredo; muda com o segredo", () => {
    const a = key(req({ "x-forwarded-for": "203.0.113.7" }));
    expect(key(req({ "x-forwarded-for": "203.0.113.7" }))).toBe(a);
    expect(key(req({ "x-forwarded-for": "203.0.113.8" }))).not.toBe(a);
    const other = createClientKeyer({
      secret: Buffer.alloc(32, 2),
      source: { kind: "untrusted-dev" },
    });
    expect(other(req({ "x-forwarded-for": "203.0.113.7" }))).not.toBe(a);
  });

  it("sem segredo ou sem fonte segura: sem chave (endpoint indisponível)", () => {
    const h = req({ "x-forwarded-for": "203.0.113.7" });
    expect(
      createClientKeyer({ secret: null, source: { kind: "untrusted-dev" } })(h),
    ).toBeNull();
    expect(createClientKeyer({ secret: SECRET, source: null })(h)).toBeNull();
  });
});

describe("segredo do HMAC", () => {
  it("usa SIDERA_CLIENT_KEY_SECRET com 32+ caracteres", () => {
    const value = "x".repeat(32);
    expect(clientKeySecret({ SIDERA_CLIENT_KEY_SECRET: value })).toEqual(
      Buffer.from(value),
    );
  });

  it("produção sem segredo (ou curto demais): nenhum", () => {
    expect(clientKeySecret({ NODE_ENV: "production" })).toBeNull();
    expect(
      clientKeySecret({
        NODE_ENV: "production",
        SIDERA_CLIENT_KEY_SECRET: "curto",
      }),
    ).toBeNull();
  });

  it("fora de produção sem segredo: aleatório do processo", () => {
    const s = clientKeySecret({});
    expect(s?.length).toBe(32);
    expect(clientKeySecret({})).toBe(s);
  });
});

describe("fronteira de confiança do IP", () => {
  it("sem configuração: modo de desenvolvimento só fora de produção", () => {
    expect(readClientIpSource({})).toEqual({ kind: "untrusted-dev" });
    expect(readClientIpSource({ NODE_ENV: "production" })).toBeNull();
  });

  it("configuração inválida ou ambígua: nenhuma fonte (não adivinha)", () => {
    expect(
      readClientIpSource({
        SIDERA_CLIENT_IP_HEADER: "x-real-ip",
        SIDERA_TRUSTED_PROXY_HOPS: "1",
      }),
    ).toBeNull();
    expect(
      readClientIpSource({ SIDERA_CLIENT_IP_HEADER: "x real ip" }),
    ).toBeNull();
    for (const hops of ["0", "-1", "1.5", "6", "abc"])
      expect(
        readClientIpSource({ SIDERA_TRUSTED_PROXY_HOPS: hops }),
      ).toBeNull();
  });

  it("modo de desenvolvimento: falsificável, como antes (registrado)", () => {
    const source = { kind: "untrusted-dev" } as const;
    expect(
      extractClientIp(
        req({ "x-forwarded-for": "198.51.100.1, 10.0.0.1" }),
        source,
      ),
    ).toBe("198.51.100.1");
    expect(extractClientIp(req({ "x-real-ip": "198.51.100.2" }), source)).toBe(
      "198.51.100.2",
    );
    expect(extractClientIp(req({}), source)).toBeNull();
  });

  it("cabeçalho sobrescrito pelo proxy: ignora x-forwarded-for forjado", () => {
    const source = readClientIpSource({
      NODE_ENV: "production",
      SIDERA_CLIENT_IP_HEADER: "X-Client-IP",
    })!;
    expect(source).toEqual({ kind: "header", header: "x-client-ip" });
    expect(
      extractClientIp(
        req({ "x-forwarded-for": "1.2.3.4", "x-client-ip": "203.0.113.9" }),
        source,
      ),
    ).toBe("203.0.113.9");
  });

  it("N proxies que acrescentam: usa a N-ésima da direita, não a primeira", () => {
    const one = readClientIpSource({ SIDERA_TRUSTED_PROXY_HOPS: "1" })!;
    const two = readClientIpSource({ SIDERA_TRUSTED_PROXY_HOPS: "2" })!;
    // O cliente forjou "1.2.3.4"; o proxy acrescentou o IP real.
    const h = req({ "x-forwarded-for": "1.2.3.4, 203.0.113.9, 10.0.0.5" });
    expect(extractClientIp(h, one)).toBe("10.0.0.5");
    expect(extractClientIp(h, two)).toBe("203.0.113.9");
    expect(
      extractClientIp(req({ "x-forwarded-for": "203.0.113.9" }), two),
    ).toBeNull();
  });

  it("valor que não é IP é descartado; IPv6 aceito", () => {
    const source = { kind: "header", header: "x-client-ip" } as const;
    expect(
      extractClientIp(req({ "x-client-ip": "<script>" }), source),
    ).toBeNull();
    expect(extractClientIp(req({ "x-client-ip": "2001:db8::1" }), source)).toBe(
      "2001:db8::1",
    );
  });

  it("sem IP válido, todos dividem uma cota (forjar lixo não dá cota nova)", () => {
    const key = createClientKeyer({
      secret: SECRET,
      source: { kind: "header", header: "x-client-ip" },
    });
    expect(key(req({ "x-client-ip": "lixo-1" }))).toBe(
      key(req({ "x-client-ip": "lixo-2" })),
    );
  });

  it("produção sem fonte configurada: sem chave", () => {
    const key = clientKeyerFromEnv({
      NODE_ENV: "production",
      SIDERA_CLIENT_KEY_SECRET: "y".repeat(32),
    });
    expect(key(req({ "x-forwarded-for": "203.0.113.7" }))).toBeNull();
  });
});
