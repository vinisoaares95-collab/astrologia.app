import Link from "next/link";

import { Callout } from "@/components/ui";
import { cn } from "@/lib/cn";

/** Faixa da demonstração interna: deixa claro que não é um relatório real. */
export function DemoBanner({
  current,
  scenarios,
  basePath,
}: {
  current: string;
  scenarios: readonly { id: string; label: string }[];
  basePath: string;
}) {
  return (
    <div className="space-y-3">
      <Callout tone="demo" title="Demonstração interna com dados de exemplo">
        Nenhum capítulo foi gerado para uma pessoa real: os textos vêm das
        bibliotecas do Sidera aplicadas a um mapa e a observações fictícias. Os
        capítulos 8 e 9 ainda não têm definição. Não apresentar ao público como
        relatório completo.
      </Callout>
      <nav aria-label="Cenários de exemplo">
        <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {scenarios.map((s) => (
            <li key={s.id}>
              <Link
                href={`${basePath}?cenario=${s.id}`}
                aria-current={s.id === current ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-9 items-center rounded-full px-3 text-xs font-medium whitespace-nowrap",
                  s.id === current
                    ? "bg-surface-bright text-fg shadow-[0_0_0_1px_#ff7a3340]"
                    : "bg-surface text-fg-subtle hover:text-fg",
                )}
              >
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
