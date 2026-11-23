/**
 * Revogação do consentimento pelo recibo (Fase 03G.3, Bloco 2). Só com o
 * registro de consentimento ligado; sem ele, 404. Em produção, 503 nesta fase.
 */
import {
  getProcessDeps,
  handleRevoke,
} from "@/features/palm-reading/server/handlers";

export function POST(request: Request) {
  return handleRevoke(request, getProcessDeps());
}
