/**
 * Acesso restrito ao ambiente de homologação (Fase 03G.1).
 *
 * O Sidera ainda não é um serviço público (licença do motor astrológico,
 * pendências da 03G). Por isso, qualquer implantação na Vercel exige
 * credenciais, e na falta delas fica FECHADA (503), nunca aberta por engano.
 *
 * - Credenciais: SIDERA_ACCESS_USER e SIDERA_ACCESS_PASSWORD, só no
 *   servidor (variáveis secretas da hospedagem; nunca NEXT_PUBLIC_, nunca no
 *   repositório). Senha com pelo menos 16 caracteres.
 * - Fora da Vercel e sem credenciais (desenvolvimento local, testes), o
 *   acesso continua aberto, como antes.
 * - Não há variável para "abrir ao público": o lançamento exige mudança de
 *   código revisada, depois das decisões de licença e da 03G.
 */
import { createHash, timingSafeEqual } from "node:crypto";

type Env = Record<string, string | undefined>;

export const ACCESS_MIN_PASSWORD_LENGTH = 16;
export const ACCESS_REALM = "Sidera - homologacao";

export type AccessDecision =
  | { kind: "open" }
  | { kind: "allow" }
  | { kind: "challenge" }
  | { kind: "misconfigured"; reason: string };

const digest = (s: string) => createHash("sha256").update(s, "utf8").digest();

/** Decide o acesso a partir das variáveis e do cabeçalho Authorization. */
export function accessDecision(
  env: Env,
  authorization: string | null,
): AccessDecision {
  const user = env.SIDERA_ACCESS_USER ?? "";
  const password = env.SIDERA_ACCESS_PASSWORD ?? "";
  const configured = user !== "" || password !== "";
  const onVercel = env.VERCEL === "1";
  if (!configured)
    return onVercel
      ? {
          kind: "misconfigured",
          reason: "Acesso restrito sem credenciais configuradas.",
        }
      : { kind: "open" };
  if (
    !user ||
    password.length < ACCESS_MIN_PASSWORD_LENGTH ||
    user.includes(":")
  )
    return {
      kind: "misconfigured",
      reason: "Credenciais de acesso inválidas (usuário ou senha fraca).",
    };
  const match = /^Basic\s+([A-Za-z0-9+/=]+)$/i.exec(authorization ?? "");
  if (!match) return { kind: "challenge" };
  let given: string;
  try {
    given = Buffer.from(match[1], "base64").toString("utf8");
  } catch {
    return { kind: "challenge" };
  }
  // Comparação em tempo constante (resumos de mesmo tamanho).
  return timingSafeEqual(digest(given), digest(`${user}:${password}`))
    ? { kind: "allow" }
    : { kind: "challenge" };
}

/** Cabeçalhos que impedem indexação e cache das respostas. */
export const NO_INDEX = "noindex, nofollow, noarchive";
