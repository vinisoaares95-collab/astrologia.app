"use client";

/**
 * Leitura do relatório a partir da JORNADA REAL (Fase 04B), só interna.
 *
 * - Capítulos 6 e 7: exatamente o texto levado da prévia (sem regenerar).
 * - Capítulos 1 a 5: pendentes de integração (04C).
 * - Capítulos 8 e 9: pendentes de especificação.
 * Sem leitura das mãos na jornada, a Parte II aparece indisponível com o
 * motivo — nunca com dados de exemplo.
 */
import { Callout } from "@/components/ui";

import { buildIntegratedReport } from "../integrated/build";
import { ReportReader } from "../integrated/report-reader";
import { useJourney } from "./journey-context";

export const SKY_PENDING_REASON =
  "Os capítulos do céu ainda não estão integrados a esta versão interna da jornada. Aparecem só o título e o resumo previstos.";
export const HANDS_ABSENT_REASON =
  "Não há leitura das mãos nesta jornada: ela não foi feita, não foi levada adiante pela prévia, ou foi apagada ao sair da jornada, recarregar a página ou retirar o consentimento.";

export function JourneyReading() {
  const { hands } = useJourney();
  const report = buildIntegratedReport({
    sky: { state: "pending", reason: SKY_PENDING_REASON },
    hands: hands
      ? { state: "ready", result: hands }
      : { state: "absent", reason: HANDS_ABSENT_REASON },
  });
  return (
    <>
      <Callout tone="demo" title="Leitura interna em construção">
        Esta página mostra só o que já está integrado à jornada: os capítulos 6
        e 7, levados da sua prévia. Os capítulos 1 a 5 ainda não foram
        integrados e os capítulos 8 e 9 ainda não têm definição. Não é o
        relatório completo. O texto da leitura fica só na memória desta aba, até
        você sair da jornada, recarregar ou fechar a página.
      </Callout>
      <ReportReader report={report} />
    </>
  );
}
