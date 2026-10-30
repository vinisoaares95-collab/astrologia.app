import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

export function Card({
  className,
  raised,
  ...props
}: ComponentProps<"div"> & { raised?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-line-soft p-6 sm:p-8",
        raised ? "bg-surface-raised" : "bg-surface/70",
        className,
      )}
      {...props}
    />
  );
}
