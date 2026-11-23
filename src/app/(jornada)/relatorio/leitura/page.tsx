import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { Container } from "@/components/ui";
import { routes } from "@/config/routes";
import { buildIntegratedReport } from "@/features/report/integrated/build";
import { DemoBanner } from "@/features/report/integrated/demo-banner";
import {
  isReportDemoEnabled,
  isReportReadingEnabled,
} from "@/features/report/integrated/demo-gate";
import { ReportReader } from "@/features/report/integrated/report-reader";
import {
  isSampleScenario,
  sampleInputs,
  SAMPLE_SCENARIOS,
} from "@/features/report/integrated/samples";
import { JourneyReading } from "@/features/report/journey/journey-reading";

/**
 * Leitura do relatório integrado — SÓ INTERNA (demo-gate.ts e src/proxy.ts).
 *
 * - Sem `?cenario=`: a jornada real (Fase 04B), exige SIDERA_REPORT_READING=1.
 *   Mostra só o que já está integrado (capítulos 6 e 7 da prévia).
 * - Com `?cenario=`: exemplos (Fase 04A), exige SIDERA_REPORT_DEMO=1. Nunca
 *   leem a jornada nem são misturados a ela.
 * A página comercial continua em /relatorio.
 */
export const metadata: Metadata = {
  title: "Leitura do relatório (versão interna)",
  robots: { index: false, follow: false },
};

async function Reading({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const requested = (await searchParams).cenario;
  if (requested !== undefined) {
    if (!isReportDemoEnabled() || !isSampleScenario(requested)) notFound();
    const report = buildIntegratedReport(await sampleInputs(requested));
    return (
      <>
        <DemoBanner
          current={requested}
          scenarios={SAMPLE_SCENARIOS}
          basePath={routes.reportReading}
        />
        <ReportReader report={report} />
      </>
    );
  }
  if (!isReportReadingEnabled()) notFound();
  return <JourneyReading />;
}

function ReadingFallback() {
  return (
    <p role="status" className="py-16 text-center text-sm text-fg-muted">
      Preparando a leitura…
    </p>
  );
}

export default function ReportReadingPage(
  props: PageProps<"/relatorio/leitura">,
) {
  return (
    <Container size="wide" className="flex flex-1 flex-col gap-8 pt-5 pb-16">
      <Suspense fallback={<ReadingFallback />}>
        <Reading searchParams={props.searchParams} />
      </Suspense>
    </Container>
  );
}
