/**
 * Frases do SISTEMA sobre o que não foi usado (Fase 03F.2): limitações
 * condensadas, mensagens de indisponibilidade e ressalvas de parcialidade.
 *
 * Distingue três situações, sem interpretar nenhuma delas:
 * - indeterminada (`unclassifiable`): o traço aparece, a categoria não;
 * - não identificada (`ambiguous`): não dá para saber qual traço é qual;
 * - não visível (demais motivos): não apareceu com segurança.
 *
 * Problemas de imagem vêm da análise automática e não foram verificados
 * por uma pessoa: são apresentados como "a análise apontou", nunca como
 * fato.
 */
import type { FeatureId, ImageIssue, NotVisibleReason } from "./contract";
import { FEATURE_LABELS } from "./library";

export type Unused = { feature: FeatureId; reason: NotVisibleReason };

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const upper = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const feminine = (id: FeatureId) => FEATURE_LABELS[id].startsWith("A ");

const join = (l: readonly string[]) =>
  l.length <= 1 ? (l[0] ?? "") : `${l.slice(0, -1).join(", ")} e ${l.at(-1)}`;

const LINE_LABEL = /^(.+?) (da linha d[aeo] .+)$/u;

/**
 * "o formato da palma e o comprimento dos dedos"; aspectos da mesma linha
 * ficam juntos: "o comprimento e a inclinação da linha da cabeça".
 */
export function labelList(ids: readonly FeatureId[]): string {
  const groups = new Map<string, string[]>();
  for (const id of ids) {
    const l = lower(FEATURE_LABELS[id]);
    const m = l.match(LINE_LABEL);
    const key = m ? m[2] : l;
    if (!groups.has(key)) groups.set(key, []);
    if (m) groups.get(key)!.push(m[1]);
  }
  return join(
    [...groups].map(([key, parts]) =>
      parts.length ? `${join(parts)} ${key}` : key,
    ),
  );
}

/** Nível da linha: "a linha do coração" (mãos: o próprio rótulo). */
function lineName(id: FeatureId): string {
  const m = lower(FEATURE_LABELS[id]).match(LINE_LABEL);
  return m ? m[2].slice(1) : lower(FEATURE_LABELS[id]);
}

/** Concordância: singular (o/a) ou plural (os, ou as se todos femininos). */
function agree(ids: readonly FeatureId[]) {
  const plural = ids.length > 1;
  const g = ids.every(feminine) ? "a" : "o";
  return {
    plural,
    adj: plural ? `${g}s` : g, // classificad[o|a|os|as]
    verb: (s: string, p: string) => (plural ? p : s),
  };
}

export const FATE_NOT_IDENTIFIED =
  "A linha do destino não foi identificada com clareza na foto e não foi interpretada; isso não quer dizer que ela não exista.";

/** Até 3 frases (indeterminadas, não identificadas, não visíveis) + destino. */
export function condensedLimitations(unused: readonly Unused[]): string[] {
  const fate = unused.some((u) => u.feature === "fate.presence");
  const rest = unused.filter((u) => u.feature !== "fate.presence");
  const by = (pick: (r: NotVisibleReason) => boolean) =>
    rest.filter((u) => pick(u.reason)).map((u) => u.feature);
  const indeterminate = by((r) => r === "unclassifiable");
  const unidentified = by((r) => r === "ambiguous");
  const unseen = by((r) => r !== "unclassifiable" && r !== "ambiguous");
  const out: string[] = [];
  if (indeterminate.length) {
    const a = agree(indeterminate);
    out.push(
      `${upper(labelList(indeterminate))} ${a.verb("aparece", "aparecem")} na foto, mas não ${a.verb("pôde", "puderam")} ser classificad${a.adj} com segurança; por isso não ${a.verb("foi", "foram")} interpretad${a.adj}.`,
    );
  }
  if (unidentified.length) {
    const a = agree(unidentified);
    out.push(
      `Não foi possível identificar com segurança ${labelList(unidentified)}; por isso não ${a.verb("foi", "foram")} interpretad${a.adj}.`,
    );
  }
  if (unseen.length) {
    const a = agree(unseen);
    out.push(
      `${upper(labelList(unseen))} não ${a.verb("ficou visível", "ficaram visíveis")} na foto e não ${a.verb("foi", "foram")} interpretad${a.adj}.`,
    );
  }
  if (fate) out.push(FATE_NOT_IDENTIFIED);
  return out;
}

const ISSUE_TEXT: Partial<Record<ImageIssue, string>> = {
  too_dark: "pouca luz",
  overexposed: "luz forte demais",
  glare: "reflexos",
  blurry: "falta de nitidez",
  hand_cropped: "parte da mão fora do enquadramento",
  angled: "a mão inclinada em relação à câmera",
  obstruction: "algo cobrindo parte da palma",
};

