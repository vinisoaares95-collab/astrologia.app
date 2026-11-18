/**
 * Casos da Etapa A (03F.2).
 *
 * - 8 casos REAIS: as observações validadas do Sonnet 5.5 na rodada 2 da
 *   03F.1, copiadas para um arquivo de entrada próprio (`entrada/
 *   observacoes.json`). Os resultados originais são só lidos. Cada
 *   observação é revalidada pelo validador atual (contrato 03c.2) e precisa
 *   sair idêntica: se não sair, o caso é recusado.
 * - 2 casos SINTÉTICOS (marcados como tais), com poucas características:
 *   só a mão; só uma linha parcial.
 *
 * Nada aqui contém imagem, nome de arquivo ou dado pessoal: as observações
 * são categorias e evidências descritivas já auditadas.
 */
import {
  FEATURE_IDS,
  OBSERVATION_VERSION,
  type FeatureId,
  type FeatureObservation,
  type NotVisibleReason,
} from "../../analysis/contract";
import {
  validatePalmObservation,
  type ValidatedObservation,
} from "../../analysis/validate-observation";
import type { PalmHand } from "../../consent";

export const SNAPSHOT_VERSION = "03f2a.1";

export type EvalCase = {
  /** foto-01…foto-08 (reais) ou sint-01/sint-02. */
  id: string;
  kind: "real" | "synthetic";
  /** Agrupamento por pessoa (M01…M04) quando conhecido; sintético: null. */
  person: string | null;
  description: string;
  observation: ValidatedObservation;
  /** Revalidação direcionada: só estes capítulos (padrão: os dois). */
  chapters?: ("maos" | "linhas")[];
};

export const selectedChapter = (c: EvalCase, id: "maos" | "linhas") =>
  !c.chapters || c.chapters.includes(id);

export type Snapshot = {
  version: typeof SNAPSHOT_VERSION;
  source: string;
  model: string;
  observationVersion: string;
  cases: EvalCase[];
};

type RoundUnit = {
  photoId: string;
  model: string;
  status: string;
  final: {
    status: string;
    quality: string;
    issues: string[];
    features: Record<
      string,
      {
        visibility: "clear" | "partial" | "not_visible";
        value: string | null;
        evidence: string | null;
        reason: string | null;
      }
    >;
  } | null;
};

/** Reconstrói a observação crua e revalida; devolve null se divergir. */
function revalidate(
  unit: RoundUnit,
  hand: PalmHand,
): ValidatedObservation | null {
  if (unit.status !== "ok" || !unit.final) return null;
  const features: Record<string, unknown> = {};
  for (const id of FEATURE_IDS) {
    const f = unit.final.features[id];
    if (!f) return null;
    features[id] =
      f.visibility === "not_visible"
        ? { visibility: "not_visible", reason: f.reason }
        : { visibility: f.visibility, value: f.value, evidence: f.evidence };
  }
  const r = validatePalmObservation(
    {
      version: OBSERVATION_VERSION,
      hand,
      image: { quality: unit.final.quality, issues: unit.final.issues },
      features,
    },
    hand,
  );
  if (!r.ok) return null;
  // O validador atual não pode mudar nada do que foi auditado.
  for (const id of FEATURE_IDS) {
    const a = r.observation.features[id];
    const b = unit.final.features[id];
    if (a.visibility !== b.visibility) return null;
    if (a.visibility === "not_visible" && a.reason !== b.reason) return null;
    if (a.visibility !== "not_visible" && a.value !== b.value) return null;
  }
  return r.observation;
}

/**
 * Monta a entrada a partir dos resultados da rodada 2. `hands`: mão de cada
 * foto (do manifesto); `people`: agrupamento por pessoa.
 */
export function buildSnapshot(input: {
  units: RoundUnit[];
  model: string;
  hands: Record<string, PalmHand>;
  people: Record<string, string>;
  source: string;
}): { snapshot: Snapshot; rejected: string[] } {
  const rejected: string[] = [];
  const cases: EvalCase[] = [];
  const units = input.units
    .filter((u) => u.model === input.model)
    .sort((a, b) => a.photoId.localeCompare(b.photoId));
  for (const u of units) {
    const hand = input.hands[u.photoId];
    const observation = hand ? revalidate(u, hand) : null;
    if (!observation) {
      rejected.push(u.photoId);
      continue;
    }
    cases.push({
      id: u.photoId,
      kind: "real",
      person: input.people[u.photoId] ?? null,
      description: `Observação real (Sonnet 5.5, rodada 2), mão ${hand === "right" ? "direita" : "esquerda"}.`,
      observation,
    });
  }
  return {
    snapshot: {
      version: SNAPSHOT_VERSION,
      source: input.source,
      model: input.model,
      observationVersion: OBSERVATION_VERSION,
      cases: [...cases, ...syntheticCases()],
    },
    rejected,
  };
}

const nv = (reason: NotVisibleReason) =>
  ({ visibility: "not_visible", reason }) as FeatureObservation;

function allNotVisible(): Record<FeatureId, FeatureObservation> {
  return Object.fromEntries(
    FEATURE_IDS.map((id) => [id, nv("too_faint")]),
  ) as Record<FeatureId, FeatureObservation>;
}

/** Cenários FICTÍCIOS de pouca informação (não vêm de fotos). */
export function syntheticCases(): EvalCase[] {
  const onlyHand = allNotVisible();
  onlyHand["hand.palmShape"] = {
    visibility: "partial",
    value: "square",
    evidence:
      "Largura na base dos dedos parecida com a distância do pulso à base do dedo médio.",
  } as FeatureObservation;
  onlyHand["hand.fingerLength"] = nv("unclassifiable");
  onlyHand["head.length"] = nv("unclassifiable");
  onlyHand["life.arc"] = nv("unclassifiable");

  const oneLine = allNotVisible();
  oneLine["hand.palmShape"] = nv("out_of_frame");
  oneLine["hand.fingerLength"] = nv("out_of_frame");
  oneLine["life.arc"] = {
    visibility: "partial",
    value: "wide",
    evidence:
      "Linha curva contorna a base do polegar e avança para o centro da palma, fraca perto do pulso.",
  } as FeatureObservation;

  const make = (
    id: string,
    description: string,
    features: Record<FeatureId, FeatureObservation>,
  ): EvalCase => ({
    id,
    kind: "synthetic",
    person: null,
    description,
    observation: {
      hand: "right",
      quality: "limited",
      issues: ["blurry"],
      status: "partial",
      features: features as ValidatedObservation["features"],
    },
  });
  return [
    make(
      "sint-01",
      "SINTÉTICO: só o formato da palma (parcial); dedos e linhas indeterminados ou não visíveis.",
      onlyHand,
    ),
    make(
      "sint-02",
      "SINTÉTICO: só a linha da vida (parcial); mão fora do quadro.",
      oneLine,
    ),
  ];
}

/** Confere uma entrada lida do disco (formato e revalidação dos sintéticos). */
export function checkSnapshot(raw: unknown): Snapshot | null {
  const s = raw as Snapshot;
  if (!s || s.version !== SNAPSHOT_VERSION || !Array.isArray(s.cases))
    return null;
  if (s.observationVersion !== OBSERVATION_VERSION) return null;
  for (const c of s.cases) {
    const r = validatePalmObservation(
      {
        version: OBSERVATION_VERSION,
        hand: c.observation.hand,
        image: { quality: c.observation.quality, issues: c.observation.issues },
        features: c.observation.features,
      },
      c.observation.hand,
    );
    if (!r.ok) return null;
  }
  return s;
}
