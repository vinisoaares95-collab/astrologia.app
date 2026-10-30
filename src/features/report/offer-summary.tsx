"use client";

import { Check, Lock } from "lucide-react";
import { useState } from "react";

import { Badge, Button, Card } from "@/components/ui";
import type { CatalogItem } from "@/content/catalog";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/format";

export function OfferSummary({
  main,
  bumps,
}: {
  main: CatalogItem;
  bumps: readonly CatalogItem[];
}) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  const total =
    main.priceCents +
    bumps.reduce(
      (sum, b) => sum + (selected.has(b.slug) ? b.priceCents : 0),
      0,
    );

  return (
    <Card raised className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl text-fg">{main.name}</h2>
          <p className="text-sm leading-relaxed text-fg-muted">
            {main.description}
          </p>
        </div>
        <p className="font-display text-2xl whitespace-nowrap text-accent tabular-nums">
          {formatBRL(main.priceCents)}
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="mb-3 text-sm font-medium text-fg">
          Complementos opcionais
        </legend>
        {bumps.map((bump) => {
          const checked = selected.has(bump.slug);
          return (
            <label
              key={bump.slug}
              className={cn(
                "flex cursor-pointer gap-4 rounded-2xl border p-4 transition-colors duration-300",
                checked
                  ? "border-accent/70 bg-accent-soft"
                  : "border-line hover:border-line hover:bg-surface",
              )}
            >
              <input
                type="checkbox"
                className="peer sr-only"
                checked={checked}
                onChange={() => toggle(bump.slug)}
              />
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent",
                  checked
                    ? "border-accent bg-accent text-bg"
                    : "border-fg-subtle",
                )}
              >
                {checked && <Check className="size-3.5" strokeWidth={3} />}
              </span>
              <span className="flex-1 space-y-1">
                <span className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-fg">{bump.name}</span>
                  <span className="text-sm whitespace-nowrap text-accent tabular-nums">
                    + {formatBRL(bump.priceCents)}
                  </span>
                </span>
                <span className="block text-sm leading-relaxed text-fg-muted">
                  {bump.description}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <div className="flex items-baseline justify-between border-t border-line-soft pt-5">
        <span className="text-sm text-fg-muted">Total</span>
        <output
          aria-live="polite"
          className="font-display text-3xl text-fg tabular-nums"
          data-testid="offer-total"
        >
          {formatBRL(total)}
        </output>
      </div>

      <div className="space-y-3">
        <Button size="lg" fullWidth disabled>
          <Lock aria-hidden className="size-4" />
          Pagamento disponível em breve
        </Button>
        <div className="flex flex-wrap items-center justify-center gap-2 text-center">
          <Badge tone="demo">Protótipo</Badge>
          <p className="text-xs text-fg-subtle">
            Valores em validação. Nenhuma cobrança é feita nesta versão.
          </p>
        </div>
      </div>
    </Card>
  );
}
