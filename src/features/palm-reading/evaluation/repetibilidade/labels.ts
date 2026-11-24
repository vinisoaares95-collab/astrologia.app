import type { FeatureId } from "../../analysis/contract";

/** Nomes das características nos relatórios do experimento. */
export const FEATURE_LABELS: Record<FeatureId, string> = {
  "hand.palmShape": "Formato da palma",
  "hand.fingerLength": "Comprimento dos dedos",
  "heart.length": "Comprimento da linha do coração",
  "heart.shape": "Traçado da linha do coração",
  "head.length": "Comprimento da linha da cabeça",
  "head.slope": "Inclinação da linha da cabeça",
  "head.start": "Início da linha da cabeça",
  "life.arc": "Arco da linha da vida",
  "fate.presence": "Linha do destino",
};
