/**
 * Análise visual da palma (Fase 03D). Desligada por padrão (404); ver
 * src/features/palm-reading/server/config.ts. Não grava nada.
 */
import {
  getProcessDeps,
  handleAnalysis,
  handleAvailability,
} from "@/features/palm-reading/server/handlers";

export function GET() {
  return handleAvailability(getProcessDeps());
}

export function POST(request: Request) {
  return handleAnalysis(request, getProcessDeps());
}
