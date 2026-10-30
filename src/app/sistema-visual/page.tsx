import type { Metadata } from "next";

import {
  Badge,
  Button,
  Callout,
  Card,
  Container,
  Eyebrow,
  JourneySteps,
  SectionHeading,
} from "@/components/ui";
import { Mandala } from "@/components/visuals/mandala";
import { PalmIllustration } from "@/components/visuals/palm-illustration";

export const metadata: Metadata = {
  title: "Sistema visual",
};

const colors = [
  ["bg", "bg-bg"],
  ["surface", "bg-surface"],
  ["surface-raised", "bg-surface-raised"],
  ["line", "bg-line"],
  ["fg", "bg-fg"],
  ["fg-muted", "bg-fg-muted"],
  ["accent", "bg-accent"],
  ["accent-strong", "bg-accent-strong"],
  ["celestial", "bg-celestial"],
  ["success", "bg-success"],
  ["danger", "bg-danger"],
] as const;

/** Referência interna dos tokens e componentes da Fase 01. */
export default function DesignSystemPage() {
  return (
    <Container size="wide" className="space-y-16 py-10 sm:py-16">
      <SectionHeading
        as="h1"
        eyebrow="Interno"
        title="Sistema visual provisório"
        description="Tokens e componentes base. Os nomes são semânticos para permitir a troca de identidade sem alterar os componentes."
      />

      <section className="space-y-4">
        <Eyebrow>Cores</Eyebrow>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {colors.map(([name, className]) => (
            <li key={name} className="space-y-2">
              <div
                className={`h-16 rounded-2xl border border-line ${className}`}
              />
              <p className="font-mono text-xs text-fg-muted">{name}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <Eyebrow>Tipografia</Eyebrow>
        <Card className="space-y-4">
          <p className="font-display text-5xl font-light">Fraunces — títulos</p>
          <p className="font-display text-2xl text-accent italic">
            Itálico editorial para ênfase
          </p>
          <p className="max-w-prose text-fg-muted">
            Manrope — texto corrido, interface e formulários. Legível em telas
            pequenas, com bom espaçamento entre linhas.
          </p>
        </Card>
      </section>

      <section className="space-y-4">
        <Eyebrow>Ações</Eyebrow>
        <div className="flex flex-wrap gap-3">
          <Button>Primário</Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="ghost">Discreto</Button>
          <Button disabled>Desabilitado</Button>
          <Button size="lg">Grande</Button>
        </div>
      </section>

      <section className="space-y-4">
        <Eyebrow>Selos e avisos</Eyebrow>
        <div className="flex flex-wrap gap-2">
          <Badge>Neutro</Badge>
          <Badge tone="accent">Destaque</Badge>
          <Badge tone="celestial">Cálculo</Badge>
          <Badge tone="demo">Demonstração</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Callout tone="info" title="Informação">
            Mensagem de orientação.
          </Callout>
          <Callout tone="privacy" title="Privacidade">
            Mensagem de privacidade.
          </Callout>
          <Callout tone="demo" title="Demonstração">
            Conteúdo não processado.
          </Callout>
          <Callout tone="danger" title="Erro">
            Algo precisa de atenção.
          </Callout>
        </div>
      </section>

      <section className="space-y-4">
        <Eyebrow>Progresso da jornada</Eyebrow>
        <div className="max-w-xl">
          <JourneySteps current="preview" />
        </div>
      </section>

      <section className="space-y-4">
        <Eyebrow>Ilustrações</Eyebrow>
        <div className="flex flex-wrap items-center gap-10">
          <Mandala className="size-48" animated={false} />
          <PalmIllustration className="w-32" animated={false} />
        </div>
      </section>
    </Container>
  );
}
