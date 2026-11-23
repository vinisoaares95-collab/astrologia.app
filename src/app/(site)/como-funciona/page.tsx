import type { Metadata } from "next";
import { Eye, Orbit, Sparkles } from "lucide-react";

import {
  Badge,
  ButtonLink,
  Callout,
  Card,
  Container,
  SectionHeading,
} from "@/components/ui";
import { routes } from "@/config/routes";

export const metadata: Metadata = {
  title: "Como funciona",
};

const layers = [
  {
    icon: Orbit,
    badge: "Cálculo",
    tone: "celestial" as const,
    title: "Cálculos astronômicos",
    text: "A partir da data, do horário e do local de nascimento, calculam-se as posições do Sol, da Lua e dos planetas naquele instante. Essa parte é matemática e verificável.",
  },
  {
    icon: Eye,
    badge: "Observação",
    tone: "neutral" as const,
    title: "Características observadas",
    text: "Na fotografia, descrevem-se traços visíveis das mãos — formato, proporções e o desenho das linhas. Dependem da qualidade da imagem e podem ter limitações.",
  },
  {
    icon: Sparkles,
    badge: "Símbolo",
    tone: "accent" as const,
    title: "Interpretações simbólicas",
    text: "Os significados atribuídos a signos, planetas e linhas vêm de tradições culturais. Não são comprovados cientificamente e não determinam quem você é nem o que vai acontecer.",
  },
];

const faq = [
  {
    q: "A leitura prevê o meu futuro?",
    a: "Não. As leituras são convites à reflexão. Não fazemos previsões nem afirmações deterministas.",
  },
  {
    q: "O que acontece com a minha foto?",
    a: "Ela só sai do seu aparelho depois que você autoriza e toca em Analisar, e antes disso é copiada sem os dados de localização e do aparelho. Quando a análise por inteligência artificial está ligada, essa cópia vai ao servidor do Sidera e à Anthropic, nos Estados Unidos, só para a leitura. O Sidera não grava a foto; o texto da leitura fica até 10 minutos na memória do servidor. A Anthropic não usa o conteúdo para treinar modelos; a política comercial dela prevê exclusão em até 30 dias, com exceções, e a documentação técnica indica que certas chamadas não retêm conteúdo por padrão. Qual regra vale para a conta do Sidera ainda está sendo confirmado. O consentimento explica tudo antes de qualquer envio.",
  },
  {
    q: "Preciso saber meu horário de nascimento?",
    a: "Ajuda muito. Sem ele, partes como o Ascendente e as casas não podem ser calculadas com precisão — e o relatório indicará isso.",
  },
];

export default function HowItWorksPage() {
  return (
    <Container size="default" className="space-y-16 py-10 sm:py-16">
      <SectionHeading
        as="h1"
        eyebrow="Nossa abordagem"
        title="Três camadas, sempre identificadas"
        description="Para que você saiba exatamente o que está lendo, cada parte do relatório indica a sua origem."
      />

      <ol className="grid gap-4 sm:grid-cols-3">
        {layers.map((layer) => (
          <li key={layer.title}>
            <Card className="h-full space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <layer.icon aria-hidden className="size-5" />
                </span>
                <Badge tone={layer.tone}>{layer.badge}</Badge>
              </div>
              <h2 className="text-lg font-semibold text-fg">{layer.title}</h2>
              <p className="text-sm leading-relaxed text-fg-muted">
                {layer.text}
              </p>
            </Card>
          </li>
        ))}
      </ol>

      <Callout tone="info" title="Sobre astrologia e quiromancia">
        Astrologia e quiromancia não são métodos cientificamente comprovados
        para determinar personalidade ou prever acontecimentos. Nós as tratamos
        como linguagens simbólicas para o autoconhecimento.
      </Callout>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Perguntas frequentes</h2>
        <div className="divide-y divide-line-soft rounded-3xl bg-surface/80 px-5 edge-light">
          {faq.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-fg">
                {item.q}
                <span
                  aria-hidden
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-bright text-accent transition-transform duration-300 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="pt-3 text-sm leading-relaxed text-fg-muted">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <ButtonLink href={routes.palmIntro} size="lg">
        Começar pela leitura das mãos
      </ButtonLink>
    </Container>
  );
}
