import type { ReactNode } from "react";

import { FlowHeader } from "@/components/layout/flow-header";
import { JourneyProvider } from "@/features/report/journey/journey-context";

/**
 * Telas da jornada: barra de app com voltar, progresso e fechar.
 * `JourneyProvider` guarda, só em memória, o texto da leitura das mãos levado
 * da prévia ao relatório (Fase 04B); sair da jornada o descarta.
 */
export default function JourneyLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <FlowHeader />
      <main id="conteudo" className="flex flex-1 flex-col">
        <JourneyProvider>{children}</JourneyProvider>
      </main>
    </>
  );
}
