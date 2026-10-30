import {
  ArrowRight,
  ChevronRight,
  Clock3,
  Eye,
  Hand,
  Lock,
  Moon,
  Orbit,
  ScrollText,
  ShieldCheck,
  Sparkles,
  UserRoundX,
} from "lucide-react";
import Link from "next/link";

import {
  Badge,
  ButtonLink,
  Card,
  Container,
  SectionHeading,
} from "@/components/ui";
import { HeroOrb } from "@/components/visuals/hero-orb";
import { Mandala } from "@/components/visuals/mandala";
import { routes } from "@/config/routes";
import { mainProduct } from "@/content/catalog";
import { reportParts } from "@/content/report-chapters";
import { formatBRL } from "@/lib/format";

const journey = [
  {
    icon: Hand,
    title: "Fotografe a palma",
    text: "Guiado, direto do celular.",
  },
  {
    icon: Sparkles,
    title: "Veja a prévia",
    text: "Um primeiro olhar simbólico.",
  },
  {
    icon: Moon,
    title: "Informe o nascimento",
    text: "Data, horário e cidade.",
  },
  {
    icon: ScrollText,
    title: "Leia o relatório",
    text: "Nove capítulos, céu e mãos.",
  },
];

const assurances = [
  { icon: Clock3, text: "1 minuto" },
  { icon: ShieldCheck, text: "Foto fica no aparelho" },
  { icon: UserRoundX, text: "Sem cadastro" },
];

