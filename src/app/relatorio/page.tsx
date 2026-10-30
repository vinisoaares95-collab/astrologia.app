import type { Metadata } from "next";
import { FileDown, Hand, Orbit, ScanLine } from "lucide-react";

import {
  Card,
  Container,
  Eyebrow,
  JourneySteps,
  SectionHeading,
} from "@/components/ui";
import { Mandala } from "@/components/visuals/mandala";
import { mainProduct, orderBumps } from "@/content/catalog";
import { reportParts } from "@/content/report-chapters";
import { OfferSummary } from "@/features/report/offer-summary";

export const metadata: Metadata = {
  title: "O relatório",
};

const includes = [
  { icon: Orbit, text: "Mandala astral do seu nascimento" },
  {
    icon: ScanLine,
    text: "Fotografias anotadas, quando tecnicamente possível",
  },
  { icon: Hand, text: "Leitura das linhas principais das mãos" },
  { icon: FileDown, text: "Exportação em PDF" },
];

export default function ReportPage() {
  return (
    <Container size="wide" className="space-y-14 py-10 sm:py-16">
      <div className="max-w-xl">
        <JourneySteps current="report" />
      </div>

      <div className="grid gap-12 lg:grid-cols-[1fr_26rem] lg:items-start">
        <div className="space-y-12">
          <div className="flex items-center gap-6">
            <SectionHeading
              as="h1"
              eyebrow="Relatório completo"
              title="Seu céu, suas mãos, sua jornada"
              description="Um relatório digital em nove capítulos, escrito para você ler com calma e voltar sempre que quiser."
            />
            <Mandala className="hidden size-40 shrink-0 opacity-60 sm:block" />
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {includes.map((item) => (
              <li
                key={item.text}
                className="flex items-center gap-3 rounded-2xl border border-line-soft bg-surface/50 p-4 text-sm text-fg-muted"
              >
                <item.icon
                  aria-hidden
                  className="size-5 shrink-0 text-accent"
                />
                {item.text}
              </li>
            ))}
          </ul>

          <div className="space-y-10">
            {reportParts.map((part) => (
              <section key={part.numeral} className="space-y-4">
                <Eyebrow>Parte {part.numeral}</Eyebrow>
                <h2 className="text-3xl font-light text-fg">{part.title}</h2>
                <ol className="divide-y divide-line-soft border-y border-line-soft">
                  {part.chapters.map((chapter) => (
                    <li key={chapter.number} className="flex gap-5 py-4">
                      <span className="w-8 shrink-0 font-display text-2xl text-fg-subtle tabular-nums">
                        {String(chapter.number).padStart(2, "0")}
                      </span>
                      <div className="space-y-1">
                        <h3 className="text-lg text-fg">{chapter.title}</h3>
                        <p className="text-sm text-fg-muted">
                          {chapter.summary}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24">
          <OfferSummary main={mainProduct} bumps={orderBumps} />
          <Card className="mt-4 p-5 text-xs leading-relaxed text-fg-subtle sm:p-5">
            As interpretações seguem tradições simbólicas da astrologia e da
            quiromancia. Não são previsões nem substituem orientação
            profissional.
          </Card>
        </aside>
      </div>
    </Container>
  );
}
