import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** Pequeno bloco de dado: rótulo mono + valor. */
export function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="font-mono text-[0.65rem] tracking-[0.14em] text-fg-subtle uppercase">
        {label}
      </p>
      <p className="text-sm font-medium text-fg">{value}</p>
    </div>
  );
}
