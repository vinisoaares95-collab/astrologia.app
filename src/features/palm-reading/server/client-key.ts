import "server-only";

/**
 * Chave opaca do cliente para os limites de uso (Fase 03G.3).
 *
 * Duas partes independentes:
 *
 * 1. **Pseudonimização (HMAC).** O IP vira HMAC-SHA256 com um segredo do
 *    servidor (`SIDERA_CLIENT_KEY_SECRET`). Um SHA-256 simples de IPv4 se
 *    reverte por enumeração; com HMAC, só quem tem o segredo consegue. Ainda
 *    é dado pessoal pseudonimizado, não anônimo. O IP original não é
 *    guardado nem registrado em log.
 *
 * 2. **Fronteira de confiança (de onde vem o IP).** O HMAC NÃO resolve a
 *    falsificação: `x-forwarded-for` chega do cliente e só é confiável na
 *    parte escrita pelo proxy da hospedagem. Como a hospedagem ainda não foi
 *    definida, nada é presumido:
 *    - `SIDERA_CLIENT_IP_HEADER`: um cabeçalho que o proxy de confiança
 *      SOBRESCREVE (ex.: o que a hospedagem documentar). Usa o valor dele.
 *    - `SIDERA_TRUSTED_PROXY_HOPS=N`: há N proxies de confiança que
 *      ACRESCENTAM a `x-forwarded-for`; usa a N-ésima entrada da direita.
 *    - Nenhum dos dois, fora de produção: modo "não confiável" de
 *      desenvolvimento (primeiro `x-forwarded-for`, depois `x-real-ip`),
 *      igual ao comportamento anterior. Falsificável; aceitável só porque
 *      não há exposição pública.
 *    - Nenhum dos dois (ou os dois) em produção: sem chave → os endpoints
 *      respondem 503. Não há como limitar por cliente com segurança sem
 *      saber qual cabeçalho o proxy garante.
 */
import { createHmac, randomBytes } from "node:crypto";
import { isIP } from "node:net";

type Env = Record<string, string | undefined>;

export type ClientIpSource =
  | { kind: "header"; header: string }
  | { kind: "forwarded-for"; hops: number }
  | { kind: "untrusted-dev" };

export const MIN_CLIENT_KEY_SECRET_LENGTH = 32;
export const MAX_TRUSTED_PROXY_HOPS = 5;
/** Todos os clientes sem IP válido dividem a mesma cota (nunca a escapam). */
export const UNKNOWN_CLIENT = "unknown";

const HEADER_NAME = /^[a-z0-9-]{1,64}$/;

/** De onde ler o IP, conforme a configuração; `null` = sem fonte segura. */
export function readClientIpSource(
  env: Env = process.env,
): ClientIpSource | null {
  const header = env.SIDERA_CLIENT_IP_HEADER?.trim().toLowerCase();
  const hopsRaw = env.SIDERA_TRUSTED_PROXY_HOPS?.trim();
  if (header && hopsRaw) return null; // ambíguo: não escolher por conta própria
  if (header)
    return HEADER_NAME.test(header) ? { kind: "header", header } : null;
  if (hopsRaw) {
    const hops = Number(hopsRaw);
    return Number.isInteger(hops) && hops >= 1 && hops <= MAX_TRUSTED_PROXY_HOPS
      ? { kind: "forwarded-for", hops }
      : null;
  }
  return env.NODE_ENV === "production" ? null : { kind: "untrusted-dev" };
}

/**
 * Segredo do HMAC. Sem `SIDERA_CLIENT_KEY_SECRET` (≥ 32 caracteres), usa um
 * segredo aleatório do processo fora de produção; em produção, nenhum.
 */
let ephemeral: Buffer | null = null;
export function clientKeySecret(env: Env = process.env): Buffer | null {
  const configured = env.SIDERA_CLIENT_KEY_SECRET;
  if (configured && configured.length >= MIN_CLIENT_KEY_SECRET_LENGTH)
    return Buffer.from(configured);
  if (env.NODE_ENV === "production") return null;
  ephemeral ??= randomBytes(32);
  return ephemeral;
}

const validIp = (value: string | undefined | null): string | null => {
  const ip = value?.trim();
  return ip && isIP(ip) ? ip : null;
};

/** O IP conforme a fonte; `null` quando ausente ou inválido. */
export function extractClientIp(
  request: Request,
  source: ClientIpSource,
): string | null {
  const h = request.headers;
  switch (source.kind) {
    case "header":
      return validIp(h.get(source.header));
    case "forwarded-for": {
      const list = (h.get("x-forwarded-for") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      return validIp(list[list.length - source.hops]);
    }
    case "untrusted-dev":
      return (
        validIp(h.get("x-forwarded-for")?.split(",")[0]) ??
        validIp(h.get("x-real-ip"))
      );
  }
}

export type ClientKeyer = (request: Request) => string | null;

/**
 * Cria a função que dá a chave do cliente. Devolve `null` (endpoint
 * indisponível) quando falta o segredo ou uma fonte de IP segura.
 */
export function createClientKeyer(config: {
  secret: Buffer | null;
  source: ClientIpSource | null;
}): ClientKeyer {
  const { secret, source } = config;
  return (request) => {
    if (!secret || !source) return null;
    const ip = extractClientIp(request, source) ?? UNKNOWN_CLIENT;
    return createHmac("sha256", secret).update(`client:${ip}`).digest("hex");
  };
}

export function clientKeyerFromEnv(env: Env = process.env): ClientKeyer {
  return createClientKeyer({
    secret: clientKeySecret(env),
    source: readClientIpSource(env),
  });
}
