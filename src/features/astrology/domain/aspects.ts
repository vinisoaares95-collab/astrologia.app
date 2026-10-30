import { ORBS_V1, type OrbTable } from "./orbs";
import type { Aspect, AspectType, ChartPoint } from "./types";
import { angularSeparation } from "./zodiac";

export type AspectInput = {
  point: ChartPoint;
  longitude: number;
  /** graus/dia; null para pontos sem velocidade conhecida (ASC/MC). */
  speed: number | null;
};

const LUMINARIES = new Set<ChartPoint>(["sun", "moon"]);
const ANGLES = new Set<ChartPoint>(["asc", "mc"]);
const ASPECT_TYPES = Object.keys(ORBS_V1.aspects) as AspectType[];

function allowedOrb(
  a: ChartPoint,
  b: ChartPoint,
  base: number,
  table: OrbTable,
) {
  if (ANGLES.has(a) || ANGLES.has(b)) return Math.min(base, table.angleOrb);
  return LUMINARIES.has(a) || LUMINARIES.has(b)
    ? base + table.luminaryBonus
    : base;
}

/**
 * Detecta aspectos maiores entre todos os pares de pontos.
 * Para cada par, mantém apenas o aspecto de menor orbe dentro do permitido.
 * "Aplicativo" compara a separação agora e uma hora depois, pelas velocidades.
 */
export function findAspects(
  points: readonly AspectInput[],
  table: OrbTable = ORBS_V1,
): Aspect[] {
  const result: Aspect[] = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const p = points[i];
      const q = points[j];
      // Ascendente e Meio do Céu não formam aspecto entre si.
      if (ANGLES.has(p.point) && ANGLES.has(q.point)) continue;
      const separation = angularSeparation(p.longitude, q.longitude);

      let best: Aspect | null = null;
      for (const type of ASPECT_TYPES) {
        const { angle, orb } = table.aspects[type];
        const delta = Math.abs(separation - angle);
        if (delta > allowedOrb(p.point, q.point, orb, table)) continue;
        if (best && best.orb <= delta) continue;

        let applying: boolean | null = null;
        if (p.speed !== null && q.speed !== null) {
          const dt = 1 / 24;
          const later = angularSeparation(
            p.longitude + p.speed * dt,
            q.longitude + q.speed * dt,
          );
          applying = Math.abs(later - angle) < delta;
        }
        best = {
          a: p.point,
          b: q.point,
          type,
          exactAngle: angle,
          orb: delta,
          applying,
        };
      }
      if (best) result.push(best);
    }
  }
  return result;
}
