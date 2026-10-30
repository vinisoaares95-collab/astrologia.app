import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type Tone = "accent" | "celestial" | "neutral" | "demo" | "success";

const tones: Record<Tone, string> = {
  accent: "border-accent/35 bg-accent-soft text-accent-strong",
  celestial: "border-celestial/30 bg-celestial-soft text-celestial",
  neutral: "border-line bg-surface-raised/70 text-fg-muted",
  demo: "border-dashed border-accent/50 bg-accent-soft text-accent-strong",
  success: "border-success/30 bg-success-soft text-success",
};

/** Selo em fonte mono, maiúsculas — rótulos de dados e estados. */
export function Badge({
  tone = "neutral",
  dot,
  className,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.65rem] font-medium tracking-[0.12em] whitespace-nowrap uppercase",
        tones[tone],
        className,
      )}
    >
      {dot && (
        <span
          aria-hidden
          className="size-1.5 animate-pulse-glow rounded-full bg-current"
        />
      )}
      {children}
    </span>
  );
}
