import { ArrowRight, Hand, Moon, ScrollText, Sparkles } from "lucide-react";

import {
  ButtonLink,
  Card,
  Container,
  Eyebrow,
  SectionHeading,
} from "@/components/ui";
import { Mandala } from "@/components/visuals/mandala";
import { PalmIllustration } from "@/components/visuals/palm-illustration";
import { routes } from "@/config/routes";
import { reportParts } from "@/content/report-chapters";

const journey = [
  {
    icon: Hand,
    title: "Fotografe sua palma",
    text: "Com orientações simples, direto do celular.",
  },
  {
    icon: Sparkles,
    title: "Receba uma prévia",
    text: "Um primeiro olhar simbólico, quando a imagem permitir.",
  },
  {
    icon: Moon,
    title: "Conte quando nasceu",
    text: "Data, horário e local para calcular seu céu.",
  },
  {
    icon: ScrollText,
    title: "Leia seu relatório",
    text: "Nove capítulos que unem céu e mãos.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <Container
          size="wide"
          className="grid items-center gap-12 pt-12 pb-20 sm:pt-20 lg:grid-cols-[1.1fr_1fr]"
        >
          <div className="animate-fade-up space-y-8">
            <Eyebrow>Astrologia · Quiromancia · Autoconhecimento</Eyebrow>
            <h1 className="font-display text-[2.6rem] leading-[1.04] font-light tracking-tight sm:text-6xl lg:text-7xl">
              O céu do seu nascimento.
              <br />
              <span className="text-accent italic">As linhas</span> das suas
              mãos.
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-fg-muted">
              Uma leitura simbólica e personalizada que reúne duas tradições
              antigas para inspirar reflexões sobre quem você é — sem promessas
              e sem previsões.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={routes.palmIntro} size="lg">
                Começar pela leitura das mãos
                <ArrowRight aria-hidden className="size-4" />
              </ButtonLink>
              <ButtonLink
                href={routes.howItWorks}
                variant="secondary"
                size="lg"
              >
                Como funciona
              </ButtonLink>
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-md">
            <Mandala className="absolute inset-0 size-full opacity-70" />
            <PalmIllustration className="absolute inset-[22%] size-[56%]" />
          </div>
        </Container>
      </section>

      {/* Jornada */}
      <section aria-labelledby="jornada" className="py-16">
        <Container size="wide" className="space-y-10">
          <SectionHeading
            eyebrow="A jornada"
            title={<span id="jornada">Quatro passos, no seu ritmo</span>}
          />
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {journey.map((step, index) => (
              <li key={step.title}>
                <Card className="h-full space-y-4">
                  <div className="flex items-center justify-between">
                    <step.icon aria-hidden className="size-5 text-accent" />
                    <span className="font-display text-2xl text-fg-subtle">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="text-xl text-fg">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-fg-muted">
                    {step.text}
                  </p>
                </Card>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Relatório */}
      <section aria-labelledby="relatorio" className="py-16">
        <Container size="wide" className="space-y-10">
          <SectionHeading
            eyebrow="O relatório completo"
            title={<span id="relatorio">Três partes, nove capítulos</span>}
            description="Um documento digital com mandala astral, fotografias anotadas quando tecnicamente possível e exportação em PDF."
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {reportParts.map((part) => (
              <Card key={part.numeral} className="space-y-5">
                <p className="font-display text-sm tracking-[0.2em] text-accent">
                  PARTE {part.numeral}
                </p>
                <h3 className="text-2xl text-fg">{part.title}</h3>
                <ul className="space-y-2 text-sm text-fg-muted">
                  {part.chapters.map((chapter) => (
                    <li key={chapter.number} className="flex gap-3">
                      <span className="w-5 shrink-0 text-fg-subtle tabular-nums">
                        {chapter.number}.
                      </span>
                      {chapter.title}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
          <ButtonLink href={routes.report} variant="ghost">
            Ver detalhes do relatório
            <ArrowRight aria-hidden className="size-4" />
          </ButtonLink>
        </Container>
      </section>

      {/* Transparência */}
      <section className="py-16">
        <Container size="default">
          <Card raised className="space-y-6 text-center sm:p-12">
            <Eyebrow>Com transparência</Eyebrow>
            <h2 className="mx-auto max-w-2xl text-3xl leading-tight font-light sm:text-4xl">
              Separamos o que é cálculo, o que é observação e o que é símbolo.
            </h2>
            <p className="mx-auto max-w-xl leading-relaxed text-fg-muted">
              Posições dos astros são calculadas com precisão astronômica. Os
              traços das mãos são observados na sua foto. Já as interpretações
              vêm de tradições simbólicas — não de comprovação científica.
            </p>
            <ButtonLink href={routes.howItWorks} variant="secondary">
              Entenda nossa abordagem
            </ButtonLink>
          </Card>
        </Container>
      </section>
    </>
  );
}
