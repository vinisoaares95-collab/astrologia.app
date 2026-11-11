/**
 * Validação dos capítulos 6 e 7 (Fase 03E).
 *
 * Mesmo papel do validador astrológico (02F): nenhum texto gerado chega ao
 * cliente sem passar aqui. Reaproveita os limites editoriais, a checagem
 * de linguagem determinista e de temas sensíveis, a de repetição e o reparo
 * de referências cruzadas. As regras próprias da quiromancia:
 * - só características presentes nas observações validadas (nada de
 *   montes, linha do Sol, marcas, outras linhas);
 * - nenhum valor diferente do observado ("curta" para uma linha longa);
 * - cada seção cita os itens de onde vem o que ela menciona;
 * - nada de longevidade, futuro, destino traçado, saúde, dinheiro,
 *   relacionamentos, nem atributos pessoais.
 *
 * Limite assumido: verificação LÉXICA. Passar aqui não prova correção
 * semântica, só a ausência das falhas que sabemos detectar.
 */
import { LIMITS } from "../../interpretation/ai/prompt";
import {
  describePart,
  languageIssues,
  repetitionIssues,
  type AiValidationError,
} from "../../interpretation/ai/validate";
import type { FeatureId } from "../analysis/contract";
import type { PalmChapter, PalmFact, PalmReport } from "../analysis/engine";
import { PALM_FORBIDDEN_TEXT_PATTERNS } from "../analysis/library";
import { PALM_SENSITIVE_PATTERNS } from "../analysis/validate-observation";

type Issue = Omit<AiValidationError, "chapter" | "part" | "paragraph">;

/** Grupos de características que o texto pode mencionar. */
type Group =
  "palmShape" | "fingers" | "handType" | "heart" | "head" | "life" | "fate";

const GROUP_OF: Record<PalmFact["id"], Group> = {
  "hand.palmShape": "palmShape",
  "hand.fingerLength": "fingers",
  "hand.type": "handType",
  "heart.length": "heart",
  "heart.shape": "heart",
  "head.length": "head",
  "head.slope": "head",
  "head.start": "head",
  "life.arc": "life",
  "fate.presence": "fate",
};

const GROUP_LABEL: Record<Group, string> = {
  palmShape: "ao formato da palma",
  fingers: "ao comprimento dos dedos",
  handType: "ao tipo de mão",
  heart: "à linha do coração",
  head: "à linha da cabeça",
  life: "à linha da vida",
  fate: "à linha do destino",
};

const W = (body: string) =>
  new RegExp(`(?<!\\p{L})(?:${body})(?!\\p{L})`, "iu");

/** Como cada grupo aparece no texto. */
const MENTION: Record<Group, RegExp> = {
  heart: W("linha do coração"),
  head: W("linha da cabeça"),
  life: W("linha da vida"),
  fate: W("linha do destino"),
  palmShape: W(
    "formato da (?:sua )?palma|palma (?:de formato )?(?:mais )?(?:quadrad\\p{L}*|retangular|alongad\\p{L}*|longa)",
  ),
  fingers: W(
    "comprimento dos (?:seus )?dedos|dedos (?:mais )?(?:curtos|longos|médios|de comprimento médio)",
  ),
  handType: /(?<!\p{L})mão de (?:Terra|Ar|Fogo|Água)(?!\p{L})/u,
};

/** Características que não fazem parte do contrato: nunca mencionáveis. */
const NEVER = W(
  [
    "linha do sol",
    "linha de apolo",
    "linha de mercúrio",
    "linha da saúde",
    "linha da intuição",
    "linhas? (?:do|de|dos) (?:casamento|relacionamentos?|afeto|filhos|viage(?:m|ns))",
    "montes?\\s+de\\s+\\p{L}+",
    "cinturão de vênus",
    "braceletes?",
    "rascetas?",
    "anel de (?:salomão|saturno|apolo)",
    "via lasciva",
    "ilhas?",
    "estrelas? na (?:mão|palma|linha)",
    "cruz mística",
    "impressões? digita\\p{L}*",
    "unhas?",
  ].join("|"),
);

/** Palavras de valor por característica (checadas onde o grupo é citado). */
const VALUE_TERMS: Partial<Record<FeatureId, Record<string, RegExp>>> = {
  "heart.length": { short: W("curta"), medium: W("média|comprimento médio"), long: W("longa") },
  "heart.shape": { straight: W("ret[ao]|retilíne\\p{L}*"), curved: W("curv\\p{L}*") },
  "head.length": { short: W("curta"), medium: W("média|comprimento médio"), long: W("longa") },
  "head.slope": { straight: W("ret[ao]|horizontal"), sloping: W("descendente|desce|descendo|inclinad\\p{L}*") },
  "head.start": { joined_life: W("unid[ao]|junt[ao]"), separate: W("separad[ao]|afastad[ao]") },
  "life.arc": { wide: W("ampl[oa]|abert[oa]"), close: W("fechad[oa]") },
  "hand.palmShape": { square: W("quadrad\\p{L}*"), rectangular: W("retangular|alongad\\p{L}*|mais longa do que larga") },
  "hand.fingerLength": { short: W("dedos (?:mais )?curtos"), medium: W("dedos (?:de comprimento )?médios?"), long: W("dedos (?:mais )?longos") },
}; // prettier-ignore

