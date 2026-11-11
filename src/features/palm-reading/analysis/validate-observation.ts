/**
 * Validação das observações visuais da palma (Fase 03C).
 *
 * A entrada é `unknown` de propósito: virá de um modelo de visão (03D) e não
 * é confiável. O validador confere FORMATO, CONSISTÊNCIA e RASTREABILIDADE.
 * Não confere se a observação corresponde à fotografia; essa precisão será
 * medida na avaliação com fotos de voluntários (03F).
 *
 * Três desfechos por problema:
 * - erro (a observação inteira é recusada): estrutura malformada, valor
 *   fora do contrato, campo desconhecido, mão divergente ou conteúdo
 *   sensível (identidade, saúde, atributos pessoais);
 * - rebaixamento (a característica vira "not_visible"): evidência ausente,
 *   genérica, interpretativa ou repetida, linha do destino sem nitidez,
 *   inconsistência entre características;
 * - aviso: registrado para auditoria, sem mudar o resultado.
 *
 * Nenhum rebaixamento preenche valor por suposição: o que não está
 * sustentado simplesmente deixa de ser usado.
 */
import type { PalmHand } from "../consent";
import {
  BLOCKING_ISSUES,
  EVIDENCE_MAX_CHARS,
  EVIDENCE_MIN_CHARS,
  FEATURE_GROUP,
  FEATURE_IDS,
  FEATURE_VALUES,
  IMAGE_ISSUES,
  IMAGE_QUALITIES,
  NOT_VISIBLE_REASONS,
  OBSERVATION_VERSION,
  type FeatureId,
  type FeatureObservation,
  type ImageIssue,
  type ImageQuality,
  type NotVisibleReason,
} from "./contract";

export type ObservationErrorCode =
  | "INVALID_SHAPE"
  | "UNKNOWN_FIELD"
  | "INVALID_VALUE"
  | "VERSION_MISMATCH"
  | "HAND_MISMATCH"
  | "SENSITIVE_CONTENT";

export type ObservationDowngradeCode =
  | "WEAK_EVIDENCE"
  | "INTERPRETIVE_EVIDENCE"
  | "REPEATED_EVIDENCE"
  | "FATE_NOT_CLEAR"
  | "INCONSISTENT"
  | "IMAGE_INSUFFICIENT";

export type ObservationNote = {
  code:
    ObservationErrorCode | ObservationDowngradeCode | "QUALITY_CONTRADICTION";
  feature?: FeatureId;
  message: string;
};

export type ReadingStatus = "complete" | "partial" | "insufficient";

/** Observação já validada: só características sustentadas por evidência. */
export type ValidatedObservation = {
  hand: PalmHand;
  quality: ImageQuality;
  issues: ImageIssue[];
  status: ReadingStatus;
  features: { [F in FeatureId]: FeatureObservation<F> };
};

export type ObservationValidation =
  | { ok: true; observation: ValidatedObservation; notes: ObservationNote[] }
  | { ok: false; errors: ObservationNote[] };

// ── Evidência ──────────────────────────────────────────────────────────────

/**
 * Referências de lugar na mão: a evidência precisa dizer ONDE a
 * característica aparece ("termina sob o espaço entre o indicador e o
 * médio"). "Palma" e "mão" sozinhas não bastam.
 */
const LOCATION_RE =
  /(?<!\p{L})(dedos?|indicador|médio|anelar|mínimo|polegar|pulso|punho|borda|beira|lateral|centro|meio|base|topo|monte|extremidade|início|começa|termina|nasce|atravessa|cruza|chega|até|abaixo|acima|perto|próxim\p{L}*|lado|altura|sob|entre|junto|separad\p{L}*|unid\p{L}*|curva|desce|sobe)(?!\p{L})/iu;

/** Leitura simbólica não é evidência visual. */
const INTERPRETIVE_RE =
  /(?<!\p{L})(signific\p{L}*|indica que|sugere que|revela|personalidade|temperamento|caráter|sorte|azar|futuro|tendência|emoç\p{L}*|emocion\p{L}*|inteligên\p{L}*|talento|amor|longev\p{L}*|vida (?:longa|curta))(?!\p{L})/iu;

/**
 * Identidade, saúde e atributos sensíveis: nunca podem aparecer numa
 * observação da palma (recusa a observação inteira).
 */
export const PALM_SENSITIVE_PATTERNS: readonly RegExp[] = [
  /(?<!\p{L})(saúde|doen\p{L}*|artrit\p{L}*|artros\p{L}*|lesã\p{L}*|lesõ\p{L}*|ferid\p{L}*|cicatriz\p{L}*|inflama\p{L}*|diagn\p{L}*|sintom\p{L}*|patolog\p{L}*|síndrome|tremor|deformi\p{L}*|calos?)(?!\p{L})/iu,
  /(?<!\p{L})(idade|anos|jovem|idos[oa]s?|criança|adolescente|homem|mulher|masculin\p{L}*|feminin\p{L}*|gênero|sexo)(?!\p{L})/iu,
  /(?<!\p{L})(etni\p{L}*|raça|racial|tom de pele|cor da pele|pele (?:negra|branca|escura|clara|morena|parda))(?!\p{L})/iu,
  /(?<!\p{L})(tatuage\p{L}*|aliança|nome|identidade|impress(?:ão|ões) digita\p{L}*|digitais|biometr\p{L}*|cpf|documento)(?!\p{L})/iu,
];

