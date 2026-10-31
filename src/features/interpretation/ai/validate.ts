/**
 * Validação da saída de um modelo de linguagem (Fase 02E, preparação).
 *
 * Nenhum texto gerado é exibido sem passar por aqui. A validação confere a
 * estrutura, as citações (itemIds do próprio capítulo) e procura afirmações
 * astrológicas que não tenham origem nos fatos citados: "<corpo> em
 * <signo>", "casa N", nomes de aspectos e graus. Também bloqueia linguagem
 * determinista (certeza, diagnóstico, previsão).
 */
import type { AspectType, Body, Sign } from "../../astrology/domain/types";
import { ASPECT_NAMES, BODY_NAMES, SIGN_NAMES } from "../../natal-chart/labels";
import type { ChapterId, Fact, InterpretationReport } from "../contract";

export type AiValidationError = {
  code:
    | "INVALID_SHAPE"
    | "UNKNOWN_CHAPTER"
    | "MISSING_CHAPTER"
    | "DUPLICATE_CHAPTER"
    | "UNKNOWN_ITEM"
    | "UNSUPPORTED_POSITION"
    | "UNSUPPORTED_HOUSE"
    | "UNSUPPORTED_ASPECT"
    | "UNSUPPORTED_DEGREE"
    | "FORBIDDEN_LANGUAGE"
    | "MISSING_CAVEAT";
  chapter?: ChapterId;
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

const POINT_BY_NAME: Record<string, Body | "asc" | "mc"> = {
  ...Object.fromEntries(
    Object.entries(BODY_NAMES).map(([k, v]) => [v.toLowerCase(), k as Body]),
  ),
  ascendente: "asc",
  "meio do céu": "mc",
};
const SIGN_BY_NAME = Object.fromEntries(
  Object.entries(SIGN_NAMES).map(([k, v]) => [v.toLowerCase(), k as Sign]),
);
const ASPECT_BY_NAME = Object.fromEntries(
  Object.entries(ASPECT_NAMES).map(([k, v]) => [
    v.toLowerCase(),
    k as AspectType,
  ]),
);

const POSITION_RE = new RegExp(
  `${word(Object.keys(POINT_BY_NAME))}\\s+(?:em|no signo de)\\s+${word(Object.keys(SIGN_BY_NAME))}`,
  "giu",
);
const HOUSE_RE = /(?<!\p{L})casas?\s+(\d{1,2})(?!\d)/giu;
const ASPECT_RE = new RegExp(word(Object.keys(ASPECT_BY_NAME)), "giu");
const DEGREE_RE = /\d{1,2}°(?:\s?\d{1,2}′)?/gu;

/** Linguagem determinista ou clínica, proibida no produto. */
export const FORBIDDEN_PATTERNS: readonly RegExp[] = [
  /(?<!\p{L})com certeza(?!\p{L})/iu,
  /(?<!\p{L})certamente(?!\p{L})/iu,
  /(?<!\p{L})comprovad[oa]s?(?!\p{L})/iu,
  /(?<!\p{L})cientificamente(?!\p{L})/iu,
  /(?<!\p{L})garant\p{L}*/iu,
  /(?<!\p{L})diagn[oó]stic\p{L}*/iu,
  /(?<!\p{L})seu destino(?!\p{L})/iu,
  /(?<!\p{L})você (?:vai|irá)(?!\p{L})/iu,
  /(?<!\p{L})sempre será(?!\p{L})/iu,
];

const CAVEAT_RE = /reserva|incert|não se mantém|pode não/iu;

/** Pares (corpo, signo), casas e aspectos que os fatos citados sustentam. */
function supportOf(facts: Fact[]) {
  const positions = new Set<string>();
  const houses = new Set<number>();
  const aspects = new Set<AspectType>();
  for (const f of facts) {
    if ((f.kind === "body-sign" || f.kind === "angle-sign") && f.sign)
      positions.add(`${f.bodies[0]}:${f.sign}`);
    if (f.kind === "chart-ruler") {
      positions.add(`asc:${f.values.ascSign}`);
      positions.add(`${f.values.ruler}:${f.values.rulerSign}`);
      if (typeof f.values.rulerHouse === "number")
        houses.add(f.values.rulerHouse);
    }
    if (f.kind === "body-house" && f.house) houses.add(f.house);
    if (f.kind === "cusp-sign" && f.house) houses.add(f.house);
    if (f.kind === "aspect" && f.aspect) aspects.add(f.aspect.type);
  }
  return { positions, houses, aspects };
}

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
      const facts = valid.flatMap((i) =>
        i.factIds.map((id) => factById.get(id)!),
      );
      const support = supportOf(facts);
      const observations = valid.map((i) => i.observation).join(" ");

      for (const m of p.text.matchAll(POSITION_RE)) {
        const point = POINT_BY_NAME[m[1].toLowerCase()];
        const sign = SIGN_BY_NAME[m[2].toLowerCase()];
        if (!support.positions.has(`${point}:${sign}`))
          errors.push({
            code: "UNSUPPORTED_POSITION",
            ...at,
            message: `"${m[0]}" não consta nos itens citados.`,
          });
      }
      for (const m of p.text.matchAll(HOUSE_RE))
        if (!support.houses.has(Number(m[1])))
          errors.push({
            code: "UNSUPPORTED_HOUSE",
            ...at,
            message: `"${m[0]}" não consta nos itens citados.`,
          });
      for (const m of p.text.matchAll(ASPECT_RE))
        if (!support.aspects.has(ASPECT_BY_NAME[m[1].toLowerCase()]))
          errors.push({
            code: "UNSUPPORTED_ASPECT",
            ...at,
            message: `"${m[0]}" não consta nos itens citados.`,
          });
      for (const m of p.text.matchAll(DEGREE_RE))
        if (!observations.includes(m[0].replace(/\s/g, "")))
          errors.push({
            code: "UNSUPPORTED_DEGREE",
            ...at,
            message: `Grau "${m[0]}" não consta nas observações citadas.`,
          });
      for (const re of FORBIDDEN_PATTERNS) {
        const m = p.text.match(re);
        if (m)
          errors.push({
            code: "FORBIDDEN_LANGUAGE",
            ...at,
            message: `Linguagem determinista ou clínica: "${m[0]}".`,
          });
      }
      if (
        valid.some((i) => i.certainty === "uncertain") &&
        !CAVEAT_RE.test(p.text)
      )
        errors.push({
          code: "MISSING_CAVEAT",
          ...at,
          message: "Parágrafo cita item incerto sem manter a ressalva.",
        });
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
