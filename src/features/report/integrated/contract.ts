/**
 * Relatório integrado dos nove capítulos — modelo de apresentação (Fase 04A).
 *
 * Só apresentação: recebe o que os motores já produziram e organiza nas três
 * partes de `reportParts`, sem reescrever nem reinterpretar nada.
 *
 * - Número, título e parte vêm de `reportParts` (fonte única), conferidos
 *   contra o que o motor entregou; divergência é erro de programação.
 * - "Origem da interpretação" é a BASE editorial da parte (cálculo + símbolo,
 *   observação + símbolo, síntese simbólica). Se o texto veio da IA ou da
 *   biblioteca NÃO é exibido ao cliente (regra da 02F.2 e da 03E).
 * - Estado de cada capítulo: conteúdo, indisponível (com o motivo que o motor
 *   escreveu), carregando, ou pendente — este último só para os capítulos 8 e
 *   9, que ainda não têm definição, e só na demonstração interna.
 */
import type { ChapterArticleData } from "../chapter-article";
import type { ReportPart } from "@/content/report-chapters";

export type ReportBasis = ReportPart["source"];

export type ChapterAvailability =
  | "content"
  | "unavailable"
  | "loading"
  /** Sem definição editorial (capítulos 8 e 9): só título e resumo. */
  | "pending";

export type ReportChapterView = {
  number: number;
  title: string;
  /** Resumo editorial de `reportParts` (nunca uma interpretação). */
  summary: string;
  part: { numeral: string; title: string };
  basis: ReportBasis;
  availability: ChapterAvailability;
  /** Texto do motor, sem alteração (presente com "content" ou "unavailable"). */
  article: ChapterArticleData | null;
  /** Por que não há conteúdo, quando o motor ou a etapa informou. */
  unavailableReason: string | null;
};

export type ReportPartStatus =
  "ready" | "partial" | "unavailable" | "loading" | "pending";

export type ReportPartView = {
  numeral: string;
  title: string;
  basis: ReportBasis;
  status: ReportPartStatus;
  /** Aviso de não cientificidade da própria parte (texto do motor). */
  disclaimer: string | null;
  /** Observações da parte inteira (ex.: leitura simulada, nova foto). */
  notices: string[];
  chapters: ReportChapterView[];
};

export type IntegratedReportView = {
  parts: ReportPartView[];
  /** Falso enquanto algum capítulo estiver pendente, carregando ou indisponível. */
  complete: boolean;
  /** Há capítulos pendentes de definição (8–9): uso só interno. */
  hasPending: boolean;
};
