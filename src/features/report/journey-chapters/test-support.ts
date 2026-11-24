/** Pontes vazias para testes que montam resultados à mão (não usado pelo app). */
import { BRIDGE_VERSION, type HandsBridge, type SkyBridge } from "./bridge";

export function emptyHandsBridge(over: Partial<HandsBridge> = {}): HandsBridge {
  return {
    version: BRIDGE_VERSION,
    retakeRecommended: false,
    simulated: false,
    items: [],
    reflect: [],
    partial: [],
    unreliable: [],
    noPole: [],
    unclassified: [],
    ...over,
  };
}

export function emptySkyBridge(): SkyBridge {
  return { version: BRIDGE_VERSION, items: [], uncertain: [] };
}