/** Problemas apontados pela análise automática (não verificados). */
export function imageIssuesNote(issues: readonly ImageIssue[]): string | null {
  const t = issues.map((i) => ISSUE_TEXT[i]).filter(Boolean) as string[];
  if (!t.length) return null;
  const list =
    t.length === 1 ? t[0] : `${t.slice(0, -1).join(", ")} e ${t.at(-1)}`;
  return `A análise da foto apontou ${list}; algumas características podem não ter sido observadas.`;
}

/** Orientação de nova foto conforme os problemas apontados. */
const ISSUE_GUIDANCE: Partial<Record<ImageIssue, string>> = {
  angled: "palma de frente, com o celular paralelo a ela",
  hand_cropped: "mão inteira no quadro, do pulso às pontas dos dedos",
  too_dark: "mais luz, de preferência natural",
  overexposed: "sem luz forte direto sobre a palma",
  glare: "sem reflexos sobre a palma",
  blurry: "celular apoiado e foco na palma",
  obstruction: "nada cobrindo a palma",
  hand_closed: "palma bem aberta",
};

const DEFAULT_GUIDANCE = {
  maos: "mão inteira no quadro, de frente para a câmera, com luz natural",
  linhas:
    "palma bem aberta, de frente para a câmera, com luz natural e sem reflexos",
} as const;

export function retakeGuidance(
  chapter: "maos" | "linhas",
  issues: readonly ImageIssue[],
): string {
  const g = [
    ...new Set(issues.map((i) => ISSUE_GUIDANCE[i]).filter(Boolean)),
  ] as string[];
  const text = g.length ? g.slice(0, 3).join("; ") : DEFAULT_GUIDANCE[chapter];
  return `Uma nova foto pode permitir esta leitura: ${text}.`;
}

/**
 * Mensagem de capítulo indisponível conforme o motivo: foto insuficiente,
 * características visíveis mas indeterminadas, não identificadas ou não
 * visíveis (e a combinação delas).
 */
export function unavailableMessage(
  chapter: "maos" | "linhas",
  unused: readonly Unused[],
  issues: readonly ImageIssue[],
  insufficient = false,
): string {
  const own = unused.filter((u) =>
    chapter === "maos"
      ? u.feature.startsWith("hand.")
      : !u.feature.startsWith("hand."),
  );
  const indeterminate = own
    .filter((u) => u.reason === "unclassifiable")
    .map((u) => u.feature);
  const others = own
    .filter((u) => u.reason !== "unclassifiable")
    .map((u) => u.feature);
  const onlyAmbiguous =
    others.length > 0 && own.every((u) => u.reason === "ambiguous");
  const what =
    chapter === "maos"
      ? "o formato da palma e o comprimento dos dedos"
      : "as linhas da palma";
  let first: string;
  if (insufficient) {
    first = `Nesta foto, ${what} não puderam ser observad${chapter === "maos" ? "os" : "as"} com segurança`;
  } else if (indeterminate.length) {
    const a = agree(indeterminate);
    first = `Nesta foto, ${labelList(indeterminate)} ${a.verb("aparece", "aparecem")}, mas não ${a.verb("pôde", "puderam")} ser classificad${a.adj} com segurança`;
    if (others.length) {
      const b = agree(others);
      first +=
        chapter === "maos"
          ? `, e ${labelList(others)} não ${b.verb("ficou visível", "ficaram visíveis")}`
          : ", e as demais características das linhas não ficaram visíveis";
    }
  } else if (onlyAmbiguous) {
    first = `Nesta foto, não foi possível identificar com segurança ${chapter === "maos" ? "as proporções da mão" : "qual linha é qual"}`;
  } else {
    first = `Nesta foto, ${what} não ficaram visíveis com segurança`;
  }
  return `${first}; por isso esta parte da leitura não foi feita. ${retakeGuidance(chapter, issues)}`;
}

/**
 * Uma ressalva por capítulo, no nível da linha ("a linha do coração e a
 * linha da vida") para não repetir cada aspecto.
 */
export function partialNote(ids: readonly FeatureId[]): string {
  const names = [...new Set(ids.map(lineName))];
  const plural = names.length > 1;
  const v = (sg: string, pl: string) => (plural ? pl : sg);
  return `${upper(join(names))} ${v("ficou", "ficaram")} só parcialmente ${v("visível", "visíveis")} na foto; leia ${v("essa interpretação", "essas interpretações")} com reserva.`;
}
