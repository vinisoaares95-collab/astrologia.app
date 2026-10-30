import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

type StyleOptions = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full text-center leading-snug font-medium tracking-wide transition duration-300 ease-soft select-none disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-bg shadow-[0_0_0_1px_var(--color-accent-strong)_inset,0_8px_24px_-12px_var(--color-accent)] hover:bg-accent-strong",
  secondary:
    "border border-line bg-surface/60 text-fg backdrop-blur hover:border-accent/60 hover:bg-surface-raised",
  ghost: "text-fg-muted hover:bg-surface hover:text-fg",
};

const sizes: Record<Size, string> = {
  md: "min-h-11 px-5 py-2 text-sm",
  lg: "min-h-13 px-7 py-3 text-base",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
}: StyleOptions = {}) {
  return cn(
    base,
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
    className,
  );
}

type ButtonProps = ComponentProps<"button"> & Omit<StyleOptions, "className">;

export function Button({
  variant,
  size,
  fullWidth,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> &
  Omit<StyleOptions, "className">;

export function ButtonLink({
  variant,
  size,
  fullWidth,
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={buttonStyles({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}
