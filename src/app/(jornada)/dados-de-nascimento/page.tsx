import type { Metadata } from "next";

import { Container, SectionHeading } from "@/components/ui";
import { Mandala } from "@/components/visuals/mandala";
import { BirthDataForm } from "@/features/birth-data/birth-data-form";

export const metadata: Metadata = {
  title: "Dados de nascimento",
};

export default function BirthDataPage() {
  return (
    <Container size="narrow" className="flex flex-1 flex-col gap-6 pt-5">
      <div className="flex items-center gap-5">
        <SectionHeading
          as="h1"
          className="flex-1"
          title="Quando e onde você nasceu"
          description="Para calcular as posições dos astros naquele instante."
        />
        <Mandala detail="compact" className="size-20 shrink-0 sm:size-28" />
      </div>
      <BirthDataForm />
    </Container>
  );
}
