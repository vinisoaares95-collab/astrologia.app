import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { mainNav, routes } from "@/config/routes";

import { Wordmark } from "./wordmark";

/** Header flutuante em cápsula, translúcido. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 rounded-full bg-surface/70 pr-2 pl-4 shadow-[inset_0_1px_0_#ffffff12,0_0_0_1px_var(--color-line-soft),0_12px_32px_-16px_#000] backdrop-blur-xl">
        <Wordmark />
        <nav aria-label="Principal" className="ml-auto hidden sm:block">
          <ul className="flex items-center gap-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-full px-3.5 py-2 text-sm text-fg-muted transition-colors duration-300 hover:bg-surface-raised hover:text-fg"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <ButtonLink
          href={routes.palmIntro}
          size="sm"
          className="ml-auto sm:ml-0"
        >
          Começar
          <ArrowUpRight aria-hidden className="size-3.5" />
        </ButtonLink>
      </div>
    </header>
  );
}
