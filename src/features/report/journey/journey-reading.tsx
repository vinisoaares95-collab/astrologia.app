"use client";

/**
 * Leitura do relatório a partir da JORNADA REAL (Fases 04B e 04C), só interna.
 *
 * - Capítulos 1 a 5: o texto da biblioteca gerado UMA vez na confirmação dos
 *   dados de nascimento (04C); carregando enquanto o cálculo não termina;
 *   indisponível, com o motivo, se o cálculo falhar ou não houver dados.
 * - Capítulos 6 e 7: exatamente o texto levado da prévia (04B).
 * - Capítulos 8 e 9 (04D): montados no navegador a partir das pontes
 *   (biblioteca `journey-chapters`); indisponíveis, com o motivo, quando
 *   falta conteúdo.
 * Nunca há dados de exemplo aqui.
 */
import { Callout } from "@/components/ui";

import { useMemo } from "react";

import {
  buildIntegratedReport,
  type JourneyInput,
  type SkyInput,
} from "../integrated/build";
import { buildJourneyChapters } from "../journey-chapters/render";
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
  // Capítulos 8 e 9 (04D): montados aqui, no navegador, só com as pontes já
  // presentes na memória da jornada. Nenhuma requisição nova.
  const journey = useMemo((): JourneyInput => {
    if (sky?.state === "loading") return { state: "loading" };
    const { chapter8, chapter9 } = buildJourneyChapters(
      sky?.state === "ready" ? sky.bridge : null,
      hands ? hands.bridge : null,
    );
    return { state: "ready", chapter8, chapter9 };
  }, [sky, hands]);
  const report = buildIntegratedReport({
    sky: skyInput(sky),
    hands: hands
      ? { state: "ready", result: hands }
      : { state: "absent", reason: HANDS_ABSENT_REASON },
    journey,
  });
  return (
    <>
      <Callout tone="demo" title="Leitura interna">
        Esta página mostra a leitura montada nesta jornada: os capítulos 1 a 5,
        calculados a partir dos seus dados de nascimento com a biblioteca do
        Sidera; os capítulos 6 e 7, quando levados da sua prévia; e os capítulos
        8 e 9, que só organizam o que esses capítulos apresentaram. Um capítulo
        sem conteúdo suficiente aparece como indisponível, com o motivo. O texto
        da leitura fica só na memória desta aba, até você sair da jornada,
        recarregar ou fechar a página.
      </Callout>
      <ReportReader report={report} />
    </>
  );
}
