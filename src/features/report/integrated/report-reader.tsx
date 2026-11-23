"use client";

/**
 * Leitura do relatório integrado (Fase 04A).
 *
 * - Desktop: sumário lateral fixo, com as três partes e os nove capítulos e o
 *   estado de cada um; o capítulo em leitura fica marcado (aria-current).
 * - Mobile: sumário compacto no topo (números dos capítulos por parte) e
 *   "voltar ao sumário" ao fim de cada parte; leitura em uma coluna.
 * - Cada capítulo com conteúdo ou indisponível usa `ChapterArticle`, sem
 *   mudar o texto do motor. Pendente (8–9) mostra só título e resumo de
 *   `reportParts`; carregando mostra um esqueleto acessível.
 */
import { CircleDashed, Clock3, ListTree } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge, Callout } from "@/components/ui";
import { cn } from "@/lib/cn";

import { ChapterArticle, type ChapterArticleData } from "../chapter-article";
import { PART_BASIS } from "../part-basis";
import type {
  ChapterAvailability,
  IntegratedReportView,
  ReportChapterView,
  ReportPartStatus,
  ReportPartView,
} from "./contract";

export const SYMBOLIC_NOTICE =
  "As interpretações seguem tradições simbólicas da astrologia e da quiromancia. Não são previsões nem substituem orientação profissional.";

const PART_STATUS: Record<
  ReportPartStatus,
  { label: string; tone: "success" | "neutral" | "demo" | "accent" }
> = {
  ready: { label: "Pronta", tone: "success" },
  partial: { label: "Parcial", tone: "accent" },
  unavailable: { label: "Indisponível", tone: "neutral" },
  loading: { label: "Carregando", tone: "neutral" },
  pending: { label: "Em definição", tone: "demo" },
};

const CHAPTER_STATUS: Record<ChapterAvailability, string> = {
  content: "pronto",
  unavailable: "indisponível",
  loading: "carregando",
  pending: "em definição",
};

/** Céu pendente = ainda não integrado; jornada pendente = sem definição. */
const pendingLabel = (basis: ReportChapterView["basis"]) =>
  basis === "journey" ? "Em definição" : "Em integração";
const partStatusLabel = (p: ReportPartView) =>
  p.status === "pending" ? pendingLabel(p.basis) : PART_STATUS[p.status].label;

const chapterStatusText = (c: ReportChapterView) =>
  c.availability === "pending"
    ? pendingLabel(c.basis).toLowerCase()
    : CHAPTER_STATUS[c.availability];

const anchor = (n: number) => `cap-${n}`;
const partAnchor = (numeral: string) => `parte-${numeral.toLowerCase()}`;
const pad = (n: number) => String(n).padStart(2, "0");

/** Indisponível sem texto do motor: só título e o motivo informado. */
function unavailableArticle(c: ReportChapterView): ChapterArticleData {
  return {
    number: c.number,
    title: c.title,
    status: "unavailable",
    introduction: "",
    sections: [],
    synthesis: "",
    reflectionQuestions: [],
    limitations: [],
    unavailableMessage: c.unavailableReason,
  };
}

function PendingChapter({ chapter }: { chapter: ReportChapterView }) {
  return (
    <article
      aria-labelledby={`capitulo-${chapter.number}`}
      className="space-y-4 rounded-2xl border border-dashed border-line px-4 py-5 sm:px-6"
    >
      <header className="flex items-start gap-4">
        <span className="font-mono text-2xl font-medium text-fg-subtle tabular-nums">
          {pad(chapter.number)}
        </span>
        <div className="flex-1 space-y-1">
          <p className="font-mono text-[0.65rem] tracking-[0.16em] text-fg-subtle uppercase">
            Capítulo {chapter.number}
          </p>
          <h3
            id={`capitulo-${chapter.number}`}
            className="text-xl font-semibold text-fg"
          >
            {chapter.title}
          </h3>
          <p className="text-sm text-fg-muted">{chapter.summary}</p>
        </div>
        <Badge tone="demo">{pendingLabel(chapter.basis)}</Badge>
      </header>
      <p className="flex gap-2 text-sm leading-relaxed text-fg-subtle">
        <CircleDashed aria-hidden className="mt-0.5 size-4 shrink-0" />
        <span>{chapter.unavailableReason}</span>
      </p>
    </article>
  );
}

