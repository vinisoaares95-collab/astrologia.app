import Link from "next/link";
import { connection } from "next/server";

import { Callout } from "@/components/ui";
import { routes } from "@/config/routes";

import { isReportReadingEnabled } from "../integrated/demo-gate";

/**
 * Atalho para a leitura da jornada (Fase 04B), só quando a leitura interna
 * está ligada. Navegação dentro do app (Link), para não recarregar a página
 * e perder a memória da jornada. Sem a variável, não renderiza nada.
 *
 * Desde a auditoria de conclusão: também leva aos dados de nascimento. Na
 * homologação a análise das mãos fica desligada, e sem este atalho o mapa
 * natal só era alcançável depois de adicionar uma foto da palma (a prévia
 * sem foto não leva adiante). A jornada pública não muda.
 */
export async function InternalReadingLink() {
  await connection();
  if (!isReportReadingEnabled()) return null;
  return (
    <Callout tone="demo" title="Versão interna">
      <Link
        href={routes.reportReading}
        className="font-medium text-fg underline underline-offset-4"
      >
        Abrir a leitura desta jornada
      </Link>{" "}
      (só os capítulos já integrados; não é o relatório completo). Para
      testar só o céu, sem foto:{" "}
      <Link
        href={routes.birthData}
        className="font-medium text-fg underline underline-offset-4"
      >
        informar os dados de nascimento
      </Link>
      .
    </Callout>
  );
}
