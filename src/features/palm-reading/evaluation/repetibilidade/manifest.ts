/**
 * Manifesto das fotografias AUTORIZADAS do experimento de repetibilidade.
 *
 * Fica na mesma pasta das fotos, FORA do repositório, e só traz códigos:
 * nenhum nome, e-mail ou documento. Campos não previstos são recusados (para
 * nenhum dado pessoal entrar por engano). Qualquer problema recusa a etapa
 * inteira: nada é chamado com um manifesto inválido.
 *
 * Exemplo:
 * {
 *   "experimento": "repetibilidade-visual",
 *   "termo": "REP-1",
 *   "fotos": [{
 *     "codigo": "p05", "arquivo": "p05.jpg", "mao": "direita",
 *     "origem": "original", "pessoa": "P3", "autorizacao": "AUT-REP-03",
 *     "sha256Registrado": "35bd62a174f7ef3c",
 *     "consentimento": { "assinado": true, "data": "2026-12-01",
 *                        "enviosAutorizados": 12, "abrange": "original" }
 *   }]
 * }
 */
import type { PalmHand } from "../../consent";
import { REP_MAX_SENDS_PER_PHOTO, type RepStage, REP_STAGES } from "./config";
import type { PhotoOrigin } from "./contract";

/** Versão do termo que o manifesto precisa citar (minuta REP-1). */
export const REP_TERM_VERSION = "REP-1";
export const REP_EXPERIMENT = "repetibilidade-visual";
/** Fotos por etapa (piloto: as 2 escolhidas no plano). */
export const REP_STAGE_MAX_PHOTOS: Record<RepStage, number> = {
  piloto: 2,
  A: 8,
  B: 8,
};

export type ManifestPhoto = {
  code: string;
  file: string;
  hand: PalmHand;
  origin: PhotoOrigin;
  participant: string;
  authorization: string;
  /** 16 primeiros caracteres do SHA-256 registrado na exclusão (originais). */
  registeredSha256: string | null;
  sendsAllowed: number;
  consentDate: string;
};

export type ManifestResult =
  { ok: true; photos: ManifestPhoto[] } | { ok: false; problems: string[] };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const PHOTO_KEYS = [
  "codigo",
  "arquivo",
  "mao",
  "origem",
  "pessoa",
  "autorizacao",
  "sha256Registrado",
  "consentimento",
];
const CONSENT_KEYS = ["assinado", "data", "enviosAutorizados", "abrange"];

export function parseManifest(
  raw: unknown,
  stage: RepStage,
  today: string,
): ManifestResult {
  const problems: string[] = [];
  if (!isRecord(raw)) return { ok: false, problems: ["Manifesto ilegível."] };
  for (const k of Object.keys(raw))
    if (!["experimento", "termo", "fotos"].includes(k))
      problems.push(`Campo não previsto no manifesto: "${k}".`);
  if (raw.experimento !== REP_EXPERIMENT)
    problems.push(`O manifesto não é deste experimento ("${REP_EXPERIMENT}").`);
  if (raw.termo !== REP_TERM_VERSION)
    problems.push(
      `Termo "${String(raw.termo)}" diferente da versão vigente (${REP_TERM_VERSION}).`,
    );
  if (!Array.isArray(raw.fotos) || raw.fotos.length === 0)
    return { ok: false, problems: [...problems, "Nenhuma foto no manifesto."] };
  if (raw.fotos.length > REP_STAGE_MAX_PHOTOS[stage])
    problems.push(
      `A etapa ${stage} aceita no máximo ${REP_STAGE_MAX_PHOTOS[stage]} fotos.`,
    );

  const photos: ManifestPhoto[] = [];
  const seen = new Set<string>();
  raw.fotos.forEach((f: unknown, i) => {
    const where = `foto ${i + 1}`;
    const bad = (m: string) => problems.push(`${where}: ${m}`);
    if (!isRecord(f)) return bad("formato inválido.");
    for (const k of Object.keys(f))
      if (!PHOTO_KEYS.includes(k)) bad(`campo não previsto "${k}".`);
    const code = String(f.codigo ?? "");
    const file = String(f.arquivo ?? "");
    const origin = f.origem;
    if (!/^[pn]\d{2}$/.test(code))
      bad("código deve ser pNN (original) ou nNN (nova).");
    if (!/^[a-z0-9-]+\.(jpe?g|png|webp|heic)$/i.test(file))
      bad("nome de arquivo inválido (sem pastas, extensão de imagem).");
    if (seen.has(code) || seen.has(`arquivo:${file}`))
      bad("código ou arquivo repetido.");
    seen.add(code);
    seen.add(`arquivo:${file}`);
    if (f.mao !== "direita" && f.mao !== "esquerda")
      bad('mão deve ser "direita" ou "esquerda".');
    if (origin !== "original" && origin !== "nova")
      bad('origem deve ser "original" ou "nova".');
    if (origin !== REP_STAGES[stage].origin)
      bad(
        `a etapa ${stage} só aceita fotos de origem "${REP_STAGES[stage].origin}".`,
      );
    if (origin === "original" && !code.startsWith("p"))
      bad("foto original precisa de código pNN.");
    if (origin === "nova" && !code.startsWith("n"))
      bad("foto nova precisa de código nNN.");
    const sha = f.sha256Registrado;
    if (
      origin === "original" &&
      !(typeof sha === "string" && /^[0-9a-f]{16}$/.test(sha))
    )
      bad("foto original precisa do SHA-256 registrado (16 caracteres).");
    if (origin === "nova" && sha !== undefined)
      bad("foto nova não tem SHA-256 registrado.");
    if (!/^P\d{1,2}$/.test(String(f.pessoa ?? "")))
      bad("pessoa deve ser um pseudônimo PNN (nunca o nome).");
    if (!/^AUT-REP-\d{2}$/.test(String(f.autorizacao ?? "")))
      bad("autorização deve ser AUT-REP-NN.");
    const c = f.consentimento;
    if (!isRecord(c)) return bad("consentimento ausente.");
    for (const k of Object.keys(c))
      if (!CONSENT_KEYS.includes(k))
        bad(`campo não previsto no consentimento "${k}".`);
    if (c.assinado !== true) bad("termo não assinado: foto recusada.");
    const date = String(c.data ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today)
      bad("data do consentimento ausente ou no futuro.");
    const sends = c.enviosAutorizados;
    if (
      !Number.isInteger(sends) ||
      (sends as number) < 1 ||
      (sends as number) > REP_MAX_SENDS_PER_PHOTO
    )
      bad(`envios autorizados devem ser de 1 a ${REP_MAX_SENDS_PER_PHOTO}.`);
    if (c.abrange !== origin)
      bad("o consentimento não abrange a origem desta foto.");
    photos.push({
      code,
      file,
      hand: f.mao === "esquerda" ? "left" : "right",
      origin: origin as PhotoOrigin,
      participant: String(f.pessoa),
      authorization: String(f.autorizacao),
      registeredSha256: typeof sha === "string" ? sha : null,
      sendsAllowed: Number(sends),
      consentDate: date,
    });
  });
  return problems.length ? { ok: false, problems } : { ok: true, photos };
}
