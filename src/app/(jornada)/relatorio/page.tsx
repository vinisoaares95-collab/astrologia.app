import type { Metadata } from "next";
import { FileDown, Hand, Orbit, ScanLine } from "lucide-react";

import {
  ActionDock,
  Badge,
  ButtonLink,
  Container,
  SectionHeading,
} from "@/components/ui";
import { Mandala } from "@/components/visuals/mandala";
import { mainProduct, orderBumps } from "@/content/catalog";
import { reportParts } from "@/content/report-chapters";
import { OfferSummary } from "@/features/report/offer-summary";
import { ReportExplorer } from "@/features/report/report-explorer";
import { formatBRL } from "@/lib/format";

export const metadata: Metadata = {
  title: "O relatório",
};

const includes = [
  { icon: Orbit, label: "Mandala astral" },
  { icon: ScanLine, label: "Fotos anotadas*" },
  { icon: Hand, label: "Linhas das mãos" },
  { icon: FileDown, label: "PDF" },
];

const chapterCount = reportParts.reduce((n, p) => n + p.chapters.length, 0);

export default function ReportPage() {
  return (
    <Container size="wide" className="flex flex-1 flex-col gap-8 pt-5 pb-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_25rem] lg:items-start lg:gap-12">
        <div className="flex flex-col gap-8">
          {/* Hero com mandala */}
          <section className="flex flex-col items-center gap-5 text-center">
            <div className="relative aspect-square w-full max-w-[19rem] sm:max-w-[22rem]">
              <div
                aria-hidden
                className="absolute inset-[15%] rounded-full bg-accent/15 blur-3xl"
              />
              <Mandala className="absolute inset-0 size-full" />
              <div className="absolute inset-[32%] flex flex-col items-center justify-center rounded-full bg-bg/85 shadow-[0_0_0_1px_var(--color-line)] backdrop-blur">
                <span className="text-copper font-mono text-[2rem] leading-none font-medium">
                  {chapterCount}
                </span>
                <span className="font-mono text-[0.6rem] tracking-[0.18em] text-fg-muted uppercase">
                  capítulos
                </span>
              </div>
            </div>
            <SectionHeading
              as="h1"
              align="center"
              eyebrow="Relatório completo"
              title="Seu céu, suas mãos, sua jornada"
              description="Um relatório digital interativo para ler com calma e voltar sempre que quiser."
            />
            <ul className="grid w-full grid-cols-4 gap-2">
              {includes.map((item) => (
                <li
                  key={item.label}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-surface/80 px-1 py-3 edge-light"
                >
                  <item.icon aria-hidden className="size-5 text-accent" />
                  <span className="text-[0.7rem] leading-tight text-fg-muted">
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
            <p className="-mt-3 text-[0.7rem] text-fg-subtle">
              * Quando tecnicamente possível, conforme a qualidade da foto.
            </p>
          </section>

          <section className="space-y-4" aria-labelledby="capitulos">
            <div className="flex items-end justify-between">
              <h2 id="capitulos" className="text-xl font-semibold">
                O que você vai ler
              </h2>
              <Badge>Sumário</Badge>
            </div>
            <ReportExplorer parts={reportParts} />
          </section>
          {/*
           * Barra fixa apenas enquanto a pessoa percorre os capítulos: fica
           * presa a esta coluna e sai de cena antes do card da oferta.
           */}
          <ActionDock className="-mb-4 lg:hidden">
            <div className="flex items-center gap-4 rounded-full bg-surface-raised/90 p-1.5 pl-5 shadow-[inset_0_1px_0_#ffffff14,0_0_0_1px_var(--color-line)] backdrop-blur-xl">
              <div className="flex-1">
                <p className="font-mono text-[0.6rem] tracking-[0.14em] text-fg-subtle uppercase">
                  A partir de
                </p>
                <p className="font-mono text-sm font-medium text-fg">
                  {formatBRL(mainProduct.priceCents)}
                </p>
              </div>
              <ButtonLink href="#oferta">Ver oferta</ButtonLink>
            </div>
          </ActionDock>
        </div>

        <aside
          id="oferta"
          className="scroll-mt-28 space-y-3 lg:sticky lg:top-32"
        >
          <OfferSummary main={mainProduct} bumps={orderBumps} />
          <p className="px-2 text-xs leading-relaxed text-fg-subtle">
            As interpretações seguem tradições simbólicas da astrologia e da
            quiromancia. Não são previsões nem substituem orientação
            profissional.
          </p>
        </aside>
      </div>
    </Container>
  );
}
