import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

const widths = {
  narrow: "max-w-xl",
  default: "max-w-5xl",
  wide: "max-w-6xl",
} as const;

export function Container({
  size = "default",
  className,
  ...props
}: ComponentProps<"div"> & { size?: keyof typeof widths }) {
  return (
    <div
      className={cn("mx-auto w-full px-5 sm:px-8", widths[size], className)}
      {...props}
    />
  );
}
