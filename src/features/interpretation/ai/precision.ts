/**
 * Precisão astronômica em textos controlados pelo sistema (Fase 02F.2).
 *
 * O modelo NÃO descreve horário de nascimento, janelas, intervalos de
 * posição nem ressalvas de incerteza: na avaliação real (02F.1) essas
 * explicações saíram vagas ou incorretas ("calculado com precisão dentro de
 * uma janela de incerteza pequena"). Aqui elas são montadas a partir dos
 * fatos calculados, sempre ligadas ao fato (e, portanto, ao ponto) de onde
 * vieram, e anexadas à seção como `notes`.
 */
import { formatPosition } from "../../natal-chart/labels";
import type {
  ChapterInterpretation,
  Fact,
  InterpretationItem,
  InterpretationReport,
} from "../contract";
import type { Sign } from "../../astrology/domain/types";

/** Trecho da observação de 02E que descreve a janela de um corpo. */
const BODY_RANGE_RE = / \(na janela de incerteza, entre (.+?) e (.+?)\)/u;
/** Ângulo com janela: "Ascendente em Virgem no centro da janela (24°45′), variando 77,8° na janela." */
const ANGLE_RANGE_RE =
  /^(.+?) em (\p{L}+) no centro da janela \((.+?)\), variando .+? na janela\.$/u;
const WITHIN_WINDOW_RE = / dentro da janela de incerteza/u;
/** Aspecto incerto: a incerteza segue em `certainty` e na ressalva oficial. */
const PARTIAL_ASPECT_RE = /, não presente em toda a janela de incerteza/u;

/**
 * Observação enviada ao modelo e usada como base dos graus aceitos no
 * texto: a posição calculada, sem a janela de incerteza (que o sistema
 * apresenta por conta própria, em `precisionNotes`).
 */
export function modelObservation(observation: string): string {
  const angle = observation.match(ANGLE_RANGE_RE);
  if (angle) return `${angle[1]} a ${angle[3]} de ${angle[2]}.`;
  return observation
    .replace(BODY_RANGE_RE, "")
    .replace(PARTIAL_ASPECT_RE, "")
    .replace(WITHIN_WINDOW_RE, "");
}

/** "a posição do Sol", "da Lua", "de Mercúrio"… */
const OF_POINT: Record<string, string> = {
  sun: "do Sol",
  moon: "da Lua",
  mercury: "de Mercúrio",
  venus: "de Vênus",
  mars: "de Marte",
  jupiter: "de Júpiter",
  saturn: "de Saturno",
  uranus: "de Urano",
  neptune: "de Netuno",
  pluto: "de Plutão",
};

/** Intervalo calculado de UM fato (corpo em signo), com o ponto correto. */
export function rangeNote(
  fact: Fact,
  precision: InterpretationReport["basis"]["precision"],
): string | null {
  if (fact.kind !== "body-sign" || precision === "exact") return null;
  const m = fact.observation.match(BODY_RANGE_RE);
  if (!m) return null;
  const of = OF_POINT[fact.bodies[0]];
  if (!of) return null;
  const center = formatPosition({
    sign: fact.values.sign as Sign,
    degree: Number(fact.values.degree),
    minute: Number(fact.values.minute),
  });
  return precision === "approximate"
    ? `Com o horário de nascimento aproximado, a posição ${of} pode estar entre ${m[1]} e ${m[2]}; a leitura usa a posição calculada para o horário informado (${center}).`
    : `Sem o horário de nascimento, a posição ${of} varia ao longo do dia, entre ${m[1]} e ${m[2]}; a leitura usa a posição calculada para o meio-dia (${center}).`;
}

/** Na segunda ressalva do mesmo capítulo, uma forma curta (sem repetir). */
export const REPEATED_CAVEAT =
  "Vale a mesma reserva: este aspecto também depende do horário de nascimento.";

/**
 * Notas de precisão de cada seção, na ordem das seções. Cada intervalo
 * aparece uma única vez por capítulo (na primeira seção que cita o fato) e
 * cada ressalva oficial do motor acompanha a seção que usa o item incerto.
 */
export function precisionNotes(
  report: InterpretationReport,
  chapter: ChapterInterpretation,
  sections: { itemIds: string[] }[],
): string[][] {
  const factById = new Map(report.facts.map((f) => [f.id, f]));
  const items = new Map<string, InterpretationItem>(
    chapter.items.map((i) => [i.id, i]),
  );
  const shownFacts = new Set<string>();
  const shownCaveatItems = new Set<string>();
  let caveats = 0;
  return sections.map((s) => {
    const notes: string[] = [];
    for (const id of s.itemIds) {
      const item = items.get(id);
      if (!item) continue;
      for (const factId of item.factIds) {
        if (shownFacts.has(factId)) continue;
        const fact = factById.get(factId);
        const note = fact && rangeNote(fact, report.basis.precision);
        if (note) {
          notes.push(note);
          shownFacts.add(factId);
        }
      }
      if (item.caveat && !shownCaveatItems.has(item.id)) {
        notes.push(caveats === 0 ? item.caveat : REPEATED_CAVEAT);
        shownCaveatItems.add(item.id);
        caveats++;
      }
    }
    return notes;
  });
}
