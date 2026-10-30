import { journeySteps, type JourneyStepId } from "@/config/routes";
import { cn } from "@/lib/cn";

/** Barra de progresso segmentada da jornada (puramente visual). */
export function JourneySteps({ current }: { current: JourneyStepId }) {
  const currentIndex = journeySteps.findIndex((step) => step.id === current);

  return (
    <ol className="flex gap-1.5" aria-label="Etapas da jornada">
      {journeySteps.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li
            key={step.id}
            className="relative h-1 flex-1 overflow-hidden rounded-full bg-line"
            aria-current={active ? "step" : undefined}
          >
            <span className="sr-only">
              Etapa {index + 1} de {journeySteps.length}: {step.label}
              {done ? " (concluída)" : active ? " (atual)" : ""}
            </span>
            <span
              aria-hidden
              className={cn(
                "absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-700 ease-soft",
                done
                  ? "w-full"
                  : active
                    ? "w-1/2 shadow-[0_0_12px_var(--color-accent)]"
                    : "w-0",
              )}
            />
          </li>
        );
      })}
    </ol>
  );
}
