/**
 * Regras dos cinco capítulos astrológicos.
 *
 * Cada regra recebe um fato e devolve um peso (ou null, quando o fato não
 * pertence ao capítulo). O motor distribui cada fato para UM capítulo só —
 * o de maior peso —, então os pesos também decidem onde um tema aparece.
 */
import type { Body } from "../astrology/domain/types";
import type { ChapterId, Fact } from "./contract";
import { ASPECT_MEANINGS, OUTER_BODIES } from "./library/base";

export type ChapterDef = {
  id: ChapterId;
  number: number;
  title: string;
  rule: (fact: Fact) => number | null;
  /** Fatos centrais: se faltarem ou forem incertos, o capítulo registra a limitação. */
  core: string[];
  /** O capítulo usa casas (gera limitação quando não há casas determinadas). */
  usesHouses: boolean;
};

export const MAX_ITEMS_PER_CHAPTER = 6;
/** Um mesmo corpo aparece em no máximo N itens de um capítulo. */
export const MAX_ITEMS_PER_BODY = 4;
const ANGULAR_HOUSES = new Set([1, 4, 7, 10]);

/** Aspectos mais exatos pesam mais: 1,0 com orbe 0° e 0,4 com orbe 10°. */
export function tightness(fact: Fact): number {
  const orb = fact.aspect?.orb ?? 10;
  return 0.4 + 0.6 * (1 - Math.min(orb, 10) / 10);
}

const is = (f: Fact, kind: Fact["kind"], body?: Body | "asc" | "mc") =>
  f.kind === kind && (body === undefined || f.bodies[0] === body);
const involves = (f: Fact, ...bodies: (Body | "asc" | "mc")[]) =>
  f.kind === "aspect" && f.bodies.some((b) => bodies.includes(b));
const element = (f: Fact) => f.values.element;
const nature = (f: Fact) =>
  f.aspect ? ASPECT_MEANINGS[f.aspect.type].nature : null;
const outerOnly = (f: Fact) =>
  f.bodies.every((b) => OUTER_BODIES.includes(b as Body));

export const CHAPTERS: ChapterDef[] = [
  {
    id: "identidade",
    number: 1,
    title: "Sua identidade astrológica",
    core: ["body-sign:sun", "angle-sign:asc"],
    usesHouses: true,
    rule(f) {
      if (is(f, "body-sign", "sun")) return 100;
      if (is(f, "angle-sign", "asc")) return 95;
      if (is(f, "body-house", "sun"))
        return 70 * (ANGULAR_HOUSES.has(f.house ?? 0) ? 1.2 : 1);
      if (f.kind === "chart-ruler") return 65;
      if (involves(f, "sun")) return 50 * tightness(f);
      if (involves(f, "asc")) return 35 * tightness(f);
      if (f.kind === "element-dominant") return 40;
      return null;
    },
  },
  {
    id: "emocional",
    number: 2,
    title: "Seu mundo emocional",
    core: ["body-sign:moon"],
    usesHouses: true,
    rule(f) {
      if (is(f, "body-sign", "moon")) return 100;
      if (is(f, "body-house", "moon")) return 75;
      if (involves(f, "moon")) return 60 * tightness(f);
      if (f.kind === "cusp-sign" && f.house === 4) return 45;
      if (f.kind === "element-dominant" && element(f) === "water") return 45;
      if (f.kind === "element-absent" && element(f) === "water") return 40;
      return null;
    },
  },
  {
    id: "mente",
    number: 3,
    title: "Sua mente e comunicação",
    core: ["body-sign:mercury"],
    usesHouses: true,
    rule(f) {
      if (is(f, "body-sign", "mercury")) return 100;
      if (is(f, "body-house", "mercury")) return 70;
      if (is(f, "body-retrograde", "mercury")) return 65;
      if (involves(f, "mercury")) return 55 * tightness(f);
      if (f.kind === "element-dominant" && element(f) === "air") return 45;
      if (f.kind === "cusp-sign" && f.house === 3) return 40;
      if (f.kind === "element-absent" && element(f) === "air") return 40;
      return null;
    },
  },
  {
    id: "relacionamentos",
    number: 4,
    title: "Seus relacionamentos e vínculos",
    core: ["body-sign:venus", "body-sign:mars"],
    usesHouses: true,
    rule(f) {
      if (is(f, "body-sign", "venus")) return 100;
      if (is(f, "body-sign", "mars")) return 80;
      if (f.kind === "cusp-sign" && f.house === 7) return 75;
      if (is(f, "body-house", "venus")) return 60;
      if (involves(f, "venus", "mars")) return 55 * tightness(f);
      if (is(f, "body-retrograde", "venus")) return 50;
      if (is(f, "body-house", "mars")) return 45;
      if (is(f, "body-retrograde", "mars")) return 40;
      return null;
    },
  },
  {
    id: "talentos",
    number: 5,
    title: "Seus talentos e desafios",
    core: ["body-sign:jupiter", "body-sign:saturn"],
    usesHouses: true,
    rule(f) {
      if (is(f, "body-sign", "saturn")) return 75;
      if (is(f, "body-sign", "jupiter")) return 70;
      if (is(f, "body-house", "jupiter") || is(f, "body-house", "saturn"))
        return 60;
      if (is(f, "angle-sign", "mc")) return 55;
      if (involves(f, "mc")) return 50 * tightness(f);
      // Aspectos entre corpos lentos são geracionais: não individualizam.
      if (f.kind === "aspect" && !outerOnly(f))
        return (nature(f) === "tense" ? 42 : 45) * tightness(f);
      if (f.kind === "element-absent") return 45;
      if (f.kind === "element-dominant") return 35;
      if (
        is(f, "body-retrograde", "jupiter") ||
        is(f, "body-retrograde", "saturn")
      )
        return 30;
      if (f.kind === "body-house" && outerOnly(f)) return 25;
      if (f.kind === "body-retrograde" && outerOnly(f)) return 5;
      return null;
    },
  },
];
