import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type Tone = "accent" | "celestial" | "neutral" | "demo";

const tones: Record<Tone, string> = {
  accent: "border-accent/40 bg-accent-soft text-accent-strong",
  celestial: "border-celestial/40 bg-celestial-soft text-celestial",
  neutral: "border-line bg-surface text-fg-muted",
  demo: "border-dashed border-celestial/60 bg-celestial-soft text-celestial",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
