"use client";

import { ChevronLeft, X } from "lucide-react";
import { usePathname } from "next/navigation";

import { IconButtonLink } from "@/components/ui/button";
import { JourneySteps } from "@/components/ui/journey-steps";
import { journeyScreens, journeySteps, routes } from "@/config/routes";

/** Barra superior das telas da jornada, no padrão de app mobile. */
export function FlowHeader() {
  const pathname = usePathname();
  const screen = journeyScreens[pathname] ?? journeyScreens[routes.palmIntro];
  const index = journeySteps.findIndex((s) => s.id === screen.step);

  return (
    <header className="sticky top-0 z-40 bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto max-w-5xl space-y-2.5 px-5 pt-safe pb-2.5 sm:px-8">
        <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center">
          <IconButtonLink href={screen.back} aria-label="Voltar">
            <ChevronLeft aria-hidden className="size-5" />
          </IconButtonLink>
          <div className="text-center">
            <p className="font-mono text-[0.625rem] tracking-[0.18em] text-accent uppercase">
              {String(index + 1).padStart(2, "0")} /{" "}
              {String(journeySteps.length).padStart(2, "0")}
            </p>
            <p className="text-sm font-medium text-fg">{screen.title}</p>
          </div>
          <IconButtonLink href={routes.home} aria-label="Sair da jornada">
            <X aria-hidden className="size-4" />
          </IconButtonLink>
        </div>
        <JourneySteps current={screen.step} />
      </div>
      <div
        aria-hidden
        className="h-px bg-[linear-gradient(90deg,transparent,var(--color-line),transparent)]"
      />
    </header>
  );
}
