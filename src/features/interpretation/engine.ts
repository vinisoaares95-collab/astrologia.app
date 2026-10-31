/**
 * Motor de interpretação (Fase 02E).
 *
 * ChartView → fatos (facts.ts) → candidatos por capítulo (chapters.ts) →
 * seleção global (cada fato vai para um único capítulo, sem textos
 * repetidos, com limite de itens e de repetição de corpos) → relatório
 * rastreável. Determinístico: a mesma entrada gera sempre a mesma saída.
 */
import type { AspectType, Body } from "../astrology/domain/types";
import type { ChartView } from "../natal-chart/contract";
import {
  CHAPTERS,
  MAX_ITEMS_PER_BODY,
  MAX_ITEMS_PER_CHAPTER,
} from "./chapters";
import type {
  ChapterId,
  ChapterInterpretation,
  Fact,
  InterpretationItem,
  InterpretationReport,
  NarrativeTension,
} from "./contract";
import { extractFacts } from "./facts";
import { AUTHORED } from "./library/authored";
import {
  ASPECT_MEANINGS,
  BODY_MEANINGS,
  HOUSE_MEANINGS,
  OUTER_BODIES,
  POINT_THEMES,
  SIGN_MEANINGS,
  type ToneTag,
} from "./library/base";

export const INTERPRETATION_VERSION = "02e.1";

export const DISCLAIMER =
  "As posições astronômicas deste relatório são calculadas. Os significados atribuídos a elas são interpretações simbólicas da tradição da astrologia ocidental tropical — não são fatos científicos, diagnósticos nem previsões.";

/** Aspectos que não se mantêm em toda a janela entram com metade do peso. */
const UNCERTAIN_ASPECT_FACTOR = 0.5;
const UNCERTAIN_ASPECT_CAVEAT =
  "Este aspecto não se mantém em toda a janela de horário informada; considere-o com reserva.";

const AXIS_LABELS: Record<string, string> = {
  ritmo: "ritmo (impulso × cautela)",
  expressao: "expressão (expansiva × reservada)",
  foco: "foco (mudança × estabilidade)",
  vinculo: "vínculo (autonomia × proximidade)",
};

type Point = Body | "asc" | "mc";

const ASPECT_ARTICLE: Record<AspectType, "o" | "a"> = {
  conjunction: "a",
  sextile: "o",
  trine: "o",
  square: "a",
  opposition: "a",
};

const named = (p: Point) =>
  p === "sun"
    ? "o Sol"
    : p === "moon"
      ? "a Lua"
      : p === "asc"
        ? "o Ascendente"
        : p === "mc"
          ? "o Meio do Céu"
          : BODY_MEANINGS[p].name;

const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1);

/** Preposição "a" + artigo: "a a" → "à", "a os" → "aos". */
function toPrep(phrase: string): string {
  const [first, ...rest] = phrase.split(" ");
  const contracted = { a: "à", as: "às", o: "ao", os: "aos" }[first];
  return contracted ? [contracted, ...rest].join(" ") : `a ${phrase}`;
}

function retroKey(body: Body) {
  return OUTER_BODIES.includes(body) ? "retro:outer" : `retro:${body}`;
}

/** Chave editorial do fato (a mesma chave usada em library/authored.ts). */
export function entryKeyFor(fact: Fact): string {
  const [first] = fact.bodies;
  switch (fact.kind) {
    case "body-sign":
    case "angle-sign":
      return `sign:${first}:${fact.sign}`;
    case "body-house":
      return `house:${first}:${fact.house}`;
    case "body-retrograde":
      return retroKey(first as Body);
    case "aspect":
      return `aspect:${[...fact.bodies].sort().join("-")}:${ASPECT_MEANINGS[fact.aspect!.type].nature}`;
    case "cusp-sign":
      return `cusp:${fact.house}:${fact.sign}`;
    case "chart-ruler":
      return `ruler:${fact.values.ruler}:${fact.sign}`;
    case "element-dominant":
    case "element-absent":
      return `${fact.kind}:${fact.values.element}`;
  }
}