const FEATURES_OF: Record<Group, FeatureId[]> = {
  palmShape: ["hand.palmShape"],
  fingers: ["hand.fingerLength"],
  handType: [],
  heart: ["heart.length", "heart.shape"],
  head: ["head.length", "head.slope", "head.start"],
  life: ["life.arc"],
  fate: ["fate.presence"],
};

/** Previsão, destino traçado e futuro: fora da leitura das mãos. */
const FATE_RE = W(
  "futur\\p{L}*|predestin\\p{L}*|traçad[oa] para|já está traçad\\p{L}*",
);

const sentencesOf = (text: string) =>
  text.split(/(?<=[.!?…])\s+/u).filter((x) => x.trim());

type Support = {
  groups: Set<Group>;
  /** Valor observado de cada característica. */
  values: Map<FeatureId, string>;
  handType: string | null;
};

function supportOf(factIds: string[], facts: Map<string, PalmFact>): Support {
  const s: Support = { groups: new Set(), values: new Map(), handType: null };
  for (const id of factIds) {
    const f = facts.get(id);
    if (!f) continue;
    s.groups.add(GROUP_OF[f.id]);
    // O início da linha da cabeça é descrito EM RELAÇÃO à linha da vida
    // ("começa unida/separada da linha da vida"): a menção é referência
    // da própria observação, não uma característica nova.
    if (f.id === "head.start") s.groups.add("life");
    if (f.id === "hand.type") s.handType = f.observation;
    else s.values.set(f.id, f.value);
  }
  return s;
}

/** Conteúdo de um trecho contra o que o sustenta. */
function checkText(
  text: string,
  section: Support,
  whole: Support,
  where: string,
  suggestFor: (g: Group) => string[],
): Issue[] {
  const out: Issue[] = [];
  const nev = text.match(NEVER);
  if (nev)
    out.push({
      code: "UNSUPPORTED_FEATURE",
      message: `"${nev[0]}" não está entre as características observadas.`,
      fix: `Remova a menção a "${nev[0]}".`,
    });

  for (const g of Object.keys(MENTION) as Group[]) {
    const m = text.match(MENTION[g]);
    if (!m || section.groups.has(g)) continue;
    if (whole.groups.has(g)) {
      const ids = suggestFor(g);
      out.push({
        code: "CROSS_REFERENCE",
        message: `"${m[0]}" pertence a outro item do capítulo (${ids[0]}), ausente dos itemIds desta seção.`,
        fix: `${where}, inclua o item referente ${GROUP_LABEL[g]} (${ids[0]}) nos itemIds utilizados ou remova essa referência.`,
        suggestedItemIds: ids,
      });
    } else
      out.push({
        code: "UNSUPPORTED_FEATURE",
        message: `"${m[0]}" não foi observado na foto (não está nos itens).`,
        fix: `Remova a menção a "${m[0]}".`,
      });
  }

  // Tipo de mão: só o observado (ex.: "mão de Terra").
  const type = text.match(MENTION.handType);
  if (type && whole.handType && !whole.handType.includes(type[0]))
    out.push({
      code: "CONTRADICTION",
      message: `"${type[0]}" não é o tipo de mão observado.`,
      fix: `Remova "${type[0]}".`,
    });

  // Valores: em cada frase, os termos de valor das características citadas
  // precisam ser os observados.
  for (const sentence of sentencesOf(text)) {
    const groups = (Object.keys(MENTION) as Group[]).filter((g) =>
      MENTION[g].test(sentence),
    );
    const allowed: RegExp[] = [];
    const disallowed: [FeatureId, RegExp][] = [];
    for (const g of groups)
      for (const f of FEATURES_OF[g]) {
        const terms = VALUE_TERMS[f];
        if (!terms) continue;
        const observed = whole.values.get(f);
        for (const [value, re] of Object.entries(terms))
          if (value === observed) allowed.push(re);
          else disallowed.push([f, re]);
      }
    for (const [f, re] of disallowed) {
      const m = sentence.match(re);
      if (!m || allowed.some((a) => a.test(m[0]))) continue;
      out.push({
        code: "CONTRADICTION",
        message: `"${m[0]}" não corresponde ao observado para ${f}.`,
        fix: `Descreva a característica como ela foi observada ou remova "${m[0]}".`,
      });
      break;
    }
  }

  for (const i of languageIssues(text))
    out.push({ code: i.code, message: i.message, fix: i.fix });
  for (const re of PALM_FORBIDDEN_TEXT_PATTERNS) {
    const m = text.match(re);
    if (m)
      out.push({
        code: "FORBIDDEN_LANGUAGE",
        message: `Tema fora da leitura das mãos: "${m[0]}".`,
        fix: `Remova "${m[0]}": a leitura não fala de longevidade, saúde, filhos, casamento, dinheiro ou futuro.`,
      });
  }
  const fate = text.match(FATE_RE);
  if (fate)
    out.push({
      code: "FORBIDDEN_LANGUAGE",
      message: `Previsão ou destino traçado: "${fate[0]}".`,
      fix: `Remova "${fate[0]}": a leitura é simbólica, sem previsões.`,
    });
  for (const re of PALM_SENSITIVE_PATTERNS) {
    const m = text.match(re);
    if (m)
      out.push({
        code: "SENSITIVE_ATTRIBUTE",
        message: `Atributo pessoal ou de saúde: "${m[0]}".`,
        fix: `Remova "${m[0]}".`,
      });
  }
  return out;
}

