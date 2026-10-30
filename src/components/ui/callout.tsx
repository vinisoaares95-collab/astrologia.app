import { CircleAlert, FlaskConical, Info, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type Tone = "info" | "privacy" | "demo" | "danger";

const config: Record<
  Tone,
  { icon: typeof Info; box: string; icon_: string; role?: "alert" }
> = {
  info: {
    icon: Info,
    box: "border-line bg-surface-raised/60",
    icon_: "bg-surface-bright text-fg-muted",
  },
  privacy: {
    icon: ShieldCheck,
    box: "border-success/20 bg-success-soft",
    icon_: "bg-success/15 text-success",
  },
  demo: {
    icon: FlaskConical,
    box: "border-dashed border-accent/45 bg-accent-soft",
    icon_: "bg-accent/15 text-accent-strong",
  },
  danger: {
    icon: CircleAlert,
    box: "border-danger/35 bg-danger-soft",
    icon_: "bg-danger/15 text-danger",
    role: "alert",
  },
};

export function Callout({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const { icon: Icon, box, icon_, role } = config[tone];
  return (
    <div
      role={role}
      className={cn(
        "flex gap-3 rounded-2xl border p-3.5 text-[0.8125rem] leading-relaxed text-fg-muted",
        box,
        className,
      )}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-lg",
          icon_,
        )}
      >
        <Icon aria-hidden className="size-4" />
      </span>
      <div className="space-y-0.5 pt-0.5">
        {title && <p className="font-medium text-fg">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
