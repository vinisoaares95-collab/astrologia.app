import type { Metadata } from "next";
import Link from "next/link";

import { Container, JourneySteps, SectionHeading } from "@/components/ui";
import { routes } from "@/config/routes";
import { PhotoCapture } from "@/features/palm-reading/components/photo-capture";

export const metadata: Metadata = {
  title: "Foto da palma",
};

export default function PalmPhotoPage() {
  return (
    <Container size="narrow" className="space-y-10 py-10 sm:py-16">
      <JourneySteps current="palm" />
      <SectionHeading
        as="h1"
        eyebrow="Passo 1"
        title="Fotografe sua palma"
        description="Use a câmera do celular ou escolha uma foto da galeria. Você poderá revisar e trocar antes de continuar."
      />
      <PhotoCapture />
      <p className="text-sm text-fg-subtle">
        Dúvidas sobre o enquadramento?{" "}
        <Link
          href={routes.palmIntro}
          className="text-accent underline-offset-4 hover:underline"
        >
          Rever as orientações
        </Link>
      </p>
    </Container>
  );
}
