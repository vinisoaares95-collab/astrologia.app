/**
 * Pontes dos capítulos 8 e 9 (Fase 04D): os metadados estruturados mínimos
 * que acompanham os capítulos 1–5 e 6–7 na memória da jornada.
 *
 * Gerados no SERVIDOR, no mesmo pedido que já produz os capítulos (nenhuma
 * requisição nova). Levam só o necessário para selecionar e rastrear:
 * o id do item original, o capítulo, um rótulo já apresentado ao leitor
 * ("Sol em Touro", "linha do coração longa"), a chave do assunto e o polo.
 *
 * Nunca levam: data, hora ou local de nascimento, coordenadas, graus, casas,
 * evidência visual, imagem, hash, recibo, mão (direita/esquerda), origem do
 * texto (IA ou biblioteca) nem itens não elegíveis.
 */
import type { InterpretationReport } from "@/features/interpretation/contract";
import {
  BODY_MEANINGS,
  SIGN_MEANINGS,
  type ToneTag,
} from "@/features/interpretation/library/base";
import type { FeatureId } from "@/features/palm-reading/analysis/contract";
import type { PalmReport } from "@/features/palm-reading/analysis/engine";

import {
  COMPARABLE_FEATURES,
  ELIGIBLE_BODIES,
  JOURNEY_LIBRARY_VERSION,
  PALM_POLES,
  PALM_REFLECT,
  UNCERTAIN_LABEL,
  UNRELIABLE_FEATURES,
} from "./library";

export const BRIDGE_VERSION = `bridge-1+${JOURNEY_LIBRARY_VERSION}`;

/** Uma interpretação apresentada, elegível, com rastreabilidade. */
export type BridgeRef = {
  /** Id do item original (InterpretationItem.id ou PalmItem.id). */
  ref: string;
  side: "sky" | "hands";
  chapter: number;
  /** Rótulo já apresentado ao leitor. */
  label: string;
  /** Corpo/ângulo do céu ou característica das mãos (chave de assunto). */
  key: string;
  /** Polos `ToneTag` do motor (céu) ou da tabela 2.2 (mãos); vazio = sem polo. */
  poles: ToneTag[];
};

export type SkyBridge = {
  version: string;
  items: BridgeRef[];
  /** Lua, Vênus ou Marte incertos pelo horário (fora das comparações). */
  uncertain: string[];
};

export type HandsBridge = {
  version: string;
  retakeRecommended: boolean;
  simulated: boolean;
  /** Traços nítidos com polo (capítulos 8 e 9). */
  items: BridgeRef[];
  /** Traços nítidos sem polo, com assunto (só capítulo 9). */
  reflect: BridgeRef[];
  /** Traços com polo que ficaram parciais. */
  partial: FeatureId[];
  /** Traços observados excluídos por D3/D4. */
  unreliable: FeatureId[];
  /** Comparáveis observados com nitidez, mas sem polo (U4-misto). */
  noPole: FeatureId[];
  /** Comparáveis não classificados com segurança (U4). */
  unclassified: FeatureId[];
};

/** Ponte do céu, a partir do mesmo relatório que gera os capítulos 1–5. */
export function buildSkyBridge(r: InterpretationReport): SkyBridge {
  const items: BridgeRef[] = [];
  const bodies = new Set<string>(ELIGIBLE_BODIES);
  for (const ch of r.chapters)
    for (const i of ch.items) {
      const [, kind, who] = i.id.split(":");
      const eligible =
        i.certainty === "determined" &&
        i.tags.length > 0 &&
        ((kind === "body-sign" && bodies.has(who)) ||
          (kind === "angle-sign" && who === "asc"));
      if (!eligible) continue;
      const fact = r.facts.find((f) => i.factIds.includes(f.id));
      if (!fact?.sign) continue;
      const name =
        who === "asc"
          ? "Ascendente"
          : BODY_MEANINGS[who as keyof typeof BODY_MEANINGS].name;
      items.push({
        ref: i.id,
        side: "sky",
        chapter: ch.number,
        label: `${name} em ${SIGN_MEANINGS[fact.sign].name}`,
        key: who,
        poles: i.tags.filter(isToneTag),
      });
    }
  const uncertain = r.facts
    .filter(
      (f) =>
        f.kind === "body-sign" &&
        f.certainty === "uncertain" &&
        UNCERTAIN_LABEL[f.bodies[0] as string],
    )
    .map((f) => f.bodies[0] as string);
  return {
    version: BRIDGE_VERSION,
    items,
    uncertain: [...new Set(uncertain)],
  };
}

