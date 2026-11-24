/**
 * Seleção determinística dos temas dos capítulos 8 e 9 (Fase 04D).
 * Funções puras: nenhuma rede, nenhum armazenamento, nenhuma IA.
 *
 * Capítulo 8 — conexões entre as tradições, só pelo mesmo assunto (F1):
 * linha do coração ↔ Lua e Vênus; início da linha da cabeça ↔ Marte. O
 * contraponto só existe dentro do mesmo assunto (F2).
 *
 * Capítulo 9 — temas por assunto das interpretações apresentadas (d71f524):
 * temas do capítulo 8 primeiro; depois assuntos independentes, cada um de
 * UMA tradição; pergunta de eixo para afeto e agir (só com polo nos eixos
 * que o assunto trata), pergunta própria para identidade e pensamento.
 */
import type { ToneTag } from "@/features/interpretation/library/base";

import type { BridgeRef, HandsBridge, SkyBridge } from "./bridge";
import {
  AXES,
  BRIDGE_SUBJECTS,
  C8_MAX_THEMES,
  C9,
  C9_MAX_THEMES,
  C9_MIN_THEMES,
  OPPOSITE,
  SUBJECT,
  SUBJECT_AXES,
  SUBJECT_TITLE,
  type Axis,
  type Ch8Unavailable,
  type Relation,
  type Subject,
} from "./library";

const onAxis = (axis: Axis) => (r: BridgeRef) =>
  r.poles.some((p) => p.startsWith(`${axis}:`));
const poleOn = (axis: Axis) => (r: BridgeRef) =>
  r.poles.find((p) => p.startsWith(`${axis}:`));
/** Ordena por capítulo, mantendo a ordem do motor dentro do capítulo. */
const byChapter = (refs: BridgeRef[]) =>
  [...refs].sort((a, b) => a.chapter - b.chapter);
const chaptersOf = (refs: BridgeRef[]) =>
  [...new Set(refs.map((r) => r.chapter))].sort((a, b) => a - b);

// ── Capítulo 8 ───────────────────────────────────────────────────────────

export type Theme8 = {
  axis: Axis;
  relation: Relation;
  /** Polo das mãos (null em "duas imagens nas mãos"). */
  palmPole: ToneTag | null;
  hands: BridgeRef[];
  sky: BridgeRef[];
  skyOpposite: BridgeRef[];
  /** Chave da frase-ponte na biblioteca. */
  libraryKey: string;
};

export type Selection8 =
  | { status: "content"; themes: Theme8[] }
  | { status: "unavailable"; reason: Ch8Unavailable };

export function selectChapter8(
  sky: SkyBridge | null,
  hands: HandsBridge | null,
): Selection8 {
  if (!sky && !hands) return { status: "unavailable", reason: "U3" };
  if (!hands) return { status: "unavailable", reason: "U1" };
  if (!sky) return { status: "unavailable", reason: "U2" };
  if (hands.retakeRecommended) return { status: "unavailable", reason: "U5" };
  if (!hands.items.length)
    return {
      status: "unavailable",
      reason: hands.noPole.length ? "U4misto" : "U4",
    };
  const themes: Theme8[] = [];
  for (const axis of AXES) {
    const h = hands.items.filter(onAxis(axis));
    if (!h.length) continue;
    const subjects = new Set(h.map((r) => SUBJECT[r.key]));
    const base = sky.items.filter(
      (r) =>
        onAxis(axis)(r) &&
        BRIDGE_SUBJECTS.includes(SUBJECT[r.key]) &&
        subjects.has(SUBJECT[r.key]),
    );
    if (!base.length) continue;
    const handPoles = [...new Set(h.map((r) => r.poles[0]))];
    if (handPoles.length === 2) {
      themes.push({
        axis,
        relation: "F",
        palmPole: null,
        hands: byChapter(h),
        sky: byChapter(base),
        skyOpposite: [],
        libraryKey: `${axis}:F`,
      });
      continue;
    }
    const P = handPoles[0];
    const same = base.filter((r) => r.poles.includes(P));
    const opp = base.filter((r) => r.poles.includes(OPPOSITE[P]));
    const relation: Relation = same.length ? (opp.length ? "AC" : "A") : "D";
    themes.push({
      axis,
      relation,
      palmPole: P,
      hands: byChapter(h),
      sky: byChapter(relation === "D" ? opp : same),
      skyOpposite: relation === "AC" ? byChapter(opp) : [],
      libraryKey: `${P}:${relation}`,
    });
  }
  if (!themes.length) return { status: "unavailable", reason: "U6" };
  return { status: "content", themes: themes.slice(0, C8_MAX_THEMES) };
}

// ── Capítulo 9 ───────────────────────────────────────────────────────────

