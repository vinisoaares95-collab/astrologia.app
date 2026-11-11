/**
 * Motor de interpretação simbólica das mãos (Fase 03C).
 *
 * Etapas separadas, no mesmo espírito do motor astrológico (02E):
 * 1. observação visual (contrato, vinda da extração em 03D);
 * 2. validação (validate-observation.ts);
 * 3. interpretação simbólica (este módulo + library.ts);
 * 4. apresentação ao cliente (03E, reaproveitando interpretation/ai).
 *
 * Cada fato é uma característica observada e validada; cada item aponta
 * para os fatos de onde veio (rastreabilidade). Características não
 * visíveis não geram fato nem item, só uma limitação.
 *
 * A evidência visual fica no fato, para auditoria, e nunca vai ao texto do
 * cliente. Nenhuma imagem, identificador ou dado pessoal entra aqui.
 */
import type { Certainty } from "../../interpretation/contract";
import type { PalmHand } from "../consent";
import {
  FEATURE_GROUP,
  FEATURE_IDS,
  type FeatureId,
  type ImageIssue,
} from "./contract";
import {
  FEATURE_LABELS,
  HAND_TYPES,
  PALM_DISCLAIMER,
  PALM_LIBRARY,
  PALM_LIBRARY_VERSION,
  PARTIAL_CAVEAT,
  type HandType,
  type LibraryEntry,
} from "./library";
import type {
  ReadingStatus,
  ValidatedObservation,
} from "./validate-observation";

export const PALM_ENGINE_VERSION = `03c.1+${PALM_LIBRARY_VERSION}`;

export type PalmChapterId = "maos" | "linhas";

export type PalmFact = {
  /** Ex.: "heart.shape" ou "hand.type". */
  id: FeatureId | "hand.type";
  value: string;
  certainty: Certainty;
  /** Frase do sistema descrevendo o que foi observado. */
  observation: string;
  /** Evidência visual (características observadas); só auditoria. */
  evidence: string[];
  /** Características de origem (para o tipo de mão, as duas combinadas). */
  derivedFrom: FeatureId[];
};

export type PalmItem = {
  /** Ex.: "linhas:heart.shape:curved". */
  id: string;
  chapter: PalmChapterId;
  factIds: PalmFact["id"][];
  certainty: Certainty;
  observation: string;
  symbolic: string;
  caveat: string | null;
};

export type PalmChapter = {
  id: PalmChapterId;
  number: 6 | 7;
  title: string;
  items: PalmItem[];
  limitations: string[];
};

export type PalmReport = {
  version: string;
  disclaimer: string;
  hand: PalmHand;
  status: ReadingStatus;
  facts: PalmFact[];
  chapters: [PalmChapter, PalmChapter];
};

const CHAPTER_OF: Record<ReturnType<typeof groupOf>, PalmChapterId> = {
  hand: "maos",
  heart: "linhas",
  head: "linhas",
  life: "linhas",
  fate: "linhas",
};
const groupOf = (id: FeatureId) => FEATURE_GROUP[id];

/** Títulos fixos (iguais ao sumário em content/report-chapters.ts). */
export const PALM_CHAPTER_TITLES: Record<PalmChapterId, string> = {
  maos: "As características das suas mãos",
  linhas: "As linhas da sua palma",
};

const ISSUE_TEXT: Partial<Record<ImageIssue, string>> = {
  too_dark: "pouca luz",
  overexposed: "luz forte demais",
  glare: "reflexos",
  blurry: "falta de nitidez",
  hand_cropped: "parte da mão fora do enquadramento",
  angled: "a mão inclinada em relação à câmera",
  obstruction: "algo cobrindo parte da palma",
};

function limitationFor(id: FeatureId): string {
  if (id === "fate.presence")
    return "A linha do destino não foi identificada com clareza na foto e não foi interpretada; isso não quer dizer que ela não exista.";
  const label = FEATURE_LABELS[id];
  const o = label.startsWith("A ") ? "a" : "o";
  return `${label} não pôde ser observad${o} na foto e não foi interpretad${o}.`;
}

