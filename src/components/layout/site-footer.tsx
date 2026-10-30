import Link from "next/link";

import { Container } from "@/components/ui/container";
import { brand } from "@/config/brand";
import { mainNav, routes } from "@/config/routes";

import { Wordmark } from "./wordmark";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line-soft">
      <Container size="wide" className="space-y-8 py-12 text-sm text-fg-subtle">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Wordmark />
          <nav aria-label="Rodapé">
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-fg">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={routes.palmIntro} className="hover:text-fg">
                  Leitura das mãos
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <p className="max-w-3xl leading-relaxed">
          Astrologia e quiromancia são tradições simbólicas e não são métodos
          cientificamente comprovados para determinar personalidade ou prever
          acontecimentos. Nossas leituras são convites à reflexão, não
          diagnósticos nem previsões.
        </p>
        <p className="font-mono text-[0.7rem] tracking-wider uppercase">
          Protótipo · Fase 01 · {brand.company}
          {brand.isProvisional && " · marca provisória"}
        </p>
      </Container>
    </footer>
  );
}