function LoadingChapter({ chapter }: { chapter: ReportChapterView }) {
  return (
    <article
      aria-labelledby={`capitulo-${chapter.number}`}
      aria-busy="true"
      className="space-y-4 rounded-2xl bg-surface/80 px-4 py-5 edge-light sm:px-6"
    >
      <header className="flex items-start gap-4">
        <span className="text-copper font-mono text-2xl font-medium tabular-nums">
          {pad(chapter.number)}
        </span>
        <div className="flex-1 space-y-1">
          <p className="font-mono text-[0.65rem] tracking-[0.16em] text-fg-subtle uppercase">
            Capítulo {chapter.number}
          </p>
          <h3
            id={`capitulo-${chapter.number}`}
            className="text-xl font-semibold text-fg"
          >
            {chapter.title}
          </h3>
        </div>
      </header>
      <p
        role="status"
        className="flex items-center gap-2 text-sm text-fg-muted"
      >
        <Clock3 aria-hidden className="size-4 animate-pulse" />
        Preparando este capítulo…
      </p>
      <div aria-hidden className="space-y-2.5">
        {[92, 100, 84, 64].map((w) => (
          <div
            key={w}
            className="h-3 animate-pulse rounded-full bg-surface-bright"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    </article>
  );
}

function Chapter({ chapter }: { chapter: ReportChapterView }) {
  const body =
    chapter.availability === "pending" ? (
      <PendingChapter chapter={chapter} />
    ) : chapter.availability === "loading" ? (
      <LoadingChapter chapter={chapter} />
    ) : (
      <ChapterArticle
        chapter={chapter.article ?? unavailableArticle(chapter)}
        observedLabel={
          chapter.basis === "hands" ? "Observado na foto" : undefined
        }
      />
    );
  return (
    <div id={anchor(chapter.number)} className="scroll-mt-32">
      {body}
    </div>
  );
}

function PartSection({ part }: { part: ReportPartView }) {
  const basis = PART_BASIS[part.basis];
  const status = {
    ...PART_STATUS[part.status],
    label: partStatusLabel(part),
  };
  const headingId = `${partAnchor(part.numeral)}-titulo`;
  return (
    <section
      id={partAnchor(part.numeral)}
      aria-labelledby={headingId}
      className="scroll-mt-32 space-y-5"
    >
      <header className="space-y-3">
        <p className="font-mono text-[0.65rem] tracking-[0.18em] text-accent uppercase">
          Parte {part.numeral}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 id={headingId} className="text-2xl font-semibold text-fg">
            {part.title}
          </h2>
          <Badge tone={basis.tone}>{basis.label}</Badge>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
        {part.disclaimer && (
          <p className="max-w-prose text-sm leading-relaxed text-fg-muted">
            {part.disclaimer}
          </p>
        )}
        {part.notices.map((n) => (
          <Callout key={n} tone="info">
            {n}
          </Callout>
        ))}
      </header>
      <div className="space-y-5">
        {part.chapters.map((c) => (
          <Chapter key={c.number} chapter={c} />
        ))}
      </div>
      <p className="lg:hidden">
        <a
          href="#sumario"
          className="text-sm text-fg-subtle underline underline-offset-4 hover:text-fg"
        >
          Voltar ao sumário
        </a>
      </p>
    </section>
  );
}

function StatusDot({ availability }: { availability: ChapterAvailability }) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-1.5 shrink-0 rounded-full",
        availability === "content" && "bg-success",
        availability === "unavailable" && "bg-fg-subtle",
        availability === "loading" && "animate-pulse bg-fg-muted",
        availability === "pending" && "border border-dashed border-accent",
      )}
    />
  );
}

/** Capítulo visível no momento (para marcar o sumário). */
function useCurrentChapter(numbers: number[]) {
  const [current, setCurrent] = useState<number | null>(null);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setCurrent(Number(visible[0].target.id.slice(4)));
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    for (const n of numbers) {
      const el = document.getElementById(anchor(n));
      if (el) observer.observe(el);
    }
    // No fim da página, os últimos capítulos podem não chegar à faixa
    // observada: marca o último.
    const onScroll = () => {
      const end =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4;
      if (end && numbers.length) setCurrent(numbers[numbers.length - 1]);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [numbers]);
  return current;
}