const normalizeEvidence = (s: string) => s.replace(/\s+/g, " ").trim();

function evidenceProblem(evidence: string): ObservationDowngradeCode | null {
  if (
    evidence.length < EVIDENCE_MIN_CHARS ||
    evidence.length > EVIDENCE_MAX_CHARS ||
    !LOCATION_RE.test(evidence)
  )
    return "WEAK_EVIDENCE";
  if (INTERPRETIVE_RE.test(evidence)) return "INTERPRETIVE_EVIDENCE";
  return null;
}

const DOWNGRADE_MESSAGES: Record<ObservationDowngradeCode, string> = {
  WEAK_EVIDENCE:
    "Evidência ausente, genérica ou sem indicar onde a característica aparece na foto.",
  INTERPRETIVE_EVIDENCE:
    "A evidência traz interpretação em vez de descrição visual.",
  REPEATED_EVIDENCE:
    "A mesma evidência foi usada para outra característica; cada uma precisa da própria.",
  FATE_NOT_CLEAR:
    "A linha do destino só é usada quando claramente identificável.",
  INCONSISTENT: "Incompatível com outra característica da mesma observação.",
  IMAGE_INSUFFICIENT:
    "A qualidade da imagem não permite usar nenhuma característica.",
};

// ── Validação ──────────────────────────────────────────────────────────────

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const has = <T extends string>(list: readonly T[], v: unknown): v is T =>
  typeof v === "string" && (list as readonly string[]).includes(v);

const TOP_KEYS = ["version", "hand", "image", "features"];
const IMAGE_KEYS = ["quality", "issues"];
const OBSERVED_KEYS = ["visibility", "value", "evidence"];
const NOT_VISIBLE_KEYS = ["visibility", "reason"];

const notVisible = (reason: NotVisibleReason): FeatureObservation => ({
  visibility: "not_visible",
  reason,
});