/** Texto composto a partir dos significados de base (sem texto autoral). */
function composeText(fact: Fact): string {
  const [first, second] = fact.bodies;
  const sign = fact.sign ? SIGN_MEANINGS[fact.sign] : null;
  switch (fact.kind) {
    case "body-sign":
    case "angle-sign": {
      const theme =
        first === "asc"
          ? "a forma de se apresentar ao mundo"
          : first === "mc"
            ? "a vocação e a imagem pública"
            : BODY_MEANINGS[first as Body].function;
      return `Com ${named(first)} em ${sign!.name}, a tradição associa ${theme} a temas como ${sign!.qualities}.`;
    }
    case "body-house":
      return `Com ${named(first)} na casa ${fact.house}, a tradição associa ${BODY_MEANINGS[first as Body].function} ${toPrep(HOUSE_MEANINGS[fact.house!].area)}.`;
    case "body-retrograde":
      return `${capitalize(named(first))} retrógrado é associado, na tradição, a uma vivência mais interiorizada de ${BODY_MEANINGS[first as Body].function}.`;
    case "aspect": {
      const meaning = ASPECT_MEANINGS[fact.aspect!.type];
      return `Na tradição, ${ASPECT_ARTICLE[fact.aspect!.type]} ${meaning.name.toLowerCase()} entre ${named(first)} e ${named(second)} sugere que ${POINT_THEMES[first]} e ${POINT_THEMES[second]} ${meaning.dynamic}.`;
    }
    case "cusp-sign": {
      const label =
        fact.house === 7
          ? " (Descendente)"
          : fact.house === 4
            ? " (Fundo do Céu)"
            : "";
      return `Com a cúspide da casa ${fact.house}${label} em ${sign!.name}, a tradição associa ${HOUSE_MEANINGS[fact.house!].area} a temas como ${sign!.qualities}.`;
    }
    case "chart-ruler": {
      const ruler = fact.values.ruler as Body;
      const house =
        typeof fact.values.rulerHouse === "number"
          ? `, na casa ${fact.values.rulerHouse}`
          : "";
      return `Com o Ascendente em ${SIGN_MEANINGS[fact.values.ascSign as keyof typeof SIGN_MEANINGS].name}, o regente tradicional do mapa é ${named(ruler)}. A tradição sugere que ${BODY_MEANINGS[ruler].function} — aqui em ${sign!.name}${house} — ganha peso especial na condução da sua trajetória.`;
    }
    case "element-dominant":
    case "element-absent":
      // Todas as chaves de elemento são autorais; não há composição.
      throw new Error(`Texto autoral ausente para ${entryKeyFor(fact)}`);
  }
}

function tagsFor(fact: Fact, authoredTags?: ToneTag[]): ToneTag[] {
  if (authoredTags) return authoredTags;
  if (
    (fact.kind === "body-sign" || fact.kind === "angle-sign") &&
    fact.sign &&
    fact.bodies[0] !== "mc"
  )
    return SIGN_MEANINGS[fact.sign].tags;
  return [];
}

type Candidate = { chapter: ChapterId; fact: Fact; score: number };

/**
 * Fatos incertos que não são aspectos não são interpretados: viram
 * limitações. Aspectos incertos entram com peso reduzido e ressalva.
 */
function candidates(facts: Fact[]): {
  list: Candidate[];
  excluded: Candidate[];
} {
  const list: Candidate[] = [];
  const excluded: Candidate[] = [];
  for (const fact of facts) {
    let best: Candidate | null = null;
    for (const chapter of CHAPTERS) {
      const raw = chapter.rule(fact);
      if (raw === null) continue;
      const score =
        fact.certainty === "uncertain" ? raw * UNCERTAIN_ASPECT_FACTOR : raw;
      const c = {
        chapter: chapter.id,
        fact,
        score: Math.round(score * 100) / 100,
      };
      if (fact.certainty === "uncertain" && fact.kind !== "aspect") {
        if (!best || c.score > best.score) best = c;
        continue;
      }
      list.push(c);
    }
    if (best) excluded.push(best);
  }
  const order = new Map(CHAPTERS.map((c, i) => [c.id, i]));
  list.sort(
    (x, y) =>
      y.score - x.score ||
      order.get(x.chapter)! - order.get(y.chapter)! ||
      x.fact.id.localeCompare(y.fact.id),
  );
  return { list, excluded };
}

function tensionsOf(items: InterpretationItem[]): NarrativeTension[] {
  const seen = new Map<string, { value: string; itemId: string }>();
  const out: NarrativeTension[] = [];
  const done = new Set<string>();
  for (const item of items) {
    for (const tag of item.tags) {
      const [axis, value] = tag.split(":");
      const prev = seen.get(axis);
      if (!prev) {
        seen.set(axis, { value, itemId: item.id });
      } else if (prev.value !== value && !done.has(axis)) {
        done.add(axis);
        out.push({
          axis,
          itemIds: [prev.itemId, item.id],
          note: `Estes itens apontam para lados diferentes do eixo ${AXIS_LABELS[axis]}. A redação deve apresentá-los como facetas que convivem, não como contradição a resolver nem como erro.`,
        });
      }
    }
  }
  return out;
}

