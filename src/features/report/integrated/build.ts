/**
 * Monta o relatório integrado a partir do que os motores entregam ao cliente
 * (Fase 04A). Funções puras: nenhuma chamada, nenhum armazenamento.
 *
 * Entradas (os mesmos formatos que já chegam ao navegador):
 * - Parte I: `ClientReport` (02F.2) — capítulos 1 a 5;
 * - Parte II: `PalmAnalysisResult` (03E) — capítulos 6 e 7;
 * - Parte III: capítulos 8 e 9 montados no navegador a partir das pontes
 *   (04D, `journey-chapters`); pendentes só na demonstração interna.
 */
import { reportParts, type ReportPart } from "@/content/report-chapters";

import type {
  ClientChapter,
  ClientReport,
} from "../../interpretation/ai/presentation";
import type {
  ClientPalmChapter,
  PalmAnalysisResult,
} from "../../palm-reading/chapters/presentation";
import type { ChapterArticleData } from "../chapter-article";
import type {
  IntegratedReportView,
  ReportChapterView,
  ReportPartStatus,
  ReportPartView,
} from "./contract";

/** O que se sabe de cada parte neste momento da jornada. */
export type SkyInput =
  | { state: "ready"; report: ClientReport }
  | { state: "loading" }
  | { state: "unavailable"; reason: string }
  /** Ainda não integrado à jornada (até a 04C): só título e resumo. */
  | { state: "pending"; reason: string };

export type JourneyInput =
  | {
      state: "ready";
      chapter8: ChapterArticleData;
      chapter9: ChapterArticleData;
      /** O capítulo 9 cita a leitura das mãos (para o aviso de simulação). */
      handsUsedIn9: boolean;
    }
  | { state: "loading" }
  /** Demonstração interna (`?cenario=`): só título e resumo. */
  | { state: "pending"; reason: string };

export const JOURNEY_SIMULATED_NOTICE =
  "Parte montada também a partir de uma leitura das mãos simulada: nenhuma inteligência artificial observou uma foto real.";

export type HandsInput =
  | { state: "ready"; result: PalmAnalysisResult }
  | { state: "loading" }
  | { state: "absent"; reason: string };

export const SKY_UNAVAILABLE_DEFAULT =
  "O mapa natal não pôde ser calculado neste ambiente.";
export const HANDS_ABSENT_DEFAULT =
  "A leitura das mãos não foi feita nesta sessão.";
export const PENDING_REASON =
  "Capítulo em definição editorial. Nesta demonstração interna, aparecem só o título e o resumo previstos.";

/** Capítulo astrológico → formato do `ChapterArticle`, sem mudar o texto. */
export function skyArticle(c: ClientChapter): ChapterArticleData {
  return {
    number: c.number,
    title: c.title,
    status: "content",
    introduction: c.introduction,
    sections: c.sections.map((s) => ({ text: s.text, notes: s.notes })),
    synthesis: c.synthesis,
    reflectionQuestions: c.reflectionQuestions,
    limitations: c.limitations,
    unavailableMessage: null,
  };
}

/** Capítulo das mãos → formato do `ChapterArticle` (já é o mesmo). */
export function palmArticle(c: ClientPalmChapter): ChapterArticleData {
  return {
    number: c.number,
    title: c.title,
    status: c.status,
    introduction: c.introduction,
    sections: c.sections.map((s) => ({
      text: s.text,
      observed: s.observed,
      notes: s.notes,
    })),
    synthesis: c.synthesis,
    reflectionQuestions: c.reflectionQuestions,
    limitations: c.limitations,
    unavailableMessage: c.unavailableMessage,
  };
}

function partOf(source: ReportPart["source"]): ReportPart {
  const part = reportParts.find((p) => p.source === source);
  if (!part) throw new Error(`Parte "${source}" ausente em reportParts.`);
  return part;
}

function view(
  part: ReportPart,
  chapter: ReportPart["chapters"][number],
  rest: Pick<
    ReportChapterView,
    "availability" | "article" | "unavailableReason"
  >,
): ReportChapterView {
  if (rest.article) {
    // O motor e a estrutura editorial precisam concordar (número e título).
    if (
      rest.article.number !== chapter.number ||
      rest.article.title !== chapter.title
    )
      throw new Error(
        `Capítulo ${rest.article.number} ("${rest.article.title}") não corresponde a reportParts (${chapter.number}, "${chapter.title}").`,
      );
  }
  return {
    number: chapter.number,
    title: chapter.title,
    summary: chapter.summary,
    part: { numeral: part.numeral, title: part.title },
    basis: part.source,
    ...rest,
  };
}

function statusOf(chapters: ReportChapterView[]): ReportPartStatus {
  const a = chapters.map((c) => c.availability);
  if (a.every((x) => x === "pending")) return "pending";
  if (a.some((x) => x === "loading")) return "loading";
  if (a.every((x) => x === "content")) return "ready";
  if (a.every((x) => x === "unavailable")) return "unavailable";
  return "partial";
}

