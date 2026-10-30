import type { Metadata } from "next";

import { Container, JourneySteps, SectionHeading } from "@/components/ui";
import { BirthDataForm } from "@/features/birth-data/birth-data-form";

export const metadata: Metadata = {
  title: "Dados de nascimento",
};

export default function BirthDataPage() {
  return (
    <Container size="narrow" className="space-y-10 py-10 sm:py-16">
      <JourneySteps current="birth" />
      <SectionHeading
        as="h1"
        eyebrow="Passo 3"
        title="Quando e onde você nasceu"
        description="Com esses dados, as posições dos astros no momento do seu nascimento poderão ser calculadas."
      />
      <BirthDataForm />
    </Container>
  );
}
