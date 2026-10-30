import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { mainNav, routes } from "@/config/routes";

import { Wordmark } from "./wordmark";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line-soft/60 bg-bg/75 backdrop-blur-md">
      <Container size="wide" className="flex h-16 items-center gap-6">
        <Wordmark />
        <nav aria-label="Principal" className="ml-auto hidden sm:block">
          <ul className="flex items-center gap-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-full px-3 py-2 text-sm text-fg-muted transition-colors hover:text-fg"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <ButtonLink
          href={routes.palmIntro}
          variant="secondary"
          className="ml-auto min-h-9 px-4 py-1 text-xs sm:ml-0"
        >
          Começar
        </ButtonLink>
      </Container>
    </header>
  );
}
