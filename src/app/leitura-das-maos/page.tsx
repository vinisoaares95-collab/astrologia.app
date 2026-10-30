import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

import {
  ButtonLink,
  Callout,
  Container,
  JourneySteps,
  SectionHeading,
} from "@/components/ui";
import {
  PalmIllustration,
  palmLines,
} from "@/components/visuals/palm-illustration";
import { routes } from "@/config/routes";
import { PhotoGuide } from "@/features/palm-reading/components/photo-guide";

export const metadata: Metadata = {
  title: "Leitura das mãos",
};

export default function PalmIntroPage() {
  return (
    <Container size="default" className="space-y-12 py-10 sm:py-16">
      <JourneySteps current="palm" />

      <div className="grid items-center gap-10 sm:grid-cols-[1fr_14rem]">
        <SectionHeading
          as="h1"
          eyebrow="Leitura simbólica das mãos"
          title="Sua palma, observada com atenção"
          description="Uma boa fotografia é o ponto de partida. Siga as orientações abaixo — leva menos de um minuto."
        />
        <figure className="mx-auto w-40 space-y-3 sm:w-full">
          <PalmIllustration />
          <figcaption className="space-y-1 text-xs text-fg-subtle">
            {palmLines.map((line) => (
              <span key={line.id} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-0.5 w-3 rounded-full"
                  style={{ backgroundColor: line.color }}
                />
                {line.label}
              </span>
            ))}
          </figcaption>
        </figure>
      </div>

      <PhotoGuide />

      <Callout tone="privacy" title="Sua foto não sai do seu aparelho">
        Neste protótipo, a imagem é exibida apenas no seu navegador. Ela não é
        enviada, armazenada nem analisada, e é descartada quando você sai desta
        experiência.
      </Callout>

      <ButtonLink
        href={routes.palmPhoto}
        size="lg"
        fullWidth
        className="sm:w-auto"
      >
        Estou pronto para fotografar
        <ArrowRight aria-hidden className="size-4" />
      </ButtonLink>
    </Container>
  );
}
