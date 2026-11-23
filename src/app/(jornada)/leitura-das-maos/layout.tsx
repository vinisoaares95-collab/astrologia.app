import { PalmPhotoProvider } from "@/features/palm-reading/palm-photo-context";

/**
 * A foto vive somente neste segmento.
 *
 * Atenção (verificado na 03G.3): com cacheComponents, o Next.js esconde as
 * rotas ao navegar (<Activity>) em vez de desmontá-las. Ao sair de
 * /leitura-das-maos, a URL local da foto é revogada (limpeza dos efeitos),
 * mas o estado do provider (foto preparada, consentimento, recibo,
 * resultado) continua na memória da aba até recarregar, fechar ou a rota
 * sair do cache de navegação. Correção de comportamento proposta no Bloco 2
 * (docs/privacidade/08-bloco2-arquitetura.md).
 */
export default function PalmReadingLayout({
  children,
}: LayoutProps<"/leitura-das-maos">) {
  return <PalmPhotoProvider>{children}</PalmPhotoProvider>;
}
