import { Eye, Info } from "lucide-react";

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
  sections: { text: string; observed?: string[]; notes?: string[] }[];
  synthesis: string;
  reflectionQuestions: string[];
  limitations: string[];
  unavailableMessage: string | null;
};

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
          <div className="space-y-1.5 border-t border-line-soft pt-4">
            <Badge tone="accent">Síntese</Badge>
            <p className="leading-relaxed text-fg">{chapter.synthesis}</p>
          </div>
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

      {chapter.limitations.length > 0 && (
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
      )}
    </article>
  );
}
