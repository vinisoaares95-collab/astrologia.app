/**
 * Observações FICTÍCIAS para testes (Fase 03C). Não vêm de fotos reais nem
 * de modelos: foram escritas à mão para exercitar o contrato e o validador.
 */
import {
  OBSERVATION_VERSION,
  type FeatureId,
  type PalmObservation,
} from "../contract";

type Raw = Omit<PalmObservation, "features"> & {
  features: Record<FeatureId, Record<string, unknown>>;
};

const nv = (reason = "too_faint") => ({ visibility: "not_visible", reason });

/** Mão com características claramente observáveis (mão direita). */
export const clearHand = (): Raw => ({
  version: OBSERVATION_VERSION,
  hand: "right",
  image: { quality: "adequate", issues: [] },
  features: {
    "hand.palmShape": {
      visibility: "clear",
      value: "square",
      evidence:
        "Largura na base dos dedos parecida com a distância do pulso à base do dedo médio.",
    },
    "hand.fingerLength": {
      visibility: "clear",
      value: "short",
      evidence:
        "Dedo médio visivelmente menor que três quartos do comprimento da palma.",
    },
    "heart.length": {
      visibility: "clear",
      value: "long",
      evidence:
        "Linha superior atravessa a palma e termina sob o dedo indicador.",
    },
    "heart.shape": {
      visibility: "clear",
      value: "curved",
      evidence:
        "No final, a linha do coração sobe em direção à base entre indicador e médio.",
    },
    "head.length": {
      visibility: "clear",
      value: "medium",
      evidence: "Linha central termina sob o dedo anelar.",
    },
    "head.slope": {
      visibility: "clear",
      value: "sloping",
      evidence:
        "A linha da cabeça desce levemente em direção ao pulso no final.",
    },
    "head.start": {
      visibility: "clear",
      value: "joined_life",
      evidence:
        "Perto do polegar, a linha da cabeça sai junto da linha da vida por um pequeno trecho.",
    },
    "life.arc": {
      visibility: "clear",
      value: "wide",
      evidence:
        "A linha que contorna a base do polegar avança até perto do centro da palma.",
    },
    "fate.presence": {
      visibility: "clear",
      value: "present",
      evidence:
        "Linha vertical nítida sobe do meio da palma até perto da base do dedo médio.",
    },
  },
});

/** Algumas características parciais ou não visíveis (mão esquerda). */
export const partialHand = (): Raw => {
  const o = clearHand();
  o.hand = "left";
  o.image = { quality: "limited", issues: ["glare"] };
  o.features["hand.fingerLength"] = nv("out_of_frame");
  o.features["heart.shape"] = {
    visibility: "partial",
    value: "straight",
    evidence:
      "O trecho final da linha do coração, sob o indicador, aparece reto antes do reflexo.",
  };
  o.features["head.slope"] = nv("obscured");
  o.features["fate.presence"] = {
    visibility: "partial",
    value: "present",
    evidence:
      "Traço vertical fraco no centro da palma, interrompido pelo reflexo.",
  };
  return o;
};

/** Foto insuficiente: nada pode ser observado. */
export const insufficientPhoto = (): Raw => ({
  version: OBSERVATION_VERSION,
  hand: "right",
  image: { quality: "insufficient", issues: ["blurry", "too_dark"] },
  features: Object.fromEntries(
    Object.keys(clearHand().features).map((id) => [id, nv("image_quality")]),
  ) as unknown as Raw["features"],
});

/** Formato visível, linhas ausentes ou não identificáveis. */
export const linesMissing = (): Raw => {
  const o = clearHand();
  for (const id of [
    "heart.length",
    "heart.shape",
    "head.length",
    "head.slope",
    "head.start",
    "life.arc",
    "fate.presence",
  ] as FeatureId[])
    o.features[id] = nv(id === "life.arc" ? "obscured" : "too_faint");
  return o;
};
