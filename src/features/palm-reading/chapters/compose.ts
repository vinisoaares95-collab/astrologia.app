/**
 * Da observação validada aos capítulos para o cliente (Fase 03E).
 *
 * observação validada (03D) → motor 03C (fatos e itens) → redação dos
 * capítulos 6 e 7 (IA validada ou biblioteca) → resultado do cliente + trilha
 * de auditoria interna. A geração de texto nunca derruba a leitura: qualquer
 * falha do provedor de texto vira a versão da biblioteca.
 */
import type { AiProvider } from "../../interpretation/ai/contract";
import { buildPalmInterpretation } from "../analysis/engine";
import type { ValidatedObservation } from "../analysis/validate-observation";
import { generatePalmChapters, type PalmGenerateOptions } from "./generate";
import {
  palmAuditTrail,
  toClientPalmResult,
  type PalmAnalysisResult,
} from "./presentation";

export async function composePalmReading(input: {
  observation: ValidatedObservation;
  textProvider: AiProvider;
  simulated: boolean;
  options?: PalmGenerateOptions;
}): Promise<{
  result: PalmAnalysisResult;
  audit: ReturnType<typeof palmAuditTrail>;
}> {
  const report = buildPalmInterpretation(input.observation);
  const generated = await generatePalmChapters(
    report,
    input.textProvider,
    input.options,
  );
  return {
    result: toClientPalmResult(report, generated, input.simulated),
    audit: palmAuditTrail(generated),
  };
}
