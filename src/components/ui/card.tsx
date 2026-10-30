import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

type Variant = "default" | "raised" | "glow";

const variants: Record<Variant, string> = {
  default:
    "bg-[linear-gradient(180deg,#ffffff08,#ffffff02)] bg-surface/80 edge-light",
  raised:
    "bg-[linear-gradient(180deg,#ffffff0d,#ffffff03)] bg-surface-raised edge-light",
  glow: "bg-[radial-gradient(120%_80%_at_50%_0%,#ff7a3326,transparent_60%),linear-gradient(180deg,#ffffff0d,#ffffff03)] bg-surface-raised shadow-[inset_0_1px_0_#ffffff1a,0_0_0_1px_#ff7a3340,0_30px_60px_-30px_#ff7a3366]",
};

export function Card({
  className,
  variant = "default",
  ...props
}: ComponentProps<"div"> & { variant?: Variant }) {
  return (
    <div
      className={cn(
        "relative rounded-[1.75rem] p-5 sm:p-7",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