function skyPart(input: SkyInput): ReportPartView {
  const part = partOf("sky");
  const byNumber = new Map(
    input.state === "ready"
      ? input.report.chapters.map((c) => [c.number, c] as const)
      : [],
  );
  const chapters = part.chapters.map((ch) => {
    if (input.state === "loading")
      return view(part, ch, {
        availability: "loading",
        article: null,
        unavailableReason: null,
      });
    if (input.state === "pending")
      return view(part, ch, {
        availability: "pending",
        article: null,
        unavailableReason: input.reason,
      });
    const c = byNumber.get(ch.number);
    if (input.state === "ready" && c)
      return view(part, ch, {
        availability: "content",
        article: skyArticle(c),
        unavailableReason: null,
      });
    return view(part, ch, {
      availability: "unavailable",
      article: null,
      unavailableReason:
        input.state === "unavailable" ? input.reason : SKY_UNAVAILABLE_DEFAULT,
    });
  });
  return {
    numeral: part.numeral,
    title: part.title,
    basis: part.source,
    status: statusOf(chapters),
    disclaimer: input.state === "ready" ? input.report.disclaimer : null,
    notices: [],
    chapters,
  };
}

function handsPart(input: HandsInput): ReportPartView {
  const part = partOf("hands");
  const result = input.state === "ready" ? input.result : null;
  const byNumber = new Map(
    result?.chapters.map((c) => [c.number, c] as const) ?? [],
  );
  const chapters = part.chapters.map((ch) => {
    if (input.state === "loading")
      return view(part, ch, {
        availability: "loading",
        article: null,
        unavailableReason: null,
      });
    const c = byNumber.get(ch.number as 6 | 7);
    if (!c)
      return view(part, ch, {
        availability: "unavailable",
        article: null,
        unavailableReason:
          input.state === "absent" ? input.reason : HANDS_ABSENT_DEFAULT,
      });
    return view(part, ch, {
      availability: c.status === "content" ? "content" : "unavailable",
      article: palmArticle(c),
      unavailableReason: c.status === "content" ? null : c.unavailableMessage,
    });
  });
  const notices: string[] = [];
  if (result?.simulated)
    notices.push(
      "Leitura simulada: nenhuma inteligência artificial observou uma foto real.",
    );
  if (result?.status === "partial")
    notices.push(
      "Leitura parcial: algumas características não puderam ser observadas na foto. Cada capítulo indica o que ficou de fora.",
    );
  if (result?.retakeRecommended)
    notices.push(
      "Uma nova foto, com a palma inteira, de frente e com boa luz, pode permitir uma leitura mais completa.",
    );
  return {
    numeral: part.numeral,
    title: part.title,
    basis: part.source,
    status: statusOf(chapters),
    disclaimer: result?.disclaimer ?? null,
    notices,
    chapters,
  };
}

function journeyPart(
  input: JourneyInput,
  simulatedHands: boolean,
): ReportPartView {
  const part = partOf("journey");
  const chapters = part.chapters.map((ch) => {
    if (input.state === "loading")
      return view(part, ch, {
        availability: "loading",
        article: null,
        unavailableReason: null,
      });
    if (input.state === "pending")
      return view(part, ch, {
        availability: "pending",
        article: null,
        unavailableReason: input.reason,
      });
    const article = ch.number === 8 ? input.chapter8 : input.chapter9;
    return view(part, ch, {
      availability: article.status === "content" ? "content" : "unavailable",
      article,
      unavailableReason:
        article.status === "content" ? null : article.unavailableMessage,
    });
  });
  // Aviso de simulação só quando acrescenta: o capítulo 8 com conteúdo já traz
  // a sua ressalva (R-simulada); aqui, só se o 9 usa as mãos sem o 8 (04E.1).
  const notice =
    simulatedHands &&
    input.state === "ready" &&
    input.chapter8.status !== "content" &&
    input.chapter9.status === "content" &&
    input.handsUsedIn9;
  return {
    numeral: part.numeral,
    title: part.title,
    basis: part.source,
    status: statusOf(chapters),
    disclaimer: null,
    notices: notice ? [JOURNEY_SIMULATED_NOTICE] : [],
    chapters,
  };
}

export function buildIntegratedReport(input: {
  sky: SkyInput;
  hands: HandsInput;
  /** Omitido: pendente (demonstração interna). */
  journey?: JourneyInput;
}): IntegratedReportView {
  const simulated =
    input.hands.state === "ready" && input.hands.result.simulated;
  const parts = [
    skyPart(input.sky),
    handsPart(input.hands),
    journeyPart(
      input.journey ?? { state: "pending", reason: PENDING_REASON },
      simulated,
    ),
  ];
  const all = parts.flatMap((p) => p.chapters);
  return {
    parts,
    complete: all.every((c) => c.availability === "content"),
    hasPending: all.some((c) => c.availability === "pending"),
  };
}