function DesktopNav({
  parts,
  current,
}: {
  parts: ReportPartView[];
  current: number | null;
}) {
  return (
    <nav aria-label="Sumário do relatório" className="space-y-6">
      {parts.map((p) => (
        <div key={p.numeral} className="space-y-2">
          <a
            href={`#${partAnchor(p.numeral)}`}
            className="flex items-baseline gap-2 text-sm font-semibold text-fg hover:text-accent"
          >
            <span className="font-mono text-xs text-accent">{p.numeral}</span>
            {p.title}
          </a>
          <ol className="space-y-0.5 border-l border-line-soft">
            {p.chapters.map((c) => (
              <li key={c.number}>
                <a
                  href={`#${anchor(c.number)}`}
                  aria-current={current === c.number ? "location" : undefined}
                  className={cn(
                    "-ml-px flex items-center gap-2.5 border-l py-1.5 pr-2 pl-3 text-sm transition-colors",
                    current === c.number
                      ? "border-accent text-fg"
                      : "border-transparent text-fg-muted hover:text-fg",
                  )}
                >
                  <span className="font-mono text-xs text-fg-subtle tabular-nums">
                    {pad(c.number)}
                  </span>
                  <span className="flex-1 leading-snug">{c.title}</span>
                  <StatusDot availability={c.availability} />
                  <span className="sr-only">({chapterStatusText(c)})</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </nav>
  );
}

function MobileNav({ parts }: { parts: ReportPartView[] }) {
  return (
    <nav
      aria-label="Sumário do relatório"
      className="space-y-3 rounded-2xl bg-surface/80 p-4 edge-light lg:hidden"
    >
      <p className="flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.16em] text-fg-subtle uppercase">
        <ListTree aria-hidden className="size-3.5" />
        Sumário
      </p>
      <ul className="space-y-3">
        {parts.map((p) => (
          <li key={p.numeral} className="space-y-1.5">
            <a
              href={`#${partAnchor(p.numeral)}`}
              className="flex items-center justify-between gap-2 text-sm font-medium text-fg"
            >
              <span>
                <span className="font-mono text-xs text-accent">
                  {p.numeral}
                </span>{" "}
                {p.title}
              </span>
              <span className="text-xs text-fg-subtle">
                {partStatusLabel(p)}
              </span>
            </a>
            <ol className="flex flex-wrap gap-1.5">
              {p.chapters.map((c) => (
                <li key={c.number}>
                  <a
                    href={`#${anchor(c.number)}`}
                    className={cn(
                      "flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl px-2.5 font-mono text-sm tabular-nums",
                      c.availability === "pending"
                        ? "border border-dashed border-line text-fg-subtle"
                        : "bg-surface-raised text-fg",
                    )}
                  >
                    {pad(c.number)}
                    <StatusDot availability={c.availability} />
                    <span className="sr-only">
                      {c.title} ({chapterStatusText(c)})
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function ReportReader({ report }: { report: IntegratedReportView }) {
  const numbers = report.parts.flatMap((p) => p.chapters.map((c) => c.number));
  const [chapterNumbers] = useState(numbers);
  const current = useCurrentChapter(chapterNumbers);
  const ready = report.parts
    .flatMap((p) => p.chapters)
    .filter((c) => c.availability === "content").length;

  return (
    <div className="grid gap-8 lg:grid-cols-[17rem_1fr] lg:gap-12">
      <aside className="hidden lg:block">
        <div className="sticky top-32 max-h-[calc(100dvh-9rem)] overflow-y-auto pb-6">
          <DesktopNav parts={report.parts} current={current} />
        </div>
      </aside>

      <div className="min-w-0 space-y-10">
        <header id="sumario" className="scroll-mt-32 space-y-4">
          <div className="space-y-2">
            <p className="font-mono text-[0.65rem] tracking-[0.18em] text-accent uppercase">
              Relatório Sidera
            </p>
            <h1 className="text-3xl font-semibold text-fg sm:text-4xl">
              Seu céu, suas mãos, sua jornada
            </h1>
            <p className="text-sm text-fg-muted">
              {ready} de {numbers.length} capítulos com leitura
              {report.complete ? "" : " nesta versão"}.
            </p>
          </div>
          <Callout tone="info" title="Uma leitura simbólica">
            {SYMBOLIC_NOTICE}
          </Callout>
          <MobileNav parts={report.parts} />
        </header>

        {report.parts.map((p) => (
          <PartSection key={p.numeral} part={p} />
        ))}

        <footer className="border-t border-line-soft pt-6 text-xs leading-relaxed text-fg-subtle">
          {SYMBOLIC_NOTICE}
        </footer>
      </div>
    </div>
  );
}