function limitationsFor(
  chart: ChartView,
  chapterId: ChapterId,
  facts: Fact[],
  excluded: Candidate[],
): string[] {
  const def = CHAPTERS.find((c) => c.id === chapterId)!;
  const out: string[] = [];
  const has = (prefix: string) => facts.some((f) => f.id.startsWith(prefix));

  if (def.core.includes("angle-sign:asc") && !has("angle-sign:asc"))
    out.push(
      "Ascendente e regente do mapa não considerados: o horário de nascimento é desconhecido.",
    );
  if (
    def.core.includes("angle-sign:asc") &&
    has("angle-sign:asc") &&
    !has("chart-ruler")
  )
    out.push(
      "Regente do mapa não considerado: o signo do Ascendente varia dentro da janela de horário.",
    );
  if (chapterId === "talentos" && !chart.angles)
    out.push(
      "Meio do Céu não considerado: o horário de nascimento é desconhecido.",
    );
  if (def.usesHouses && !chart.houses)
    out.push(
      chart.precision === "unknown"
        ? "Casas não consideradas: sem horário de nascimento, elas não podem ser calculadas."
        : "Casas e cúspides não consideradas: com horário aproximado, só entram posições em casas que não mudam dentro da janela.",
    );
  const mine = excluded.filter((x) => x.chapter === chapterId);
  // Casas variáveis viram uma única linha por capítulo.
  const houses = mine.filter((x) => x.fact.kind === "body-house");
  if (houses.length)
    out.push(
      `Casas que mudam dentro da janela de horário (não interpretadas): ${houses
        .map(
          (x) =>
            `${named(x.fact.bodies[0])} (casas ${String(x.fact.values.houses).split(",").join(", ")})`,
        )
        .join("; ")}.`,
    );
  for (const c of mine.filter((x) => x.fact.kind !== "body-house"))
    out.push(
      `Não interpretado por incerteza do horário: ${c.fact.observation}`,
    );
  return out;
}

export function buildInterpretation(chart: ChartView): InterpretationReport {
  const facts = extractFacts(chart);
  const { list, excluded } = candidates(facts);

  const chosen = new Map<ChapterId, InterpretationItem[]>(
    CHAPTERS.map((c) => [c.id, []]),
  );
  const bodyCount = new Map<string, number>();
  const usedFacts = new Set<string>();
  const byEntryKey = new Map<string, InterpretationItem>();

  for (const { chapter, fact, score } of list) {
    if (usedFacts.has(fact.id)) continue;
    const key = entryKeyFor(fact);

    // Mesmo texto (ex.: dois planetas lentos retrógrados): agrupa no item
    // já existente, mantendo a rastreabilidade de todos os fatos.
    const existing = byEntryKey.get(key);
    if (existing) {
      existing.factIds.push(fact.id);
      existing.observation += ` ${fact.observation}`;
      usedFacts.add(fact.id);
      continue;
    }

    const items = chosen.get(chapter)!;
    if (items.length >= MAX_ITEMS_PER_CHAPTER) continue;
    // Fatos de elemento são agregados: não contam como repetição de corpo.
    const counted = fact.kind.startsWith("element-")
      ? []
      : fact.bodies.filter((b) => b !== "asc" && b !== "mc");
    if (
      counted.some(
        (b) => (bodyCount.get(`${chapter}:${b}`) ?? 0) >= MAX_ITEMS_PER_BODY,
      )
    )
      continue;

    const authored = AUTHORED[key];
    const item: InterpretationItem = {
      id: `${chapter}:${fact.id}`,
      entryKey: key,
      origin: authored ? "authored" : "composed",
      factIds: [fact.id],
      certainty: fact.certainty,
      observation: fact.observation,
      symbolic: authored ? authored.text : composeText(fact),
      caveat: fact.certainty === "uncertain" ? UNCERTAIN_ASPECT_CAVEAT : null,
      score,
      tags: tagsFor(fact, authored?.tags),
    };
    items.push(item);
    byEntryKey.set(key, item);
    usedFacts.add(fact.id);
    for (const b of counted)
      bodyCount.set(
        `${chapter}:${b}`,
        (bodyCount.get(`${chapter}:${b}`) ?? 0) + 1,
      );
  }

  const chapters: ChapterInterpretation[] = CHAPTERS.map((def) => {
    const items = chosen.get(def.id)!;
    return {
      id: def.id,
      number: def.number,
      title: def.title,
      items,
      limitations: limitationsFor(chart, def.id, facts, excluded),
      tensions: tensionsOf(items),
    };
  });

  return {
    version: INTERPRETATION_VERSION,
    disclaimer: DISCLAIMER,
    chapters,
    facts,
    basis: {
      precision: chart.precision,
      calcVersion: chart.parameters.calcVersion,
      houseSystem: chart.parameters.houseSystem,
      zodiac: chart.parameters.zodiac,
      rulership: "traditional",
    },
  };
}
