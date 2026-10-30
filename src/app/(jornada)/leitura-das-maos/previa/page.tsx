import type { Metadata } from "next";

import { Container, SectionHeading } from "@/components/ui";
import { DemoPreview } from "@/features/palm-reading/components/demo-preview";

export const metadata: Metadata = {
  title: "Prévia da leitura",
};

export default function PalmPreviewPage() {
  return (
    <Container size="narrow" className="flex flex-1 flex-col gap-6 pt-6">
      <SectionHeading
        as="h1"
        title="Sua prévia"
        description="Um primeiro olhar sobre as linhas das mãos."
      />
      <DemoPreview />
    </Container>
  );
}