export function validatePalmObservation(
  raw: unknown,
  expectedHand: PalmHand,
): ObservationValidation {
  const errors: ObservationNote[] = [];
  const error = (
    code: ObservationErrorCode,
    message: string,
    feature?: FeatureId,
  ) => errors.push({ code, message, ...(feature && { feature }) });
  const unknownKeys = (
    obj: Record<string, unknown>,
    allowed: string[],
    where: string,
  ) => {
    for (const k of Object.keys(obj))
      if (!allowed.includes(k))
        error("UNKNOWN_FIELD", `Campo não previsto em ${where}: "${k}".`);
  };

  if (!isRecord(raw)) {
    error("INVALID_SHAPE", "A observação não é um objeto.");
    return { ok: false, errors };
  }
  unknownKeys(raw, TOP_KEYS, "observação");
  if (raw.version !== OBSERVATION_VERSION)
    error(
      "VERSION_MISMATCH",
      `Versão esperada ${OBSERVATION_VERSION}, recebida ${String(raw.version)}.`,
    );
  if (!has(["right", "left"] as const, raw.hand))
    error("INVALID_VALUE", 'Mão deve ser "right" ou "left".');
  else if (raw.hand !== expectedHand)
    error(
      "HAND_MISMATCH",
      "A mão da observação não é a mão escolhida pela pessoa.",
    );

  const image = raw.image;
  let quality: ImageQuality = "insufficient";
  let issues: ImageIssue[] = [];
  if (!isRecord(image)) error("INVALID_SHAPE", 'Bloco "image" ausente.');
  else {
    unknownKeys(image, IMAGE_KEYS, "image");
    if (!has(IMAGE_QUALITIES, image.quality))
      error("INVALID_VALUE", "Qualidade da imagem fora do contrato.");
    else quality = image.quality;
    if (!Array.isArray(image.issues))
      error("INVALID_SHAPE", '"image.issues" deve ser uma lista.');
    else
      for (const i of image.issues)
        if (!has(IMAGE_ISSUES, i))
          error(
            "INVALID_VALUE",
            `Problema de imagem desconhecido: ${String(i)}.`,
          );
        else if (!issues.includes(i)) issues = [...issues, i];
  }

  const features = raw.features;
  const parsed = {} as Record<FeatureId, FeatureObservation>;
  if (!isRecord(features)) error("INVALID_SHAPE", 'Bloco "features" ausente.');
  else {
    unknownKeys(features, FEATURE_IDS, "features");
    for (const id of FEATURE_IDS) {
      const f = features[id];
      if (!isRecord(f)) {
        error("INVALID_SHAPE", `Característica ausente: ${id}.`, id);
        continue;
      }
      if (f.visibility === "not_visible") {
        unknownKeys(f, NOT_VISIBLE_KEYS, id);
        if (!has(NOT_VISIBLE_REASONS, f.reason))
          error(
            "INVALID_VALUE",
            `Motivo de não visível inválido em ${id}.`,
            id,
          );
        else parsed[id] = notVisible(f.reason);
        continue;
      }
      if (!has(["clear", "partial"] as const, f.visibility)) {
        error("INVALID_VALUE", `Visibilidade inválida em ${id}.`, id);
        continue;
      }
      unknownKeys(f, OBSERVED_KEYS, id);
      if (!has(FEATURE_VALUES[id] as readonly string[], f.value)) {
        error("INVALID_VALUE", `Valor fora do contrato em ${id}.`, id);
        continue;
      }
      if (typeof f.evidence !== "string") {
        error("INVALID_SHAPE", `Evidência ausente em ${id}.`, id);
        continue;
      }
      const evidence = normalizeEvidence(f.evidence);
      if (PALM_SENSITIVE_PATTERNS.some((re) => re.test(evidence))) {
        error(
          "SENSITIVE_CONTENT",
          `A evidência de ${id} menciona identidade, saúde ou atributo pessoal.`,
          id,
        );
        continue;
      }
      parsed[id] = {
        visibility: f.visibility,
        value: f.value,
        evidence,
      } as FeatureObservation;
    }
  }

  if (errors.length) return { ok: false, errors };

  // ── Rebaixamentos (a partir daqui, a estrutura é válida) ──────────────
  const notes: ObservationNote[] = [];
  const downgrade = (
    id: FeatureId,
    code: ObservationDowngradeCode,
    reason: NotVisibleReason,
  ) => {
    if (parsed[id].visibility === "not_visible") return;
    parsed[id] = notVisible(reason);
    notes.push({ code, feature: id, message: DOWNGRADE_MESSAGES[code] });
  };

  const observed = () =>
    FEATURE_IDS.filter((id) => parsed[id].visibility !== "not_visible");

  // Imagem que não permite leitura: nada é usado, mesmo que o modelo tenha
  // "visto" algo (contradição registrada).
  const blocking = issues.filter((i) => BLOCKING_ISSUES.includes(i));
  if (quality === "adequate" && blocking.length)
    notes.push({
      code: "QUALITY_CONTRADICTION",
      message: `Qualidade "adequada" com problema que impede a leitura (${blocking.join(", ")}).`,
    });
  if (quality === "insufficient" || blocking.length) {
    if (observed().length)
      notes.push({
        code: "QUALITY_CONTRADICTION",
        message:
          "Características marcadas como visíveis numa imagem insuficiente.",
      });
    for (const id of observed())
      downgrade(id, "IMAGE_INSUFFICIENT", "image_quality");
  }

  // Evidência de cada característica.
  for (const id of observed()) {
    const f = parsed[id];
    if (f.visibility === "not_visible") continue;
    const problem = evidenceProblem(f.evidence);
    if (problem) downgrade(id, problem, "ambiguous");
  }

  // A mesma evidência para características diferentes não é específica.
  const seen = new Map<string, FeatureId>();
  for (const id of observed()) {
    const f = parsed[id];
    if (f.visibility === "not_visible") continue;
    const key = f.evidence.toLowerCase();
    if (seen.has(key)) downgrade(id, "REPEATED_EVIDENCE", "ambiguous");
    else seen.set(key, id);
  }

  // Linha do destino: só nítida.
  if (parsed["fate.presence"].visibility === "partial")
    downgrade("fate.presence", "FATE_NOT_CLEAR", "too_faint");

  // A linha da cabeça "unida à da vida" exige a linha da vida visível.
  const start = parsed["head.start"];
  if (
    start.visibility !== "not_visible" &&
    start.value === "joined_life" &&
    parsed["life.arc"].visibility === "not_visible"
  )
    downgrade("head.start", "INCONSISTENT", "ambiguous");

  const used = observed();
  const status: ReadingStatus =
    used.length === 0
      ? "insufficient"
      : used.length === FEATURE_IDS.length ||
          // Destino ausente não torna a leitura parcial: é opcional.
          (used.length === FEATURE_IDS.length - 1 &&
            !used.includes("fate.presence"))
        ? "complete"
        : "partial";

  return {
    ok: true,
    observation: {
      hand: expectedHand,
      quality,
      issues,
      status,
      features: parsed as ValidatedObservation["features"],
    },
    notes,
  };
}

/** Grupos (linhas e mão) com pelo menos uma característica usável. */
export function visibleGroups(o: ValidatedObservation) {
  return [
    ...new Set(
      FEATURE_IDS.filter(
        (id) => o.features[id].visibility !== "not_visible",
      ).map((id) => FEATURE_GROUP[id]),
    ),
  ];
}