export function validatePalmChapterDraft(
  draft: unknown,
  chapter: PalmChapter,
  report: PalmReport,
): { ok: boolean; errors: AiValidationError[] } {
  const errors: AiValidationError[] = [];
  const push = (part: string | undefined, issues: Issue[]) =>
    issues.forEach((i) => errors.push({ ...i, part }));
  const shape = (part: string | undefined, message: string) =>
    push(part, [{ code: "INVALID_SHAPE", message }]);

  const d = draft as Record<string, unknown> | null;
  const isText = (v: unknown): v is string =>
    typeof v === "string" && v.trim().length > 0;
  if (!d || typeof d !== "object") {
    shape(undefined, "A resposta não é um objeto JSON.");
    return { ok: false, errors };
  }
  if (!isText(d.introduction)) shape("introduction", "Introdução ausente.");
  if (!isText(d.synthesis)) shape("synthesis", "Síntese ausente.");
  const sections = Array.isArray(d.sections) ? d.sections : null;
  if (!sections || sections.length === 0)
    shape("sections", "Nenhuma seção desenvolvida.");
  const questions = Array.isArray(d.reflectionQuestions)
    ? d.reflectionQuestions
    : null;
  if (
    !questions ||
    questions.length < 1 ||
    questions.length > LIMITS.maxQuestions ||
    !questions.every(isText)
  )
    shape(
      "reflectionQuestions",
      `São esperadas de 1 a ${LIMITS.maxQuestions} perguntas de reflexão.`,
    );
  if (errors.length) return { ok: false, errors };

  const facts = new Map(report.facts.map((f) => [f.id as string, f]));
  const items = new Map(chapter.items.map((i) => [i.id, i]));
  const whole = supportOf(
    chapter.items.flatMap((i) => i.factIds),
    facts,
  );
  const suggestFor = (g: Group) =>
    chapter.items
      .filter((i) => i.factIds.some((id) => GROUP_OF[id] === g))
      .map((i) => i.id);
  const tooLong = (part: string, text: string, max: number) => {
    if (text.length > max)
      push(part, [
        {
          code: "TOO_LONG",
          message: `${text.length} caracteres (máximo ${max}).`,
          fix: `Encurte para no máximo ${max} caracteres.`,
        },
      ]);
  };
  const check = (part: string, text: string, section: Support) =>
    push(part, checkText(text, section, whole, describePart(part), suggestFor));

  const intro = d.introduction as string;
  const synthesis = d.synthesis as string;
  tooLong("introduction", intro, LIMITS.introductionChars);
  tooLong("synthesis", synthesis, LIMITS.synthesisChars);
  check("introduction", intro, whole);
  check("synthesis", synthesis, whole);

  const cited = new Set<string>();
  sections!.forEach((raw, index) => {
    const part = `sections.${index}`;
    const sec = raw as { text?: unknown; itemIds?: unknown };
    if (
      !isText(sec?.text) ||
      !Array.isArray(sec.itemIds) ||
      sec.itemIds.length === 0
    )
      return shape(part, "Seção sem texto ou sem itemIds.");
    const factIds: string[] = [];
    for (const id of sec.itemIds) {
      const item = items.get(String(id));
      if (!item)
        push(part, [
          {
            code: "UNKNOWN_ITEM",
            message: `Item ${String(id)} não pertence ao capítulo ${chapter.id}.`,
            fix: "Use apenas itemIds deste capítulo.",
          },
        ]);
      else {
        cited.add(item.id);
        factIds.push(...item.factIds);
      }
    }
    tooLong(part, sec.text, LIMITS.sectionChars);
    check(part, sec.text, supportOf(factIds, facts));
  });

  (questions as string[]).forEach((q, i) => {
    const part = `reflectionQuestions.${i}`;
    tooLong(part, q, LIMITS.questionChars);
    if (!q.trim().endsWith("?"))
      shape(part, "A pergunta de reflexão deve terminar com '?'.");
    check(part, q, whole);
  });

  for (const item of chapter.items)
    if (!cited.has(item.id))
      push(undefined, [
        {
          code: "MISSING_ITEM",
          message: `O item ${item.id} não foi usado em nenhuma seção.`,
          fix: `Use o item ${item.id} em pelo menos uma seção.`,
        },
      ]);

  push(
    undefined,
    repetitionIssues([
      intro,
      ...sections!.map((s) => String((s as { text: unknown }).text)),
      synthesis,
    ]).map((i) => ({ code: i.code, message: i.message })),
  );
  return { ok: errors.length === 0, errors };
}