export type Theme9 = {
  subject: Subject;
  axis: Axis | null;
  /** Polo, "two" (dois lados) ou o próprio assunto. */
  variant: string;
  basis: "c8" | "tensao" | "um-polo" | "assunto";
  tradition: "ambas" | "céu" | "mãos";
  sources: BridgeRef[];
  chapters: number[];
  questionKey: string;
};

export type Selection9 = {
  status: "content" | "unavailable";
  reason: "V1" | "V2" | null;
  themes: Theme9[];
  /** Por que assuntos ficaram de fora (auditoria e testes). */
  excluded: string[];
};

const RANK: Record<Theme9["basis"], number> = {
  c8: -1,
  tensao: 0,
  "um-polo": 1,
  assunto: 2,
};

export function selectChapter9(
  sky: SkyBridge | null,
  hands: HandsBridge | null,
  c8: Selection8,
): Selection9 {
  const themes: Theme9[] = [];
  const excluded: string[] = [];
  const used = new Set<Subject>();

  // 1. Temas do capítulo 8 (os únicos que juntam céu e mãos).
  if (c8.status === "content")
    for (const t of c8.themes) {
      const subject = SUBJECT[t.hands[0].key];
      if (used.has(subject)) continue;
      used.add(subject);
      const variant = t.relation === "A" ? t.palmPole!.split(":")[1] : "two";
      const sources = byChapter([...t.hands, ...t.sky, ...t.skyOpposite]);
      themes.push({
        subject,
        axis: t.axis,
        variant,
        basis: "c8",
        tradition: "ambas",
        sources,
        chapters: chaptersOf(sources),
        questionKey: `${t.axis}:${variant}`,
      });
    }

  // 2. Assuntos independentes, cada um de UMA tradição.
  const handsOk = hands && !hands.retakeRecommended;
  const pool: BridgeRef[] = [
    ...(sky?.items ?? []),
    ...(handsOk ? [...hands.items, ...hands.reflect] : []),
  ];
  const bySubject = new Map<Subject, BridgeRef[]>();
  for (const r of pool) {
    const s = SUBJECT[r.key];
    if (!s || used.has(s)) continue;
    bySubject.set(s, [...(bySubject.get(s) ?? []), r]);
  }
  const picked: Theme9[] = [];
  for (const [subject, unsorted] of bySubject) {
    const all = byChapter(unsorted);
    const sides = [...new Set(all.map((r) => r.side))];
    let chosen: Theme9 | null = null;
    for (const side of sides) {
      const refs = all.filter((r) => r.side === side);
      const tradition = side === "sky" ? "céu" : "mãos";
      if (SUBJECT_TITLE[subject]) {
        chosen = {
          subject,
          axis: null,
          variant: subject,
          basis: "assunto",
          tradition,
          sources: refs,
          chapters: chaptersOf(refs),
          questionKey: subject,
        };
        break;
      }
      const options: Theme9[] = [];
      for (const axis of SUBJECT_AXES[subject] ?? []) {
        const on = refs.filter(onAxis(axis));
        if (!on.length) continue;
        const poles = [...new Set(on.map(poleOn(axis)))];
        const variant = poles.length === 2 ? "two" : poles[0]!.split(":")[1];
        options.push({
          subject,
          axis,
          variant,
          basis: poles.length === 2 ? "tensao" : "um-polo",
          tradition,
          sources: on,
          chapters: chaptersOf(on),
          questionKey: `${axis}:${variant}`,
        });
      }
      // Prefere o eixo em que o próprio assunto tem os dois polos.
      chosen = options.find((o) => o.basis === "tensao") ?? options[0] ?? null;
      if (chosen) break;
      excluded.push(
        `${subject} (${tradition}): sem polo nos eixos que o assunto trata`,
      );
    }
    if (!chosen) continue;
    if (!C9.q[chosen.questionKey]) {
      excluded.push(`${subject}: variante sem pergunta aprovada`);
      continue;
    }
    if (sides.length > 1)
      excluded.push(
        `${subject}: a outra tradição não foi juntada (sem conexão do cap. 8)`,
      );
    picked.push(chosen);
  }
  // Perguntas que dependem da leitura antes das gerais; depois, a ordem do relatório.
  picked.sort(
    (a, b) =>
      RANK[a.basis] - RANK[b.basis] ||
      a.chapters[0] - b.chapters[0] ||
      a.subject.localeCompare(b.subject),
  );
  for (const t of picked) {
    if (themes.length >= C9_MAX_THEMES) {
      excluded.push(`${t.subject}: fora do limite de ${C9_MAX_THEMES} temas`);
      continue;
    }
    themes.push(t);
  }
  if (themes.length < C9_MIN_THEMES)
    return {
      status: "unavailable",
      reason: themes.length ? "V2" : "V1",
      themes,
      excluded,
    };
  return { status: "content", reason: null, themes, excluded };
}
