import type { Metadata } from "next";

import { Container, JourneySteps, SectionHeading } from "@/components/ui";
import { DemoPreview } from "@/features/palm-reading/components/demo-preview";

export const metadata: Metadata = {
  title: "Prévia da leitura",
};

export default function PalmPreviewPage() {
  return (
    <Container size="default" className="space-y-10 py-10 sm:py-16">
      <JourneySteps current="preview" />
      <SectionHeading
        as="h1"
        eyebrow="Passo 2"
        title="Sua prévia"
        description="Um primeiro olhar sobre as linhas das mãos, como ele será apresentado."
      />
      <DemoPreview />
    </Container>
  );
}