export function buildPalmInterpretation(o: ValidatedObservation): PalmReport {
  const facts: PalmFact[] = [];
  const items: PalmItem[] = [];
  const limitations: Record<PalmChapterId, string[]> = { maos: [], linhas: [] };

  for (const id of FEATURE_IDS) {
    const f = o.features[id];
    const chapter = CHAPTER_OF[groupOf(id)];
    if (f.visibility === "not_visible") {
      limitations[chapter].push(limitationFor(id));
      continue;
    }
    const entry = (PALM_LIBRARY[id] as Record<string, LibraryEntry>)[f.value];
    const certainty: Certainty =
      f.visibility === "clear" ? "determined" : "uncertain";
    facts.push({
      id,
      value: f.value,
      certainty,
      observation: entry.observation,
      evidence: [f.evidence],
      derivedFrom: [id],
    });
    items.push({
      id: `${chapter}:${id}:${f.value}`,
      chapter,
      factIds: [id],
      certainty,
      observation: entry.observation,
      symbolic: entry.symbolic,
      caveat: certainty === "uncertain" ? PARTIAL_CAVEAT : null,
    });
  }

  // Tipo elementar: só com palma E dedos observados numa combinação prevista.
  const palm = o.features["hand.palmShape"];
  const fingers = o.features["hand.fingerLength"];
  if (
    palm.visibility !== "not_visible" &&
    fingers.visibility !== "not_visible"
  ) {
    const match = (Object.keys(HAND_TYPES) as HandType[]).find(
      (t) =>
        HAND_TYPES[t].palm === palm.value &&
        HAND_TYPES[t].fingers === fingers.value,
    );
    if (match) {
      const t = HAND_TYPES[match];
      const certainty: Certainty =
        palm.visibility === "clear" && fingers.visibility === "clear"
          ? "determined"
          : "uncertain";
      facts.push({
        id: "hand.type",
        value: match,
        certainty,
        observation: `Combinação de palma e dedos que a quiromancia moderna chama de ${t.label}.`,
        evidence: [palm.evidence, fingers.evidence],
        derivedFrom: ["hand.palmShape", "hand.fingerLength"],
      });
      items.push({
        id: `maos:hand.type:${match}`,
        chapter: "maos",
        factIds: ["hand.type", "hand.palmShape", "hand.fingerLength"],
        certainty,
        observation: `Combinação de palma e dedos que a quiromancia moderna chama de ${t.label}.`,
        symbolic: t.symbolic,
        caveat: certainty === "uncertain" ? PARTIAL_CAVEAT : null,
      });
    }
  }

  // Qualidade da imagem: limitação comum aos dois capítulos.
  const issues = o.issues.map((i) => ISSUE_TEXT[i]).filter(Boolean);
  if (o.status === "insufficient") {
    const note =
      "A foto não permitiu observar a palma com segurança. Para esta parte da leitura, é preciso uma nova foto.";
    limitations.maos = [note];
    limitations.linhas = [note];
  } else if (issues.length) {
    const note = `A foto tinha ${issues.join(", ")}; algumas características podem não ter sido observadas.`;
    limitations.maos.unshift(note);
    limitations.linhas.unshift(note);
  }

  const chapter = (id: PalmChapterId, number: 6 | 7): PalmChapter => ({
    id,
    number,
    title: PALM_CHAPTER_TITLES[id],
    items: items.filter((i) => i.chapter === id),
    limitations: limitations[id],
  });

  return {
    version: PALM_ENGINE_VERSION,
    disclaimer: PALM_DISCLAIMER,
    hand: o.hand,
    status: o.status,
    facts,
    chapters: [chapter("maos", 6), chapter("linhas", 7)],
  };
}
