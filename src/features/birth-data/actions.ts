"use server";

import type { NormalizationResult } from "./contract";
import { normalizeOnServer } from "./server-normalize";

/**
 * Normaliza os dados de nascimento no servidor. Não persiste nem registra
 * dados pessoais e não chama o motor astrológico.
 */
export async function normalizeBirthAction(
  raw: unknown,
): Promise<NormalizationResult> {
  return normalizeOnServer(raw);
}
