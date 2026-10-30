"use client";

import { useId } from "react";

import { cn } from "@/lib/cn";

/** Interruptor acessível (checkbox nativo com aparência de toggle). */
export function Switch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl px-1 py-1"
    >
      <span className="space-y-0.5">
        <span className="block text-sm text-fg">{label}</span>
        {description && (
          <span className="block text-xs text-fg-subtle">{description}</span>
        )}
      </span>
      <input
        id={id}
        type="checkbox"
        role="switch"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent",
          checked ? "bg-accent" : "bg-surface-bright",
        )}
      >
        <span
          className={cn(
            "absolute top-1 left-1 size-5 rounded-full bg-fg shadow transition-transform duration-300 ease-spring",
            checked && "translate-x-5",
          )}
        />
      </span>
    </label>
  );
}
