import type { Metadata } from "next";

import { Container, SectionHeading } from "@/components/ui";
import { ConsentForm } from "@/features/palm-reading/components/consent-form";

export const metadata: Metadata = {
  title: "Antes da foto",
};

export default function PalmConsentPage() {
  return (
    <Container size="narrow" className="flex flex-1 flex-col gap-5 pt-5">
      <SectionHeading
        as="h1"
        title="Antes da foto"
        description="Como a imagem da sua palma será usada e qual mão fotografar."
      />
      <ConsentForm />
    </Container>
  );
}
