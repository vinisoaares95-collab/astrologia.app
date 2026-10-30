import { normalizeDegrees } from "../astrology/domain/zodiac";

/*
 * Convenção geométrica da mandala (documentada em docs/fase-02d-mandala-natal.md):
 * - o ponto de orientação (Ascendente, ou 0° Áries sem horário) fica às 9 h;
 * - a longitude eclíptica cresce no sentido ANTI-HORÁRIO;
 * - ângulo de tela θ = 180° + (λ − orientação), em graus a partir do eixo +x,
 *   anti-horário; em SVG (y para baixo): x = cx + r·cos θ, y = cy − r·sen θ.
 * Assim, com Ascendente à esquerda, as casas 1–3 ficam abaixo do horizonte e
 * o Meio do Céu na metade superior — a convenção da astrologia ocidental.
 */

export const WHEEL = {
  size: 1000,
  center: 500,
  rOuter: 448, // borda externa do anel do zodíaco
  rZodiacInner: 378, // borda interna do zodíaco (escala de graus)
  rHouseInner: 330, // borda interna do anel das casas
  rPlanet: 276, // centro dos símbolos dos planetas
  rDegreeLabel: 232, // graus ao lado dos símbolos
  rAspect: 188, // círculo dos aspectos
  rAxisLabel: 474, // rótulos ASC, MC, DSC, IC
} as const;

export type Point = { x: number; y: number };

/** Ângulo de tela (graus, anti-horário a partir de +x) de uma longitude. */
export function screenAngle(longitude: number, orientation: number): number {
  return normalizeDegrees(180 + longitude - orientation);
}

export function polarToPoint(radius: number, angleDeg: number): Point {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: WHEEL.center + radius * Math.cos(rad),
    y: WHEEL.center - radius * Math.sin(rad),
  };
}

export function pointAt(
  longitude: number,
  radius: number,
  orientation: number,
): Point {
  return polarToPoint(radius, screenAngle(longitude, orientation));
}

/** Longitude representada por um ponto da tela (inversa de pointAt). */
export function longitudeAtPoint(point: Point, orientation: number): number {
  const angle =
    (Math.atan2(WHEEL.center - point.y, point.x - WHEEL.center) * 180) /
    Math.PI;
  return normalizeDegrees(angle - 180 + orientation);
}

const fmt = (n: number) => Number(n.toFixed(2));

/**
 * Setor anelar de `fromLon` a `toLon`, no sentido de longitude crescente
 * (anti-horário na tela). Em SVG, anti-horário corresponde a sweep-flag 0.
 */
export function annularSectorPath(
  rOuter: number,
  rInner: number,
  fromLon: number,
  toLon: number,
  orientation: number,
): string {
  const span = normalizeDegrees(toLon - fromLon) || 360;
  const large = span > 180 ? 1 : 0;
  const a = pointAt(fromLon, rOuter, orientation);
  const b = pointAt(fromLon + span, rOuter, orientation);
  const c = pointAt(fromLon + span, rInner, orientation);
  const d = pointAt(fromLon, rInner, orientation);
  return [
    `M${fmt(a.x)} ${fmt(a.y)}`,
    `A${rOuter} ${rOuter} 0 ${large} 0 ${fmt(b.x)} ${fmt(b.y)}`,
    `L${fmt(c.x)} ${fmt(c.y)}`,
    `A${rInner} ${rInner} 0 ${large} 1 ${fmt(d.x)} ${fmt(d.y)}`,
    "Z",
  ].join(" ");
}

export type GlyphPlacement<T extends string> = {
  id: T;
  longitude: number; // posição real
  displayLongitude: number; // posição do símbolo após afastar sobreposições
};

/**
 * Afasta símbolos próximos para não se sobreporem, mantendo a ordem zodiacal
 * e o centro de cada grupo na média das posições reais. A posição REAL de
 * cada corpo continua marcada pela marca na escala de graus.
 */
export function layoutGlyphs<T extends string>(
  items: { id: T; longitude: number }[],
  minGap: number,
): GlyphPlacement<T>[] {
  if (items.length === 0) return [];
  const sorted = [...items].sort(
    (a, b) => normalizeDegrees(a.longitude) - normalizeDegrees(b.longitude),
  );
  // Corta o círculo no maior vão, para tratar a sequência de forma linear.
  let cut = 0;
  let largest = -1;
  sorted.forEach((item, i) => {
    const next = sorted[(i + 1) % sorted.length];
    const gap =
      normalizeDegrees(next.longitude - item.longitude) ||
      (sorted.length === 1 ? 360 : 0);
    if (gap > largest) {
      largest = gap;
      cut = (i + 1) % sorted.length;
    }
  });
  const ordered = [...sorted.slice(cut), ...sorted.slice(0, cut)];
  const base = ordered[0].longitude;
  const unwrapped = ordered.map(
    (item) => base + normalizeDegrees(item.longitude - base),
  );

  type Cluster = { members: number[]; positions: number[] };
  const clusters: Cluster[] = unwrapped.map((p, i) => ({
    members: [i],
    positions: [p],
  }));
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < clusters.length - 1; i++) {
      const left = clusters[i];
      const right = clusters[i + 1];
      if (
        right.positions[0] - left.positions[left.positions.length - 1] <
        minGap - 1e-9
      ) {
        const members = [...left.members, ...right.members];
        const mean =
          members.reduce((s, m) => s + unwrapped[m], 0) / members.length;
        const start = mean - ((members.length - 1) * minGap) / 2;
        clusters.splice(i, 2, {
          members,
          positions: members.map((_, k) => start + k * minGap),
        });
        changed = true;
        break;
      }
    }
  }

  const display = new Map<number, number>();
  for (const c of clusters)
    c.members.forEach((m, k) => display.set(m, c.positions[k]));
  return ordered.map((item, i) => ({
    id: item.id,
    longitude: normalizeDegrees(item.longitude),
    displayLongitude: normalizeDegrees(display.get(i)!),
  }));
}
