import "server-only";

/**
 * Recibo de consentimento (Fase 03D).
 *
 * O navegador não "prova" consentimento com um booleano. No momento do
 * aceite, o servidor confere o que foi aceito (versão atual do texto,
 * maioridade declarada, autorização e mão) e emite um recibo ASSINADO
 * (HMAC-SHA256) com horário do servidor e validade curta. A análise só
 * aceita um recibo válido e usa a mão gravada nele, não a enviada depois.
 *
 * Limite assumido: o recibo não é registro jurídico. Não é guardado, não
 * identifica a pessoa e a maioridade continua sendo declarada. O registro
 * de consentimento exigido para a operação pública depende da revisão
 * jurídica (plano da Fase 03, decisão 6).
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { CONSENT_VERSION, type PalmHand } from "../consent";

export const RECEIPT_TTL_MS = 30 * 60 * 1000;

export type ConsentReceipt = {
  v: typeof CONSENT_VERSION;
  hand: PalmHand;
  adult: true;
  analysis: true;
  /** Emitido em (relógio do servidor). */
  iat: number;
  exp: number;
  /** Identificador aleatório do recibo (limite de análises por recibo). */
  nonce: string;
};

const b64url = (buf: Buffer) => buf.toString("base64url");

/**
 * Segredo de assinatura. Sem SIDERA_CONSENT_SECRET, usa um segredo
 * aleatório do processo (só desenvolvimento: recibos não sobrevivem a um
 * reinício). Em produção, sem segredo, não há recibo.
 */
let ephemeral: Buffer | null = null;
export function receiptSecret(
  env: Record<string, string | undefined> = process.env,
): Buffer | null {
  const configured = env.SIDERA_CONSENT_SECRET;
  if (configured && configured.length >= 32) return Buffer.from(configured);
  if (env.NODE_ENV === "production") return null;
  ephemeral ??= randomBytes(32);
  return ephemeral;
}

const sign = (payload: string, secret: Buffer) =>
  createHmac("sha256", secret).update(payload).digest();

export function issueReceipt(
  input: { hand: PalmHand },
  secret: Buffer,
  now: number = Date.now(),
): { token: string; receipt: ConsentReceipt } {
  const receipt: ConsentReceipt = {
    v: CONSENT_VERSION,
    hand: input.hand,
    adult: true,
    analysis: true,
    iat: now,
    exp: now + RECEIPT_TTL_MS,
    nonce: b64url(randomBytes(16)),
  };
  const payload = b64url(Buffer.from(JSON.stringify(receipt)));
  return { token: `${payload}.${b64url(sign(payload, secret))}`, receipt };
}

export type ReceiptCheck =
  | { ok: true; receipt: ConsentReceipt }
  | {
      ok: false;
      reason: "missing" | "malformed" | "signature" | "expired" | "version";
    };

export function verifyReceipt(
  token: string | null,
  secret: Buffer,
  now: number = Date.now(),
): ReceiptCheck {
  if (!token) return { ok: false, reason: "missing" };
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined || token.length > 1024)
    return { ok: false, reason: "malformed" };
  const expected = sign(payload, secret);
  const given = Buffer.from(signature, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected))
    return { ok: false, reason: "signature" };
  let receipt: ConsentReceipt;
  try {
    receipt = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (
    receipt.adult !== true ||
    receipt.analysis !== true ||
    (receipt.hand !== "right" && receipt.hand !== "left") ||
    typeof receipt.exp !== "number" ||
    typeof receipt.nonce !== "string"
  )
    return { ok: false, reason: "malformed" };
  if (receipt.v !== CONSENT_VERSION) return { ok: false, reason: "version" };
  if (now > receipt.exp) return { ok: false, reason: "expired" };
  return { ok: true, receipt };
}