const TONE_TAGS = new Set<string>([
  "ritmo:impulso",
  "ritmo:cautela",
  "expressao:expansiva",
  "expressao:reservada",
  "foco:mudanca",
  "foco:estabilidade",
  "vinculo:autonomia",
  "vinculo:proximidade",
]);
function isToneTag(t: string): t is ToneTag {
  return TONE_TAGS.has(t);
}

/** Ponte das mãos, a partir do mesmo relatório que gera os capítulos 6–7. */
export function buildHandsBridge(
  p: PalmReport,
  retakeRecommended: boolean,
  simulated: boolean,
): HandsBridge {
  const items: BridgeRef[] = [];
  const reflect: BridgeRef[] = [];
  const partial: FeatureId[] = [];
  const unreliable: FeatureId[] = [];
  const seen = new Map<string, { determined: boolean; value: string }>();
  for (const ch of p.chapters)
    for (const i of ch.items) {
      const [, feature, value] = i.id.split(":");
      const f = feature as FeatureId;
      const determined = i.certainty === "determined";
      if ((COMPARABLE_FEATURES as readonly string[]).includes(feature))
        seen.set(feature, { determined, value });
      if ((UNRELIABLE_FEATURES as readonly string[]).includes(feature)) {
        unreliable.push(f);
        continue;
      }
      const poled = PALM_POLES[`${feature}:${value}`];
      if (poled) {
        if (!determined) partial.push(f);
        else
          items.push({
            ref: i.id,
            side: "hands",
            chapter: ch.number,
            label: poled.label,
            key: feature,
            poles: [poled.pole],
          });
        continue;
      }
      const label = PALM_REFLECT[`${feature}:${value}`];
      if (label && determined)
        reflect.push({
          ref: i.id,
          side: "hands",
          chapter: ch.number,
          label,
          key: feature,
          poles: [],
        });
    }
  const noPole = COMPARABLE_FEATURES.filter((f) => {
    const s = seen.get(f);
    return s?.determined && !PALM_POLES[`${f}:${s.value}`];
  });
  const unclassified = COMPARABLE_FEATURES.filter(
    (f) => !seen.get(f)?.determined,
  );
  return {
    version: BRIDGE_VERSION,
    retakeRecommended,
    simulated,
    items,
    reflect,
    partial: [...new Set(partial)],
    unreliable: [...new Set(unreliable)],
    noPole,
    unclassified,
  };
}

/** Cópias campo a campo (memória da jornada): nada além do contrato. */
const copyRef = (r: BridgeRef): BridgeRef => ({
  ref: r.ref,
  side: r.side,
  chapter: r.chapter,
  label: r.label,
  key: r.key,
  poles: [...r.poles],
});

export function copySkyBridge(b: SkyBridge): SkyBridge {
  return {
    version: b.version,
    items: b.items.map(copyRef),
    uncertain: [...b.uncertain],
  };
}

export function copyHandsBridge(b: HandsBridge): HandsBridge {
  return {
    version: b.version,
    retakeRecommended: b.retakeRecommended,
    simulated: b.simulated,
    items: b.items.map(copyRef),
    reflect: b.reflect.map(copyRef),
    partial: [...b.partial],
    unreliable: [...b.unreliable],
    noPole: [...b.noPole],
    unclassified: [...b.unclassified],
  };
}
