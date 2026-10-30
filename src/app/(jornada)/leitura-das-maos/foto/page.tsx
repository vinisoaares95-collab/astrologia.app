import type { Metadata } from "next";

import { Container, SectionHeading } from "@/components/ui";
import { PhotoCapture } from "@/features/palm-reading/components/photo-capture";

export const metadata: Metadata = {
  title: "Foto da palma",
};

export default function PalmPhotoPage() {
  return (
    <Container size="narrow" className="flex flex-1 flex-col gap-6 pt-6">
      <SectionHeading
        as="h1"
        title="Fotografe sua palma"
        description="Use a câmera ou escolha da galeria. Você revisa antes de continuar."
      />
      <PhotoCapture />
    </Container>
  );
}
