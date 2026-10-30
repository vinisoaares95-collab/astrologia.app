import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** Rótulo técnico em mono com marcador cobre. */
export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 font-mono text-[0.7rem] font-medium tracking-[0.18em] text-fg-muted uppercase",
        className,
      )}
    >
      <span aria-hidden className="h-px w-5 bg-accent" />
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  as: Heading = "h2",
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  as?: "h1" | "h2" | "h3";
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "space-y-2.5",
        align === "center" &&
          "mx-auto max-w-2xl text-center [&>p]:justify-center",
        className,
      )}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Heading
        className={cn(
          "font-semibold text-fg",
          Heading === "h1"
            ? "text-[1.75rem] leading-[1.1] sm:text-4xl lg:text-5xl"
            : "text-[1.375rem] leading-tight sm:text-3xl",
        )}
      >
        {title}
      </Heading>
      {description && (
        <p className="text-[0.9375rem] leading-relaxed text-fg-muted sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}
