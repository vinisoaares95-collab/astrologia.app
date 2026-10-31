/**
 * Validação de textos gerados por modelo de linguagem (Fases 02E e 02F).
 *
 * Nenhum texto gerado é exibido sem passar por aqui. A validação confere a
 * estrutura, as citações (itemIds do próprio capítulo) e procura afirmações
 * astrológicas sem origem nos fatos citados: "<corpo> em <signo>", signos
 * citados pelo nome ou por adjetivo ("leonino"), pontos do mapa, casas
 * (em algarismos ou por extenso), nomes de aspectos e graus. Também bloqueia
 * linguagem determinista, temas de saúde/finanças/decisões de relacionamento,
 * ressalvas omitidas e repetição excessiva.
 *
 * Limite assumido: é uma verificação LÉXICA. Passar aqui não prova que o
 * texto está semanticamente correto — só que não contém as falhas que
 * sabemos detectar.
 */
import type { AspectType, Body, Sign } from "../../astrology/domain/types";
import { ASPECT_NAMES, BODY_NAMES, SIGN_NAMES } from "../../natal-chart/labels";
import type {
  ChapterId,
  ChapterInterpretation,
  Fact,
  InterpretationItem,
  InterpretationReport,
} from "../contract";
import { LIMITS } from "./prompt";

export type AiValidationError = {
  code:
    | "INVALID_SHAPE"
    | "UNKNOWN_CHAPTER"
    | "MISSING_CHAPTER"
    | "DUPLICATE_CHAPTER"
    | "UNKNOWN_ITEM"
    | "MISSING_ITEM"
    | "UNSUPPORTED_POSITION"
    | "UNSUPPORTED_SIGN"
    | "UNSUPPORTED_POINT"
    | "UNSUPPORTED_HOUSE"
    | "UNSUPPORTED_ASPECT"
    | "UNSUPPORTED_DEGREE"
    | "FORBIDDEN_LANGUAGE"
    | "HEALTH_FINANCE_RELATIONSHIP"
    | "MISSING_CAVEAT"
    | "REPETITION"
    | "TOO_LONG";
  chapter?: ChapterId;
  /** Parte do capítulo: "introduction", "sections.N", "synthesis", "reflectionQuestions.N". */
  part?: string;
  /** Índice do parágrafo (formato 02E). */
  paragraph?: number;
  message: string;
};

export type AiChapterOutput = {
  id: ChapterId;
  paragraphs: { text: string; itemIds: string[] }[];
};

const L = "\\p{L}";
const word = (alternatives: string[]) =>
  `(?<!${L})(${alternatives.join("|")})(?!${L})`;

type Point = Body | "asc" | "mc" | "desc" | "ic";

const POINT_BY_NAME: Record<string, Point> = {
  ...Object.fromEntries(
    Object.entries(BODY_NAMES).map(([k, v]) => [v.toLowerCase(), k as Body]),
  ),
  ascendente: "asc",
  "meio do céu": "mc",
};
const SIGN_BY_NAME = Object.fromEntries(
  Object.entries(SIGN_NAMES).map(([k, v]) => [v.toLowerCase(), k as Sign]),
);

/** Adjetivos pátrios dos signos (paráfrases como "seu Sol leonino"). */
const SIGN_ADJECTIVES: Record<string, Sign> = {
  arian: "aries",
  taurin: "taurus",
  geminian: "gemini",
  cancerian: "cancer",
  leonin: "leo",
  virginian: "virgo",
  librian: "libra",
  escorpian: "scorpio",
  escorpionian: "scorpio",
  sagitarian: "sagittarius",
  capricornian: "capricorn",
  aquarian: "aquarius",
  piscian: "pisces",
};

const ASPECT_BY_NAME: Record<string, AspectType> = {
  ...Object.fromEntries(
    Object.entries(ASPECT_NAMES).map(([k, v]) => [
      v.toLowerCase(),
      k as AspectType,
    ]),
  ),
  conjunções: "conjunction",
  sextis: "sextile",
  trígonos: "trine",
  quadraturas: "square",
  oposições: "opposition",
};

const HOUSE_WORDS: Record<string, number> = {
  um: 1, uma: 1, dois: 2, duas: 2, três: 3, quatro: 4, cinco: 5, seis: 6,
  sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12,
  primeira: 1, segunda: 2, terceira: 3, quarta: 4, quinta: 5, sexta: 6,
  sétima: 7, oitava: 8, nona: 9, décima: 10,
  "décima primeira": 11, "décima segunda": 12,
}; // prettier-ignore

