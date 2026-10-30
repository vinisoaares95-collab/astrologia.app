import { CircleAlert, FlaskConical, Info, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type Tone = "info" | "privacy" | "demo" | "danger";

const config: Record<
  Tone,
  { icon: typeof Info; className: string; role?: "alert" | "status" }
> = {
  info: {
    icon: Info,
    className: "border-line bg-surface text-fg-muted",
  },
  privacy: {
    icon: ShieldCheck,
    className: "border-success/30 bg-success-soft text-fg-muted",
  },
  demo: {
    icon: FlaskConical,
    className: "border-dashed border-celestial/60 bg-celestial-soft text-fg",
  },
  danger: {
    icon: CircleAlert,
    className: "border-danger/40 bg-danger-soft text-fg",
    role: "alert",
  },
};

const iconColor: Record<Tone, string> = {
  info: "text-fg-subtle",
  privacy: "text-success",
  demo: "text-celestial",
  danger: "text-danger",
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
  const { icon: Icon, className: toneClass, role } = config[tone];
  return (
    <div
      role={role}
      className={cn(
        "flex gap-3 rounded-2xl border p-4 text-sm leading-relaxed",
        toneClass,
        className,
      )}
    >
      <Icon
        aria-hidden
        className={cn("mt-0.5 size-4 shrink-0", iconColor[tone])}
      />
      <div className="space-y-1">
        {title && <p className="font-semibold text-fg">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
