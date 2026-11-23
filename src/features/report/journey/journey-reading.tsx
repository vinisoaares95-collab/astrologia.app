"use client";

/**
 * Leitura do relatório a partir da JORNADA REAL (Fases 04B e 04C), só interna.
 *
 * - Capítulos 1 a 5: o texto da biblioteca gerado UMA vez na confirmação dos
 *   dados de nascimento (04C); carregando enquanto o cálculo não termina;
 *   indisponível, com o motivo, se o cálculo falhar ou não houver dados.
 * - Capítulos 6 e 7: exatamente o texto levado da prévia (04B).
 * - Capítulos 8 e 9: pendentes de especificação editorial.
 * Nunca há dados de exemplo aqui.
 */
import { Callout } from "@/components/ui";

import { buildIntegratedReport, type SkyInput } from "../integrated/build";
import { ReportReader } from "../integrated/report-reader";
import { useJourney, type JourneySky } from "./journey-context";

export const SKY_ABSENT_REASON =
  "Os dados de nascimento ainda não foram confirmados nesta jornada, ou foram apagados ao sair dela, recarregar a página ou fechá-la.";
export const HANDS_ABSENT_REASON =
  "Não há leitura das mãos nesta jornada: ela não foi feita, não foi levada adiante pela prévia, ou foi apagada ao sair da jornada, recarregar a página ou retirar o consentimento.";

function skyInput(sky: JourneySky | null): SkyInput {
  if (!sky) return { state: "unavailable", reason: SKY_ABSENT_REASON };
  return sky;
}

export function JourneyReading() {
  const { hands, sky } = useJourney();
  const report = buildIntegratedReport({
    sky: skyInput(sky),
    hands: hands
      ? { state: "ready", result: hands }
      : { state: "absent", reason: HANDS_ABSENT_REASON },
  });
  return (
    <>
      <Callout tone="demo" title="Leitura interna em construção">
        Esta página mostra o que já está integrado à jornada: os capítulos 1 a
        5, calculados a partir dos seus dados de nascimento com a biblioteca do
        Sidera, e os capítulos 6 e 7, quando levados da sua prévia. Os capítulos
        8 e 9 ainda não têm definição. Não é o relatório completo. O texto da
        leitura fica só na memória desta aba, até você sair da jornada,
        recarregar ou fechar a página.
      </Callout>
      <ReportReader report={report} />
    </>
  );
}