const POSITION_RE = new RegExp(
  `${word(Object.keys(POINT_BY_NAME))}\\s+(?:em|no signo de)\\s+${word(Object.keys(SIGN_BY_NAME))}`,
  "giu",
);
const SIGN_RE = new RegExp(word(Object.values(SIGN_NAMES)), "gu");
const SIGN_ADJ_RE = new RegExp(
  `(?<!${L})(${Object.keys(SIGN_ADJECTIVES).join("|")})(?:o|a|os|as)(?!${L})`,
  "giu",
);
/** Pontos do mapa citados pelo nome (com maiúscula, como nomes próprios). */
const POINT_RE = new RegExp(
  word([
    ...Object.values(BODY_NAMES),
    "Ascendente",
    "Meio do Céu",
    "Descendente",
    "Fundo do Céu",
  ]),
  "gu",
);
const POINT_LABEL: Record<string, Point> = {
  ...Object.fromEntries(
    Object.entries(BODY_NAMES).map(([k, v]) => [v, k as Body]),
  ),
  Ascendente: "asc",
  "Meio do Céu": "mc",
  Descendente: "desc",
  "Fundo do Céu": "ic",
};
const HOUSE_WORDS_ALT = Object.keys(HOUSE_WORDS)
  .sort((a, b) => b.length - a.length)
  .join("|");
const HOUSE_RE = new RegExp(
  `(?<!${L})casas?\\s+(\\d{1,2}|${HOUSE_WORDS_ALT})(?!${L}|\\d)|(?<!${L})(${HOUSE_WORDS_ALT})\\s+casa(?!${L})`,
  "giu",
);
const ASPECT_RE = new RegExp(word(Object.keys(ASPECT_BY_NAME)), "giu");
const DEGREE_RE = /\d{1,2}°(?:\s?\d{1,2}′)?/gu;

/** Linguagem determinista, de certeza científica ou de previsão. */
export const FORBIDDEN_PATTERNS: readonly RegExp[] = [
  /(?<!\p{L})com certeza(?!\p{L})/iu,
  /(?<!\p{L})certamente(?!\p{L})/iu,
  /(?<!\p{L})comprovad[oa]s?(?!\p{L})/iu,
  /(?<!\p{L})cientific\p{L}*/iu,
  /(?<!\p{L})garant\p{L}*/iu,
  /(?<!\p{L})diagn[oó]stic\p{L}*/iu,
  /(?<!\p{L})seu destino(?!\p{L})/iu,
  /(?<!\p{L})você (?:vai|irá)(?!\p{L})/iu,
  /(?<!\p{L})(?:sempre|nunca) (?:será|vai|irá)(?!\p{L})/iu,
  /(?<!\p{L})determina(?:m|do|da|nte)?(?!\p{L})/iu,
  /(?<!\p{L})predestin\p{L}*/iu,
  /(?<!\p{L})inevit[aá]ve(?:l|is)(?!\p{L})/iu,
  /(?<!\p{L})fatalmente(?!\p{L})/iu,
  /(?<!\p{L})está escrito(?!\p{L})/iu,
];

/** Saúde, finanças e decisões de relacionamento: fora do escopo editorial. */
export const SENSITIVE_PATTERNS: readonly RegExp[] = [
  /(?<!\p{L})doen[çc]\p{L}*/iu,
  /(?<!\p{L})transtorno\p{L}*/iu,
  /(?<!\p{L})depress[ãa]o(?!\p{L})/iu,
  /(?<!\p{L})sintoma\p{L}*/iu,
  /(?<!\p{L})medica(?:mento|ção|ções|r)\p{L}*/iu,
  /(?<!\p{L})rem[ée]dio\p{L}*/iu,
  /(?<!\p{L})tratamento\p{L}*/iu,
  /(?<!\p{L})psiquiatr\p{L}*/iu,
  /(?<!\p{L})psic[óo]log[oa]s?(?!\p{L})/iu,
  /(?<!\p{L})terapi\p{L}*/iu,
  /(?<!\p{L})investi(?:mento|mentos|r|ndo)(?!\p{L})/iu,
  /(?<!\p{L})invista(?!\p{L})/iu,
  /(?<!\p{L})(?:bolsa de valores|criptomoeda\p{L}*|empréstimo\p{L}*|lucro\p{L}*)/iu,
  /(?<!\p{L})ficar ric[oa](?!\p{L})/iu,
  /(?<!\p{L})enriquec\p{L}*/iu,
  /(?<!\p{L})d[íi]vidas?(?!\p{L})/iu,
  /(?<!\p{L})divórcio|divorciar\p{L}*/iu,
  /(?<!\p{L})(?:se separar|terminar (?:o|seu|sua|a|um|uma) (?:relacionamento|namoro|casamento))/iu,
  /(?<!\p{L})alma gêmea(?!\p{L})/iu,
];

