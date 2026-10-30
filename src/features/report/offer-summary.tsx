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
    <Card variant="glow" className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge tone="accent">Produto principal</Badge>
          <Badge tone="demo">Protótipo</Badge>
        </div>
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-xl font-semibold text-fg">{main.name}</h2>
          <p className="font-mono text-2xl font-medium whitespace-nowrap text-accent tabular-nums">
            {formatBRL(main.priceCents)}
          </p>
        </div>
        <p className="text-sm leading-relaxed text-fg-muted">
          {main.description}
        </p>
      </div>

      <fieldset className="space-y-2.5">
        <legend className="mb-3 font-mono text-[0.65rem] tracking-[0.16em] text-fg-subtle uppercase">
          Complementos opcionais
        </legend>
        {bumps.map((bump) => {
          const checked = selected.has(bump.slug);
          return (
            <label
              key={bump.slug}
              className={cn(
                "flex cursor-pointer gap-3.5 rounded-2xl p-4 transition-all duration-300 ease-soft",
                checked
                  ? "bg-accent-soft shadow-[0_0_0_1px_var(--color-accent)]"
                  : "bg-bg-deep/60 shadow-[0_0_0_1px_var(--color-line)] hover:shadow-[0_0_0_1px_#ff7a3366]",
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
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-all duration-300 ease-spring peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent",
                  checked
                    ? "scale-110 border-accent bg-accent text-bg-deep"
                    : "border-fg-subtle",
                )}
              >
                {checked && <Check className="size-3.5" strokeWidth={3} />}
              </span>
              <span className="flex-1 space-y-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium text-fg">
                    {bump.name}
                  </span>
                  <span className="font-mono text-xs whitespace-nowrap text-accent tabular-nums">
                    + {formatBRL(bump.priceCents)}
                  </span>
                </span>
                <span className="block text-xs leading-relaxed text-fg-muted">
                  {bump.description}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <div className="flex items-baseline justify-between border-t border-line pt-5">
        <span className="font-mono text-[0.65rem] tracking-[0.16em] text-fg-subtle uppercase">
          Total
        </span>
        <output
          aria-live="polite"
          className="font-mono text-3xl font-medium text-fg tabular-nums"
          data-testid="offer-total"
        >
          {formatBRL(total)}
        </output>
      </div>

      <div className="space-y-2.5">
        <Button size="lg" fullWidth disabled>
          <Lock aria-hidden className="size-4" />
          Pagamento disponível em breve
        </Button>
        <p className="text-center text-xs text-fg-subtle">
          Valores em validação. Nenhuma cobrança é feita nesta versão.
        </p>
      </div>
    </Card>
  );
}
