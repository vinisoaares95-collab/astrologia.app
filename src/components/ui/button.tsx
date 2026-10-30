import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

type StyleOptions = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
};

const base =
  "group/button relative inline-flex items-center justify-center gap-2 rounded-full text-center leading-snug font-medium select-none transition-[background-color,box-shadow,color,transform,border-color] duration-300 ease-soft active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary:
    "bg-[linear-gradient(180deg,var(--color-accent-strong),var(--color-accent)_55%,var(--color-accent-deep))] text-bg-deep shadow-[inset_0_1px_0_#ffffff59,0_0_0_1px_#ff7a3366,0_10px_30px_-8px_#ff7a3399] hover:shadow-[inset_0_1px_0_#ffffff73,0_0_0_1px_#ff9b6299,0_14px_40px_-8px_#ff7a33cc]",
  secondary:
    "bg-surface-raised/80 text-fg shadow-[inset_0_1px_0_#ffffff14,0_0_0_1px_var(--color-line)] backdrop-blur hover:bg-surface-bright hover:shadow-[inset_0_1px_0_#ffffff1f,0_0_0_1px_#ff7a3355]",
  ghost: "text-fg-muted hover:bg-surface-raised hover:text-fg",
};

const sizes: Record<Size, string> = {
  sm: "min-h-9 px-4 py-1.5 text-[0.8rem]",
  md: "min-h-11 px-5 py-2 text-sm",
  lg: "min-h-14 px-7 py-3 text-[0.95rem]",
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

/** Botão circular só com ícone (voltar, fechar…). Exige `aria-label`. */
export function IconButtonLink({
  className,
  ...props
}: ComponentProps<typeof Link> & { "aria-label": string }) {
  return (
    <Link
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full bg-surface-raised/70 text-fg-muted shadow-[inset_0_1px_0_#ffffff10,0_0_0_1px_var(--color-line-soft)] backdrop-blur transition-colors duration-300 hover:text-fg active:scale-95",
        className,
      )}
      {...props}
    />
  );
}
