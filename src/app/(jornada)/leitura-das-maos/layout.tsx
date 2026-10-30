import { PalmPhotoProvider } from "@/features/palm-reading/palm-photo-context";

/**
 * A foto vive somente neste segmento. Ao sair de /leitura-das-maos, o provider
 * é desmontado e a imagem local é descartada.
 */
export default function PalmReadingLayout({
  children,
}: LayoutProps<"/leitura-das-maos">) {
  return <PalmPhotoProvider>{children}</PalmPhotoProvider>;
}