const CAVEAT_RE = /reserva|incert|não se mantém|pode não|com cautela/iu;
/** Frases que explicam uma limitação podem citar pontos/casas ausentes. */
const HEDGE_RE =
  /não (?:foi|foram|pôde|puderam|pode|podem|entra|entram|entrou|entraram|é possível|são considerad|foi considerad)|sem (?:o )?horário|horário (?:de nascimento )?(?:desconhecido|aproximado)|desconhecid|não considerad|ficou de fora|ficaram de fora/iu;

type Support = {
  positions: Set<string>;
  signs: Set<Sign>;
  points: Set<Point>;
  houses: Set<number>;
  aspects: Set<AspectType>;
  observations: string;
  uncertain: boolean;
};

/** O que os itens citados sustentam (e nada além disso). */
function supportOf(items: InterpretationItem[], factById: Map<string, Fact>) {
  const s: Support = {
    positions: new Set(),
    signs: new Set(),
    points: new Set(),
    houses: new Set(),
    aspects: new Set(),
    observations: items.map((i) => i.observation).join(" "),
    uncertain: items.some((i) => i.certainty === "uncertain"),
  };
  for (const f of items.flatMap((i) =>
    i.factIds.map((id) => factById.get(id)!),
  )) {
    for (const b of f.bodies) s.points.add(b);
    if (f.sign) s.signs.add(f.sign);
    if ((f.kind === "body-sign" || f.kind === "angle-sign") && f.sign)
      s.positions.add(`${f.bodies[0]}:${f.sign}`);
    if (f.kind === "chart-ruler") {
      s.positions.add(`asc:${f.values.ascSign}`);
      s.positions.add(`${f.values.ruler}:${f.values.rulerSign}`);
      s.signs.add(f.values.ascSign as Sign);
      if (typeof f.values.rulerHouse === "number")
        s.houses.add(f.values.rulerHouse);
    }
    if (f.kind === "cusp-sign" && f.house) {
      s.houses.add(f.house);
      if (f.house === 7) s.points.add("desc");
      if (f.house === 4) s.points.add("ic");
    }
    if (f.kind === "body-house" && f.house) s.houses.add(f.house);
    if (f.kind === "aspect" && f.aspect) s.aspects.add(f.aspect.type);
  }
  return s;
}

type Issue = Omit<AiValidationError, "chapter" | "part" | "paragraph">;

const sentencesOf = (text: string) =>
  text.split(/(?<=[.!?…])\s+/u).filter((x) => x.trim());

