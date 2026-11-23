import { PalmPhotoProvider } from "@/features/palm-reading/palm-photo-context";

/**
 * A foto vive somente neste segmento.
 *
 * Com cacheComponents, o Next.js esconde as rotas ao navegar (<Activity>) em
 * vez de desmontá-las. Ao sair de /leitura-das-maos, o provider encerra o
 * fluxo na limpeza dos efeitos (03G.3, D5): foto, consentimento, recibo e
 * resultado são descartados neste aparelho, tarefas em andamento são
 * abortadas e as telas internas são remontadas. Entre as etapas internas,
 * o layout continua visível e o progresso é mantido.
 */
export default function PalmReadingLayout({
  children,
}: LayoutProps<"/leitura-das-maos">) {
  return <PalmPhotoProvider>{children}</PalmPhotoProvider>;
}
