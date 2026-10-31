import { BODIES, type Body, type Sign } from "../astrology/domain/types";
import type { ChartView } from "../natal-chart/contract";
import {
  BODY_NAMES,
  POINT_NAMES,
  SIGN_NAMES,
  formatDegree,
  formatPosition,
} from "../natal-chart/labels";
import type { Fact } from "./contract";
import {
  ASPECT_MEANINGS,
  ELEMENT_NAMES,
  SIGN_MEANINGS,
  TRADITIONAL_RULER,
  type Element,
} from "./library/base";

const SIGN_ORDER = Object.keys(SIGN_MEANINGS) as Sign[];
const signAt = (lon: number) =>
  SIGN_ORDER[Math.floor((((lon % 360) + 360) % 360) / 30)];
const num = (n: number, digits = 2) => n.toFixed(digits).replace(".", ",");

/** Elemento com 4+ dos 10 corpos é "enfatizado"; com 0, "ausente". */
export const ELEMENT_DOMINANT_MIN = 4;

/**
 * Extrai fatos verificáveis do mapa calculado. Nada aqui é interpretado:
 * cada fato copia valores do ChartView e registra de onde vieram.
 * Fatos impossíveis de determinar (ex.: casas sem horário) não são criados.
 */
export function extractFacts(chart: ChartView): Fact[] {
  const facts: Fact[] = [];
  const byBody = new Map(chart.bodies.map((b) => [b.body, b]));

  for (const b of chart.bodies) {
    const name = BODY_NAMES[b.body];
    const from =
      b.range &&
      formatPosition({ sign: signAt(b.range.start), ...degMin(b.range.start) });
    const to =
      b.range &&
      formatPosition({ sign: signAt(b.range.end), ...degMin(b.range.end) });
    const rangeNote =
      from && to && from !== to
        ? ` (na janela de incerteza, entre ${from} e ${to})`
        : "";
    facts.push({
      id: `body-sign:${b.body}`,
      kind: "body-sign",
      certainty: b.range?.crossesSign ? "uncertain" : "determined",
      bodies: [b.body],
      sign: b.sign,
      values: {
        sign: b.sign,
        degree: b.degree,
        minute: b.minute,
        longitude: Number(b.longitude.toFixed(4)),
        rangeStart: b.range ? Number(b.range.start.toFixed(4)) : null,
        rangeEnd: b.range ? Number(b.range.end.toFixed(4)) : null,
      },
      source: [
        `bodies.${b.body}.longitude`,
        `bodies.${b.body}.sign`,
        ...(b.range ? [`bodies.${b.body}.range`] : []),
      ],
      observation: `${name} a ${formatPosition(b)}${rangeNote}.`,
    });

    if (b.house !== null) {
      facts.push({
        id: `body-house:${b.body}`,
        kind: "body-house",
        certainty: "determined",
        bodies: [b.body],
        house: b.house,
        values: { house: b.house },
        source: [`bodies.${b.body}.house`],
        observation: `${name} na casa ${b.house} (Placidus).`,
      });
    } else if (b.houseVaries) {
      facts.push({
        id: `body-house:${b.body}`,
        kind: "body-house",
        certainty: "uncertain",
        bodies: [b.body],
        values: { houses: b.houseVaries.join(",") },
        source: [`bodies.${b.body}.houseVaries`],
        observation: `${name} passa pelas casas ${b.houseVaries.join(", ")} dentro da janela de incerteza.`,
      });
    }

    if (
      (b.retrograde || b.motionVaries) &&
      b.body !== "sun" &&
      b.body !== "moon"
    ) {
      facts.push({
        id: `body-retrograde:${b.body}`,
        kind: "body-retrograde",
        certainty: b.motionVaries ? "uncertain" : "determined",
        bodies: [b.body],
        values: { speed: Number(b.speed.toFixed(4)), retrograde: b.retrograde },
        source: [`bodies.${b.body}.speed`, `bodies.${b.body}.retrograde`],
        observation: b.motionVaries
          ? `${name} muda de direção (estação) dentro da janela de incerteza.`
          : `${name} em movimento retrógrado (${num(b.speed, 4)}°/dia).`,
      });
    }
  }

  if (chart.angles) {
    for (const key of ["asc", "mc"] as const) {
      const a = chart.angles[key];
      facts.push({
        id: `angle-sign:${key}`,
        kind: "angle-sign",
        certainty: a.range?.crossesSign ? "uncertain" : "determined",
        bodies: [key],
        sign: a.sign,
        values: {
          sign: a.sign,
          degree: a.degree,
          minute: a.minute,
          longitude: Number(a.longitude.toFixed(4)),
        },
        source: [
          `angles.${key}.longitude`,
          ...(a.range ? [`angles.${key}.range`] : []),
        ],
        observation: a.range
          ? `${POINT_NAMES[key]} em ${SIGN_NAMES[a.sign]} no centro da janela (${formatDegree(a.degree, a.minute)}), variando ${num(a.range.width, 1)}° na janela.`
          : `${POINT_NAMES[key]} a ${formatPosition(a)}.`,
      });
    }
  }

  if (chart.houses) {
    for (const n of [3, 4, 7] as const) {
      const c = chart.houses.cusps[n - 1];
      facts.push({
        id: `cusp-sign:${n}`,
        kind: "cusp-sign",
        certainty: "determined",
        bodies: [],
        sign: c.sign,
        house: n,
        values: { house: n, sign: c.sign, degree: c.degree, minute: c.minute },
        source: [`houses.cusps.${n - 1}`],
        observation: `Cúspide da casa ${n}${n === 7 ? " (Descendente)" : n === 4 ? " (Fundo do Céu)" : ""} a ${formatPosition(c)}.`,
      });
    }
  }

  for (const a of chart.aspects) {
    const pair = [a.a, a.b].sort();
    facts.push({
      id: `aspect:${pair.join("-")}:${a.type}`,
      kind: "aspect",
      certainty: a.uncertain ? "uncertain" : "determined",
      bodies: [a.a, a.b],
      aspect: {
        type: a.type,
        orb: Number(a.orb.toFixed(4)),
        applying: a.applying,
      },
      values: {
        a: a.a,
        b: a.b,
        type: a.type,
        orb: Number(a.orb.toFixed(4)),
        applying: a.applying,
      },
      source: [`aspects.${a.a}-${a.b}-${a.type}`],
      observation: `${POINT_NAMES[a.a]} em ${ASPECT_MEANINGS[a.type].name.toLowerCase()} com ${POINT_NAMES[a.b]} (orbe ${num(a.orb)}°${a.applying === null ? "" : a.applying ? ", aplicativo" : ", separativo"})${a.uncertain ? ", não presente em toda a janela de incerteza" : ""}.`,
    });
  }

  // Regente do mapa: só com Ascendente em signo determinado.
  const asc = facts.find((f) => f.id === "angle-sign:asc");
  if (asc && asc.certainty === "determined" && chart.angles) {
    const ruler = TRADITIONAL_RULER[chart.angles.asc.sign];
    const r = byBody.get(ruler)!;
    const rulerSignFact = facts.find((f) => f.id === `body-sign:${ruler}`)!;
    facts.push({
      id: `chart-ruler:${ruler}`,
      kind: "chart-ruler",
      certainty: rulerSignFact.certainty,
      bodies: ["asc", ruler],
      sign: r.sign,
      house: r.house ?? undefined,
      values: {
        ascSign: chart.angles.asc.sign,
        ruler,
        rulerSign: r.sign,
        rulerHouse: r.house,
      },
      source: [
        "angles.asc.sign",
        `bodies.${ruler}.sign`,
        `bodies.${ruler}.house`,
      ],
      observation: `O Ascendente em ${SIGN_NAMES[chart.angles.asc.sign]} tem como regente tradicional ${BODY_NAMES[ruler]}, a ${formatPosition(r)}${r.house ? `, na casa ${r.house}` : ""}.`,
    });
  }

  // Equilíbrio de elementos nos 10 corpos, com mínimo e máximo possíveis
  // quando algum corpo pode ter mudado de signo dentro da janela.
  const elements: Element[] = ["fire", "earth", "air", "water"];
  for (const el of elements) {
    const sure: Body[] = [];
    const maybe: Body[] = [];
    for (const body of BODIES) {
      const b = byBody.get(body)!;
      const possible = b.range?.crossesSign
        ? [signAt(b.range.start), signAt(b.range.end)]
        : [b.sign];
      const hits = possible.filter(
        (s) => SIGN_MEANINGS[s].element === el,
      ).length;
      if (hits === possible.length) sure.push(body);
      else if (hits > 0) maybe.push(body);
    }
    const min = sure.length;
    const max = sure.length + maybe.length;
    const names = (list: Body[]) => list.map((x) => BODY_NAMES[x]).join(", ");
    const base = {
      bodies: [...sure, ...maybe],
      values: { element: el, count: min, maxCount: max },
      source: BODIES.map((x) => `bodies.${x}.sign`),
    };
    if (max >= ELEMENT_DOMINANT_MIN) {
      facts.push({
        ...base,
        id: `element-dominant:${el}`,
        kind: "element-dominant",
        certainty: min >= ELEMENT_DOMINANT_MIN ? "determined" : "uncertain",
        observation: `${min === max ? min : `${min} a ${max}`} de 10 corpos em signos de ${ELEMENT_NAMES[el]}: ${names([...sure, ...maybe])}.`,
      });
    }
    if (min === 0) {
      facts.push({
        ...base,
        id: `element-absent:${el}`,
        kind: "element-absent",
        certainty: max === 0 ? "determined" : "uncertain",
        observation:
          max === 0
            ? `Nenhum dos 10 corpos em signos de ${ELEMENT_NAMES[el]}.`
            : `Nenhum corpo certamente em signos de ${ELEMENT_NAMES[el]} (${names(maybe)} pode estar).`,
      });
    }
  }

  return facts;
}

function degMin(lon: number) {
  const within = (((lon % 360) + 360) % 360) % 30;
  const degree = Math.floor(within);
  return { degree, minute: Math.floor((within - degree) * 60) };
}
