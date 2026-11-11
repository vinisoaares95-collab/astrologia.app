/**
 * Recibo assinado do consentimento para a análise (Fase 03D). Desligado
 * por padrão (404). Não grava nada.
 */
import {
  getProcessDeps,
  handleConsent,
} from "@/features/palm-reading/server/handlers";

export function POST(request: Request) {
  return handleConsent(request, getProcessDeps());
}
