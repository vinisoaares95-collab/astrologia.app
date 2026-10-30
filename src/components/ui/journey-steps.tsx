import { journeySteps, type JourneyStepId } from "@/config/routes";
import { cn } from "@/lib/cn";

/** Indicador de progresso da jornada (puramente visual). */
export function JourneySteps({ current }: { current: JourneyStepId }) {
  const currentIndex = journeySteps.findIndex((step) => step.id === current);

  return (
    <nav aria-label="Etapas da jornada">
      <ol className="flex items-center gap-2">
        {journeySteps.map((step, index) => {
          const state =
            index < currentIndex
              ? "done"
              : index === currentIndex
                ? "current"
                : "upcoming";
          return (
            <li
              key={step.id}
              className="flex flex-1 flex-col gap-2"
              aria-current={state === "current" ? "step" : undefined}
            >
              <span
                className={cn(
                  "h-0.5 rounded-full transition-colors duration-500",
                  state === "upcoming" ? "bg-line" : "bg-accent",
                )}
              />
              <span
                className={cn(
                  "text-[0.7rem] font-medium tracking-wider uppercase",
                  state === "current"
                    ? "text-fg"
                    : state === "done"
                      ? "text-accent"
                      : "text-fg-subtle",
                )}
              >
                <span className="sr-only">
                  Etapa {index + 1} de {journeySteps.length}:{" "}
                </span>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