/** Verificações de conteúdo de um trecho de texto contra o que o sustenta. */
function checkText(
  text: string,
  s: Support,
  options: { requireCaveat: boolean },
): Issue[] {
  const out: Issue[] = [];
  const add = (code: Issue["code"], message: string) =>
    out.push({ code, message });

  for (const m of text.matchAll(POSITION_RE)) {
    const point = POINT_BY_NAME[m[1].toLowerCase()];
    const sign = SIGN_BY_NAME[m[2].toLowerCase()];
    if (!s.positions.has(`${point}:${sign}`))
      add("UNSUPPORTED_POSITION", `"${m[0]}" não consta nos itens citados.`);
  }
  for (const m of text.matchAll(SIGN_RE))
    if (!s.signs.has(SIGN_BY_NAME[m[1].toLowerCase()]))
      add("UNSUPPORTED_SIGN", `Signo "${m[0]}" não consta nos itens citados.`);
  for (const m of text.matchAll(SIGN_ADJ_RE))
    if (!s.signs.has(SIGN_ADJECTIVES[m[1].toLowerCase()]))
      add("UNSUPPORTED_SIGN", `"${m[0]}" remete a um signo ausente dos itens.`);

  for (const sentence of sentencesOf(text)) {
    const hedged = HEDGE_RE.test(sentence);
    for (const m of sentence.matchAll(POINT_RE))
      if (!s.points.has(POINT_LABEL[m[1]]) && !hedged)
        add("UNSUPPORTED_POINT", `"${m[0]}" não consta nos itens citados.`);
    for (const m of sentence.matchAll(HOUSE_RE)) {
      const raw = (m[1] ?? m[2]).toLowerCase();
      const n = /^\d+$/.test(raw) ? Number(raw) : HOUSE_WORDS[raw];
      if (!s.houses.has(n) && !hedged)
        add("UNSUPPORTED_HOUSE", `"${m[0]}" não consta nos itens citados.`);
    }
  }
  for (const m of text.matchAll(ASPECT_RE))
    if (!s.aspects.has(ASPECT_BY_NAME[m[1].toLowerCase()]))
      add("UNSUPPORTED_ASPECT", `"${m[0]}" não consta nos itens citados.`);
  for (const m of text.matchAll(DEGREE_RE))
    if (!s.observations.includes(m[0].replace(/\s/g, "")))
      add("UNSUPPORTED_DEGREE", `Grau "${m[0]}" não consta nas observações.`);

  for (const re of FORBIDDEN_PATTERNS) {
    const m = text.match(re);
    if (m) add("FORBIDDEN_LANGUAGE", `Linguagem determinista: "${m[0]}".`);
  }
  for (const re of SENSITIVE_PATTERNS) {
    const m = text.match(re);
    if (m)
      add(
        "HEALTH_FINANCE_RELATIONSHIP",
        `Tema de saúde, finanças ou decisão de relacionamento: "${m[0]}".`,
      );
  }
  if (options.requireCaveat && s.uncertain && !CAVEAT_RE.test(text))
    add("MISSING_CAVEAT", "Texto cita item incerto sem manter a ressalva.");
  return out;
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Repetição excessiva: frases idênticas, a mesma sequência de 6 palavras
 * 3+ vezes, ou 4+ frases abertas pelas mesmas 3 palavras.
 */
export function repetitionIssues(texts: string[]): Issue[] {
  const out: Issue[] = [];
  const sentences = texts.flatMap(sentencesOf).map(normalize).filter(Boolean);

  const seen = new Set<string>();
  for (const s of sentences) {
    if (s.split(" ").length >= 5 && seen.has(s))
      out.push({ code: "REPETITION", message: `Frase repetida: "${s}".` });
    seen.add(s);
  }

  const grams = new Map<string, number>();
  for (const s of sentences) {
    const w = s.split(" ");
    for (let i = 0; i + 6 <= w.length; i++) {
      const g = w.slice(i, i + 6).join(" ");
      grams.set(g, (grams.get(g) ?? 0) + 1);
    }
  }
  for (const [g, n] of grams)
    if (n >= 3)
      out.push({
        code: "REPETITION",
        message: `Expressão repetida ${n} vezes: "${g}".`,
      });

  const openings = new Map<string, number>();
  for (const s of sentences) {
    const w = s.split(" ");
    if (w.length < 4) continue;
    const o = w.slice(0, 3).join(" ");
    openings.set(o, (openings.get(o) ?? 0) + 1);
  }
  for (const [o, n] of openings)
    if (n >= 4)
      out.push({
        code: "REPETITION",
        message: `${n} frases começam com "${o}".`,
      });
  return out;
}

// ── Fase 02F: um capítulo estruturado ─────────────────────────────────────

/**
 * Valida o rascunho de UM capítulo devolvido pelo modelo.
 * `draft` é `unknown` de propósito: a resposta da API não é confiável.
 */
export function validateChapterDraft(
  draft: unknown,
  chapter: ChapterInterpretation,
  report: InterpretationReport,
): { ok: boolean; errors: AiValidationError[] } {
  const errors: AiValidationError[] = [];
  const push = (part: string | undefined, issues: Issue[]) =>
    issues.forEach((i) => errors.push({ ...i, chapter: chapter.id, part }));
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

  const factById = new Map(report.facts.map((f) => [f.id, f]));
  const items = new Map(chapter.items.map((i) => [i.id, i]));
  const whole = supportOf(chapter.items, factById);
  const tooLong = (part: string, text: string, max: number) => {
    if (text.length > max)
      push(part, [
        {
          code: "TOO_LONG",
          message: `${text.length} caracteres (máximo ${max}).`,
        },
      ]);
  };

  const intro = d.introduction as string;
  const synthesis = d.synthesis as string;
  tooLong("introduction", intro, LIMITS.introductionChars);
  tooLong("synthesis", synthesis, LIMITS.synthesisChars);
  push("introduction", checkText(intro, whole, { requireCaveat: false }));
  push("synthesis", checkText(synthesis, whole, { requireCaveat: false }));

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
    const found: InterpretationItem[] = [];
    for (const id of sec.itemIds) {
      const item = items.get(String(id));
      if (!item)
        push(part, [
          {
            code: "UNKNOWN_ITEM",
            message: `Item ${String(id)} não pertence ao capítulo ${chapter.id}.`,
          },
        ]);
      else {
        found.push(item);
        cited.add(item.id);
      }
    }
    tooLong(part, sec.text, LIMITS.sectionChars);
    push(
      part,
      checkText(sec.text, supportOf(found, factById), { requireCaveat: true }),
    );
  });

  (questions as string[]).forEach((q, i) => {
    const part = `reflectionQuestions.${i}`;
    tooLong(part, q, LIMITS.questionChars);
    if (!q.trim().endsWith("?"))
      shape(part, "A pergunta de reflexão deve terminar com '?'.");
    push(part, checkText(q, whole, { requireCaveat: false }));
  });

  for (const item of chapter.items)
    if (!cited.has(item.id))
      push(undefined, [
        {
          code: "MISSING_ITEM",
          message: `O item ${item.id} não foi usado em nenhuma seção.`,
        },
      ]);

  push(
    undefined,
    repetitionIssues([
      intro,
      ...sections!.map((s) => String((s as { text: unknown }).text)),
      synthesis,
    ]),
  );
  return { ok: errors.length === 0, errors };
}

