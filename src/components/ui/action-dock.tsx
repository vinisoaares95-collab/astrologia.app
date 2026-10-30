import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Área de ações fixa no rodapé em telas pequenas (padrão de app).
 * Em telas maiores, volta ao fluxo normal da página.
 */
export function ActionDock({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-30 -mx-5 mt-auto bg-[linear-gradient(to_top,var(--color-bg)_62%,transparent)] px-5 pt-7 pb-safe sm:static sm:mx-0 sm:bg-none sm:px-0 sm:pt-2 sm:pb-8",
        className,
      )}
    >
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}