const layers = [
  {
    icon: Orbit,
    badge: "Cálculo",
    tone: "celestial" as const,
    text: "Posições dos astros, com precisão astronômica.",
  },
  {
    icon: Eye,
    badge: "Observação",
    tone: "neutral" as const,
    text: "Traços visíveis na fotografia das mãos.",
  },
  {
    icon: Sparkles,
    badge: "Símbolo",
    tone: "accent" as const,
    text: "Significados de tradições — não ciência.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section>
        <Container
          size="wide"
          className="grid gap-x-12 gap-y-6 pt-8 pb-16 sm:gap-y-8 sm:pt-16 lg:grid-cols-[1fr_1.05fr] lg:grid-rows-[auto_1fr] lg:items-center lg:pt-24"
        >
          <div className="animate-fade-up space-y-5 lg:self-end">
            <Badge tone="accent" dot>
              Leitura simbólica personalizada
            </Badge>
            <h1 className="text-[2.4rem] leading-[1.02] font-semibold tracking-[-0.04em] sm:text-6xl lg:text-[4.25rem]">
              Seu céu.
              <br />
              Suas mãos.
              <br />
              <span className="text-copper">Uma leitura só sua.</span>
            </h1>
            <p className="text-[0.95rem] leading-relaxed text-fg-muted lg:hidden">
              Mapa astral + leitura das mãos em um relatório de
              autoconhecimento.
            </p>
          </div>

          <HeroOrb className="max-w-[19rem] sm:max-w-[28rem] lg:col-start-2 lg:row-span-2 lg:row-start-1" />

          <div className="animate-fade-up space-y-6 [animation-delay:200ms] lg:self-start">
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={routes.palmIntro} size="lg">
                Começar pela leitura da mão
                <ArrowRight
                  aria-hidden
                  className="size-4 transition-transform duration-300 group-hover/button:translate-x-0.5"
                />
              </ButtonLink>
              <ButtonLink
                href={routes.howItWorks}
                variant="secondary"
                size="lg"
              >
                Como funciona
              </ButtonLink>
            </div>
            <p className="hidden max-w-md text-[1.05rem] leading-relaxed text-fg-muted lg:block">
              Mapa astral e linhas das mãos reunidos em um relatório de
              autoconhecimento — com transparência sobre o que é cálculo e o que
              é símbolo.
            </p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-fg-subtle">
              {assurances.map((item) => (
                <li key={item.text} className="flex items-center gap-1.5">
                  <item.icon aria-hidden className="size-3.5 text-accent" />
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* Jornada — carrossel no mobile */}
      <section aria-labelledby="jornada" className="py-14">
        <Container size="wide" className="space-y-8">
          <SectionHeading
            eyebrow="A jornada"
            title={<span id="jornada">Quatro passos, no seu ritmo</span>}
          />
          <ol className="-mx-5 flex snap-x snap-mandatory [scrollbar-width:none] gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {journey.map((step, index) => (
              <li
                key={step.title}
                className="w-[72%] shrink-0 snap-start sm:w-auto"
              >
                <Card className="flex h-full flex-col gap-10">
                  <div className="flex items-start justify-between">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-accent-soft text-accent shadow-[inset_0_0_0_1px_#ff7a3333]">
                      <step.icon aria-hidden className="size-5" />
                    </span>
                    <span className="font-mono text-xs text-fg-subtle">
                      0{index + 1}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-fg">
                      {step.title}
                    </h3>
                    <p className="text-sm text-fg-muted">{step.text}</p>
                  </div>
                </Card>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Relatório — prévia em formato de app */}
      <section aria-labelledby="relatorio" className="py-14">
        <Container
          size="wide"
          className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center"
        >
          <div className="space-y-6">
            <SectionHeading
              eyebrow="O relatório completo"
              title={
                <span id="relatorio">Um produto profundo, feito para você</span>
              }
              description="Mandala astral, fotografias anotadas quando tecnicamente possível, interpretações simbólicas e exportação em PDF."
            />
            <ButtonLink href={routes.report} variant="secondary">
              Explorar o relatório
              <ChevronRight aria-hidden className="size-4" />
            </ButtonLink>
          </div>

          <Card variant="raised" className="space-y-5 p-4 sm:p-6">
            <div className="flex items-center gap-4 rounded-2xl bg-bg/60 p-3 shadow-[0_0_0_1px_var(--color-line-soft)]">
              <Mandala detail="compact" className="size-16 shrink-0" />
              <div className="flex-1">
                <p className="font-mono text-[0.6rem] tracking-[0.16em] text-accent uppercase">
                  Seu relatório
                </p>
                <p className="font-semibold text-fg">Céu, mãos e jornada</p>
                <p className="text-xs text-fg-subtle">3 partes · 9 capítulos</p>
              </div>
              <Badge tone="demo">Exemplo</Badge>
            </div>
            <ul className="space-y-2">
              {reportParts.map((part) => (
                <li key={part.numeral}>
                  <Link
                    href={routes.report}
                    className="flex items-center gap-4 rounded-2xl px-3 py-3 transition-colors duration-300 hover:bg-surface-bright/60"
                  >
                    <span className="flex size-10 items-center justify-center rounded-xl bg-surface-bright font-mono text-xs text-accent">
                      {part.numeral}
                    </span>
                    <span className="flex-1">
                      <span className="block font-medium text-fg">
                        {part.title}
                      </span>
                      <span className="block text-xs text-fg-subtle">
                        {part.chapters.map((c) => c.title).join(" · ")}
                      </span>
                    </span>
                    <span className="font-mono text-xs text-fg-subtle">
                      {part.chapters.length} cap.
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between rounded-2xl border border-dashed border-line px-4 py-3 text-xs text-fg-subtle">
              <span className="flex items-center gap-2">
                <Lock aria-hidden className="size-3.5" />
                Disponível no relatório completo
              </span>
              <span className="font-mono text-accent">
                {formatBRL(mainProduct.priceCents)}
              </span>
            </div>
          </Card>
        </Container>
      </section>

      {/* Transparência */}
      <section className="py-14">
        <Container size="wide" className="space-y-8">
          <SectionHeading
            eyebrow="Transparência"
            title="Cálculo, observação e símbolo — sempre identificados"
          />
          <div className="grid gap-3 sm:grid-cols-3">
            {layers.map((layer) => (
              <Card
                key={layer.badge}
                className="flex items-center gap-4 sm:flex-col sm:items-start"
              >
                <layer.icon
                  aria-hidden
                  className="size-5 shrink-0 text-fg-muted"
                />
                <div className="space-y-2">
                  <Badge tone={layer.tone}>{layer.badge}</Badge>
                  <p className="text-sm text-fg-muted">{layer.text}</p>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA final */}
      <section className="py-14">
        <Container size="default">
          <Card
            variant="glow"
            className="flex flex-col items-center gap-6 overflow-hidden py-12 text-center sm:py-16"
          >
            <Mandala className="absolute -top-40 left-1/2 size-[30rem] -translate-x-1/2 opacity-30" />
            <h2 className="relative max-w-lg text-3xl font-semibold sm:text-4xl">
              Comece pela palma da sua mão
            </h2>
            <p className="relative max-w-md text-fg-muted">
              Uma foto, um minuto — e a primeira página da sua leitura.
            </p>
            <ButtonLink href={routes.palmIntro} size="lg" className="relative">
              Começar agora
              <ArrowRight aria-hidden className="size-4" />
            </ButtonLink>
          </Card>
        </Container>
      </section>
    </>
  );
}