// ── Fase 02E: relatório inteiro em parágrafos ─────────────────────────────

export function validateAiOutput(
  output: unknown,
  report: InterpretationReport,
): { ok: boolean; errors: AiValidationError[] } {
  const errors: AiValidationError[] = [];
  const shape = (message: string) =>
    errors.push({ code: "INVALID_SHAPE", message });

  const chapters = (output as { chapters?: unknown })?.chapters;
  if (!Array.isArray(chapters)) {
    shape("A saída deve ter a lista 'chapters'.");
    return { ok: false, errors };
  }

  const factById = new Map(report.facts.map((f) => [f.id, f]));
  const seen = new Set<string>();

  chapters.forEach((raw: Partial<AiChapterOutput>) => {
    const chapter = report.chapters.find((c) => c.id === raw?.id);
    if (!chapter) {
      errors.push({
        code: "UNKNOWN_CHAPTER",
        message: `Capítulo desconhecido: ${String(raw?.id)}.`,
      });
      return;
    }
    if (seen.has(chapter.id)) {
      errors.push({
        code: "DUPLICATE_CHAPTER",
        chapter: chapter.id,
        message: `Capítulo repetido: ${chapter.id}.`,
      });
      return;
    }
    seen.add(chapter.id);
    if (!Array.isArray(raw.paragraphs) || raw.paragraphs.length === 0) {
      shape(`Capítulo ${chapter.id} sem parágrafos.`);
      return;
    }

    const items = new Map(chapter.items.map((i) => [i.id, i]));
    raw.paragraphs.forEach((p, index) => {
      const at = { chapter: chapter.id, paragraph: index };
      if (
        typeof p?.text !== "string" ||
        !p.text.trim() ||
        !Array.isArray(p.itemIds) ||
        p.itemIds.length === 0
      ) {
        errors.push({
          code: "INVALID_SHAPE",
          ...at,
          message: "Parágrafo sem texto ou sem itemIds.",
        });
        return;
      }
      const cited = p.itemIds.map((id) => items.get(id));
      p.itemIds.forEach((id, i) => {
        if (!cited[i])
          errors.push({
            code: "UNKNOWN_ITEM",
            ...at,
            message: `Item ${id} não pertence ao capítulo ${chapter.id}.`,
          });
      });
      const valid = cited.filter((x) => x !== undefined);
      for (const issue of checkText(p.text, supportOf(valid, factById), {
        requireCaveat: true,
      }))
        errors.push({ ...issue, ...at });
    });
  });

  for (const c of report.chapters)
    if (c.items.length > 0 && !seen.has(c.id))
      errors.push({
        code: "MISSING_CHAPTER",
        chapter: c.id,
        message: `Capítulo ${c.id} ausente na saída.`,
      });

  return { ok: errors.length === 0, errors };
}
