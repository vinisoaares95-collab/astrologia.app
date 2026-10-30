import { cn } from "@/lib/cn";

import { Mandala } from "./mandala";
import { PalmIllustration } from "./palm-illustration";

const chips = [
  {
    label: "Céu",
    value: "Sol · Lua · Ascendente",
    className: "top-[6%] left-0 sm:-left-4",
  },
  {
    label: "Mãos",
    value: "3 linhas principais",
    className: "top-[44%] right-0 sm:-right-6",
  },
  {
    label: "Relatório",
    value: "9 capítulos · PDF",
    className: "bottom-[4%] left-[8%]",
  },
];

/** Composição principal: mandala + palma + etiquetas flutuantes. */
export function HeroOrb({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative mx-auto aspect-square w-full max-w-[28rem]",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-[12%] rounded-full bg-accent/20 blur-3xl"
      />
      <Mandala className="absolute inset-0 size-full" />
      <div className="absolute inset-[29%] flex items-center justify-center rounded-full bg-bg/80 shadow-[inset_0_1px_0_#ffffff14,0_0_0_1px_var(--color-line),0_0_60px_-10px_#ff7a3366] backdrop-blur">
        <PalmIllustration className="h-[78%]" />
      </div>
      {chips.map((chip, i) => (
        <div
          key={chip.label}
          className={cn(
            "absolute animate-fade-up rounded-2xl bg-surface-raised/85 px-3 py-2 shadow-[inset_0_1px_0_#ffffff14,0_0_0_1px_var(--color-line),0_16px_32px_-12px_#000] backdrop-blur-md",
            chip.className,
          )}
          style={{ animationDelay: `${600 + i * 180}ms` }}
        >
          <p className="font-mono text-[0.6rem] tracking-[0.16em] text-accent uppercase">
            {chip.label}
          </p>
          <p className="text-xs font-medium whitespace-nowrap text-fg">
            {chip.value}
          </p>
        </div>
      ))}
    </div>
  );
}
