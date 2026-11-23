import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { Container } from "@/components/ui";
import { routes } from "@/config/routes";
import { buildIntegratedReport } from "@/features/report/integrated/build";
import { DemoBanner } from "@/features/report/integrated/demo-banner";
import { ReportReader } from "@/features/report/integrated/report-reader";
import { isReportDemoEnabled } from "@/features/report/integrated/demo-gate";
import {
  isSampleScenario,
  sampleInputs,
  SAMPLE_SCENARIOS,
} from "@/features/report/integrated/samples";

/**
 * Leitura do relatório integrado (Fase 04A) — DEMONSTRAÇÃO INTERNA.
 *
 * Só com SIDERA_REPORT_DEMO=1 no servidor (sem ela: 404). Usa apenas dados
 * de exemplo (samples.ts); não recebe foto, dados de nascimento nem
 * resultados reais. Os capítulos 8 e 9 aparecem pendentes. Não é o produto
 * e não deve ser apresentada ao público como relatório completo. A página
 * comercial continua em /relatorio.
 */
export const metadata: Metadata = {
  title: "Leitura do relatório (demonstração interna)",
  robots: { index: false, follow: false },
};

async function Reading({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  if (!isReportDemoEnabled()) notFound();
  const requested = (await searchParams).cenario;
  const scenario = isSampleScenario(requested) ? requested : "completo";
  const report = buildIntegratedReport(await sampleInputs(scenario));
  return (
    <>
      <DemoBanner
        current={scenario}
        scenarios={SAMPLE_SCENARIOS}
        basePath={routes.reportReading}
      />
      <ReportReader report={report} />
    </>
  );
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
