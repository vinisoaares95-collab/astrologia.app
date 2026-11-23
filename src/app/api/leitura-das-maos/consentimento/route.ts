/**
 * Recibo assinado do consentimento para a análise (Fase 03D). Desligado
 * por padrão (404). Com o registro de consentimento (03G.3, Bloco 2), grava
 * só a evidência mínima (hash do recibo, versão, finalidades, horário).
 */
import {
  getProcessDeps,
  handleConsent,
} from "@/features/palm-reading/server/handlers";

export function POST(request: Request) {
  return handleConsent(request, getProcessDeps());
}
