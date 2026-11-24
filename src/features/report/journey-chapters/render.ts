/**
 * Capítulos 8 e 9 no formato do `ChapterArticle` (Fase 04D), só com textos
 * da biblioteca e rótulos já apresentados nos capítulos 1 a 7.
 */
import type { FeatureId } from "@/features/palm-reading/analysis/contract";
import { labelList } from "@/features/palm-reading/analysis/phrasing";
import { reportParts } from "@/content/report-chapters";

import type { ChapterArticleData } from "../chapter-article";
import type { BridgeRef, HandsBridge, SkyBridge } from "./bridge";
import {
  AXIS_TITLE,
  C8,
  C9,
  SEAL,
  SUBJECT_TITLE,
  UNCERTAIN_LABEL,
} from "./library";
import {
  selectChapter8,
  selectChapter9,
  type Selection8,
  type Selection9,
} from "./select";

const journey = reportParts.find((p) => p.source === "journey")!;
const TITLE = Object.fromEntries(
  journey.chapters.map((c) => [c.number, c.title]),
) as Record<8 | 9, string>;

const join = (l: string[]) =>
  l.length <= 1 ? (l[0] ?? "") : `${l.slice(0, -1).join(", ")} e ${l.at(-1)}`;
const upper = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const fill = (t: { one: string; many: string }, list: string, n: number) =>
  (n > 1 ? t.many : t.one).replace("{Lista}", upper(list));

/** "Lua em Leão (cap. 2); linha do coração longa; … (cap. 7)". */
export function refList(refs: BridgeRef[]): string {
  const groups = new Map<number, string[]>();
  for (const r of [...refs].sort((a, b) => a.chapter - b.chapter))
    groups.set(r.chapter, [...(groups.get(r.chapter) ?? []), r.label]);
  return [...groups]
    .map(([c, labels]) => `${labels.join("; ")} (cap. ${c})`)
    .join("; ");
}

function unavailable(number: 8 | 9, message: string): ChapterArticleData {
  return {
    number,
    title: TITLE[number],
    status: "unavailable",
    introduction: "",
    sections: [],
    synthesis: "",
    reflectionQuestions: [],
    limitations: [],
    unavailableMessage: message,
  };
}

export function renderChapter8(
  s: Selection8,
  sky: SkyBridge | null,
  hands: HandsBridge | null,
): ChapterArticleData {
  if (s.status !== "content") {
    let message: string = s.reason === "U4misto" ? "" : C8.U[s.reason];
    if (s.reason === "U4misto") {
      const a = hands!.noPole as FeatureId[];
      const b = hands!.unclassified as FeatureId[];
      const key = `${a.length > 1 ? "many" : "one"}-${b.length > 1 ? "many" : "one"}`;
      message = C8.U4misto[key]
        .replace("{Lista1}", upper(labelList(a)))
        .replace("{lista2}", labelList(b));
    }
    return unavailable(8, message);
  }
  const rel = new Set(s.themes.map((t) => t.relation));
  const synthesis = rel.has("F")
    ? C8.synthesis.F
    : rel.has("D") && (rel.has("A") || rel.has("AC"))
      ? C8.synthesis.AD
      : rel.has("D")
        ? C8.synthesis.D
        : C8.synthesis.A;
  const limitations: string[] = [C8.R0];
  const part = hands!.partial as FeatureId[];
  const unr = hands!.unreliable as FeatureId[];
  if (part.length)
    limitations.push(fill(C8.Rparcial, labelList(part), part.length));
  if (unr.length) limitations.push(fill(C8.Rconf, labelList(unr), unr.length));
  if (sky!.uncertain.length)
    limitations.push(
      fill(
        C8.Rhora,
        join(sky!.uncertain.map((b) => UNCERTAIN_LABEL[b])),
        sky!.uncertain.length,
      ),
    );
  limitations.push(C8.Rescopo);
  if (hands!.simulated) limitations.push(C8.Rsim);
  return {
    number: 8,
    title: TITLE[8],
    status: "content",
    introduction: C8.intro,
    sections: s.themes.map((t) => ({
      heading: AXIS_TITLE[t.axis],
      badge: SEAL[t.relation],
      refs: [
        { label: C8.labels.hands, text: refList(t.hands) },
        { label: C8.labels.sky, text: refList(t.sky) },
        ...(t.skyOpposite.length
          ? [{ label: C8.labels.opposite, text: refList(t.skyOpposite) }]
          : []),
      ],
      text: C8.bridge[t.libraryKey],
    })),
    synthesis,
    reflectionQuestions: [],
    limitations,
    unavailableMessage: null,
  };
}

export function renderChapter9(s: Selection9): ChapterArticleData {
  if (s.status !== "content") return unavailable(9, C9.V[s.reason!]);
  const chapters = [...new Set(s.themes.flatMap((t) => t.chapters))].sort(
    (a, b) => a - b,
  );
  const introduction = (
    chapters.length > 1 ? C9.intro.many : C9.intro.one
  ).replace("{lista}", join(chapters.map(String)));
  const withAxis = s.themes.find((t) => t.axis);
  const sections: ChapterArticleData["sections"] = s.themes.map((t) => ({
    heading: t.axis ? AXIS_TITLE[t.axis] : SUBJECT_TITLE[t.subject]!,
    refs: [{ label: C9.labels.from, text: refList(t.sources) }],
    text: C9.q[t.questionKey],
  }));
  if (withAxis?.axis)
    sections.push({
      heading: C9.labels.practice,
      text: C9.practice[withAxis.axis],
    });
  sections.push({ heading: C9.labels.final, text: C9.final });
  return {
    number: 9,
    title: TITLE[9],
    status: "content",
    introduction,
    sections,
    synthesis: "",
    reflectionQuestions: [],
    limitations: [C9.closing],
    unavailableMessage: null,
  };
}

export type JourneyChapters = {
  chapter8: ChapterArticleData;
  chapter9: ChapterArticleData;
  /** Seleções com os `ref` usados (rastreabilidade; não exibidas). */
  selection8: Selection8;
  selection9: Selection9;
};

/** Capítulos 8 e 9 a partir das pontes da jornada (no navegador). */
export function buildJourneyChapters(
  sky: SkyBridge | null,
  hands: HandsBridge | null,
): JourneyChapters {
  const selection8 = selectChapter8(sky, hands);
  const selection9 = selectChapter9(sky, hands, selection8);
  return {
    chapter8: renderChapter8(selection8, sky, hands),
    chapter9: renderChapter9(selection9),
    selection8,
    selection9,
  };
}
