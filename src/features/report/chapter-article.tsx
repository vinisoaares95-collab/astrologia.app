import { ChevronDown, Eye, Info } from "lucide-react";

import { Badge, Callout } from "@/components/ui";

/**
 * Um capítulo do relatório já redigido (Fase 03E: capítulos 6 e 7).
 *
 * Feito para servir também aos capítulos de astrologia na integração final
 * (Fase 04): mesmo número em destaque, título, introdução, seções, síntese e
 * perguntas. O que foi OBSERVADO aparece num bloco próprio, antes da leitura
 * simbólica de cada seção; as ressalvas do sistema vêm logo abaixo. Nada de
 * origem do texto, identificadores ou custos aqui.
 */
export type ChapterArticleData = {
  number: number;
  title: string;
  status: "content" | "unavailable";
  introduction: string;
  sections: {
    text: string;
    observed?: string[];
    notes?: string[];
    /** Capítulos 8 e 9 (04D): título do tema e selo da relação. */
    heading?: string;
    badge?: string;
    /** Capítulos 8 e 9 (04D): referências aos capítulos anteriores. */
    refs?: { label: string; text: string }[];
  }[];
  synthesis: string;
  reflectionQuestions: string[];
  /** Ressalvas sempre visíveis (no capítulo 8, só o aviso essencial R0). */
  limitations: string[];
  /**
   * Ressalvas técnicas (04E.2A): exclusões e limites de classificação, numa
   * seção expansível. Mesmo conteúdo, só recolhido; nunca a indisponibilidade.
   */
  limitationDetails?: string[];
  unavailableMessage: string | null;
};

export const LIMITATION_DETAILS_TITLE = "Limitações desta análise";

export function ChapterArticle({
  chapter,
  observedLabel = "Observado na foto",
}: {
  chapter: ChapterArticleData;
  observedLabel?: string;
}) {
  const headingId = `capitulo-${chapter.number}`;
  return (
    <article
      aria-labelledby={headingId}
      className="space-y-5 rounded-2xl bg-surface/80 px-4 py-5 edge-light sm:px-6"
    >
      <header className="flex items-start gap-4">
        <span className="text-copper font-mono text-2xl font-medium tabular-nums">
          {String(chapter.number).padStart(2, "0")}
        </span>
        <div className="flex-1 space-y-1">
          <p className="font-mono text-[0.65rem] tracking-[0.16em] text-fg-subtle uppercase">
            Capítulo {chapter.number}
          </p>
          <h3 id={headingId} className="text-xl font-semibold text-fg">
            {chapter.title}
          </h3>
        </div>
      </header>

      {chapter.status === "unavailable" ? (
        <Callout tone="info" title="Esta parte não pôde ser lida">
          {chapter.unavailableMessage}
        </Callout>
      ) : (
        <>
          <p className="leading-relaxed text-fg">{chapter.introduction}</p>
          <div className="space-y-5">
            {chapter.sections.map((s, i) => (
              <section key={i} className="space-y-2.5">
                {s.heading && (
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold text-fg">{s.heading}</h4>
                    {s.badge && <Badge tone="neutral">{s.badge}</Badge>}
                  </div>
                )}
                {s.refs && s.refs.length > 0 && (
                  <dl className="space-y-0.5 rounded-xl bg-surface-bright/60 px-3.5 py-2.5 text-sm">
                    {s.refs.map((r) => (
                      <div key={r.label} className="flex flex-wrap gap-x-1.5">
                        <dt className="font-medium text-fg-subtle">
                          {r.label}:
                        </dt>
                        <dd className="text-fg-muted">{r.text}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {s.observed && s.observed.length > 0 && (
                  <div className="space-y-1 rounded-xl bg-surface-bright/60 px-3.5 py-2.5">
                    <p className="flex items-center gap-1.5 font-mono text-[0.65rem] tracking-[0.14em] text-fg-subtle uppercase">
                      <Eye aria-hidden className="size-3.5" />
                      {observedLabel}
                    </p>
                    <ul className="space-y-0.5 text-sm text-fg-muted">
                      {s.observed.map((o) => (
                        <li key={o}>{o}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="leading-relaxed text-fg-muted">{s.text}</p>
                {s.notes?.map((n) => (
                  <p
                    key={n}
                    className="flex gap-1.5 text-xs leading-relaxed text-fg-subtle"
                  >
                    <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                    <span>{n}</span>
                  </p>
                ))}
              </section>
            ))}
          </div>
          {chapter.synthesis && (
            <div className="space-y-1.5 border-t border-line-soft pt-4">
              <Badge tone="accent">Síntese</Badge>
              <p className="leading-relaxed text-fg">{chapter.synthesis}</p>
            </div>
          )}
          {chapter.reflectionQuestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-fg">Para refletir</p>
              <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg-muted">
                {chapter.reflectionQuestions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {chapter.limitations.length > 0 &&
        (chapter.limitationDetails?.length ? (
          <div className="space-y-2.5 border-t border-line-soft pt-4">
            {chapter.limitations.map((l) => (
              <p
                key={l}
                className="flex gap-1.5 text-sm leading-relaxed text-fg-muted"
              >
                <Info aria-hidden className="mt-1 size-3.5 shrink-0" />
                <span>{l}</span>
              </p>
            ))}
            <details className="group rounded-xl bg-surface-bright/40 px-3.5 py-2.5">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-md text-sm font-medium text-fg-muted [&::-webkit-details-marker]:hidden">
                <span>
                  {LIMITATION_DETAILS_TITLE}
                  <span className="text-fg-subtle">
                    {" "}
                    ({chapter.limitationDetails.length})
                  </span>
                </span>
                <ChevronDown
                  aria-hidden
                  className="size-4 shrink-0 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <ul className="mt-1.5 list-disc space-y-1.5 pb-1 pl-4 text-xs leading-relaxed text-fg-subtle">
                {chapter.limitationDetails.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </details>
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-fg-subtle">
              Limites desta leitura
            </p>
            <ul className="space-y-1 text-xs leading-relaxed text-fg-subtle">
              {chapter.limitations.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        ))}
    </article>
  );
}
