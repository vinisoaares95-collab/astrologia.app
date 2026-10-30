import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

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
        "text-xs font-semibold tracking-[0.22em] text-accent uppercase",
        className,
      )}
    >
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
        "space-y-3",
        align === "center" && "mx-auto max-w-2xl text-center",
        className,
      )}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Heading
        className={cn(
          "font-display font-light tracking-tight text-fg",
          Heading === "h1"
            ? "text-4xl leading-[1.05] sm:text-6xl"
            : "text-3xl leading-tight sm:text-4xl",
        )}
      >
        {title}
      </Heading>
      {description && (
        <p className="text-base leading-relaxed text-fg-muted sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
