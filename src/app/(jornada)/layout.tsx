import type { ReactNode } from "react";

import { FlowHeader } from "@/components/layout/flow-header";

/** Telas da jornada: barra de app com voltar, progresso e fechar. */
export default function JourneyLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <FlowHeader />
      <main id="conteudo" className="flex flex-1 flex-col">
        {children}
      </main>
    </>
  );
}
