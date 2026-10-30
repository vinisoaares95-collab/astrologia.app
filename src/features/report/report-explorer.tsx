"use client";

import { Lock } from "lucide-react";
import { useId, useState } from "react";

import { Badge } from "@/components/ui";
import type { ReportPart } from "@/content/report-chapters";
import { cn } from "@/lib/cn";

const sourceBadge: Record<
  ReportPart["source"],
  { label: string; tone: "celestial" | "neutral" | "accent" }
> = {
  sky: { label: "Cálculo + símbolo", tone: "celestial" },
  hands: { label: "Observação + símbolo", tone: "neutral" },
  journey: { label: "Síntese simbólica", tone: "accent" },
};

/** Navegação em abas pelas partes do relatório (conteúdo editorial, sem resultados). */
export function ReportExplorer({ parts }: { parts: readonly ReportPart[] }) {
  const [active, setActive] = useState(0);
  const id = useId();
  const part = parts[active];
  const badge = sourceBadge[part.source];

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label="Partes do relatório"
        className="grid grid-cols-3 gap-1 rounded-full bg-surface p-1 shadow-[inset_0_0_0_1px_var(--color-line-soft)]"
      >
        {parts.map((p, i) => (
          <button
            key={p.numeral}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={i === active}
            aria-controls={`${id}-panel`}
            onClick={() => setActive(i)}
            className={cn(
              "rounded-full px-2 py-2.5 text-xs font-medium transition-all duration-300 ease-soft sm:text-sm",
              i === active
                ? "bg-surface-bright text-fg shadow-[inset_0_1px_0_#ffffff14,0_0_0_1px_#ff7a3340]"
                : "text-fg-subtle hover:text-fg",
            )}
          >
            <span className="font-mono text-accent">{p.numeral}</span> {p.title}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${active}`}
        className="space-y-3"
      >
        <div className="flex items-center justify-between px-1">
          <p className="font-mono text-[0.65rem] tracking-[0.16em] text-fg-subtle uppercase">
            Parte {part.numeral} · {part.chapters.length} capítulos
          </p>
          <Badge tone={badge.tone}>{badge.label}</Badge>
        </div>
        <ol key={part.numeral} className="space-y-3">
          {part.chapters.map((chapter, i) => (
            <li
              key={chapter.number}
              className="group flex animate-fade-up items-center gap-4 rounded-3xl bg-surface/80 p-5 edge-light transition-colors duration-300 hover:bg-surface-raised"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="text-copper font-mono text-3xl font-medium tabular-nums">
                {String(chapter.number).padStart(2, "0")}
              </span>
              <div className="flex-1 space-y-1">
                <h3 className="font-semibold text-fg">{chapter.title}</h3>
                <p className="text-sm text-fg-muted">{chapter.summary}</p>
              </div>
              <Lock
                aria-label="Disponível no relatório completo"
                className="size-4 shrink-0 text-fg-subtle"
              />
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
