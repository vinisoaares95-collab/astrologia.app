"use client";

import { Check } from "lucide-react";
import { useId, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/** Caixa de seleção acessível (checkbox nativo), no visual da oferta. */
export function Checkbox({
  checked,
  onChange,
  children,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  description?: ReactNode;
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3.5 rounded-2xl p-4 transition-all duration-300 ease-soft",
        checked
          ? "bg-accent-soft shadow-[0_0_0_1px_var(--color-accent)]"
          : "bg-bg-deep/60 shadow-[0_0_0_1px_var(--color-line)] hover:shadow-[0_0_0_1px_#ff7a3366]",
      )}
    >
      <input
        id={id}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
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
        <span className="block text-sm font-medium text-fg">{children}</span>
        {description && (
          <span className="block text-xs leading-relaxed text-fg-muted">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
