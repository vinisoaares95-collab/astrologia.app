import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

import {
  ActionDock,
  Badge,
  ButtonLink,
  Callout,
  Container,
  FrameCorners,
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
    <Container size="narrow" className="flex flex-1 flex-col gap-6 pt-5">
      <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-3xl bg-surface/70 bg-[radial-gradient(70%_70%_at_50%_45%,#ff7a3324,transparent_70%)] edge-light">
        <FrameCorners />
        <PalmIllustration className="h-[78%]" />
        <div className="absolute top-5 left-5">
          <Badge tone="accent" dot>
            Enquadramento ideal
          </Badge>
        </div>
        <ul className="absolute right-5 bottom-5 space-y-1 text-right">
          {palmLines.map((line) => (
            <li
              key={line.id}
              className="flex items-center justify-end gap-2 font-mono text-[0.6rem] tracking-wider text-fg-muted uppercase"
            >
              {line.short}
              <span
                aria-hidden
                className="h-0.5 w-3 rounded-full"
                style={{ backgroundColor: line.color }}
              />
            </li>
          ))}
        </ul>
      </div>

      <SectionHeading
        as="h1"
        title="Vamos fotografar sua palma"
        description="Uma boa foto é o ponto de partida da leitura. Leva menos de um minuto."
      />

      <PhotoGuide />

      <Callout tone="privacy" title="Sua foto não sai do seu aparelho">
        Neste protótipo, a imagem é exibida apenas no seu navegador. Não é
        enviada, armazenada nem analisada, e é descartada ao sair.
      </Callout>

      <ActionDock>
        <ButtonLink href={routes.palmPhoto} size="lg" fullWidth>
          Estou pronto para fotografar
          <ArrowRight aria-hidden className="size-4" />
        </ButtonLink>
      </ActionDock>
    </Container>
  );
}
