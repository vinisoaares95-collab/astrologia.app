"use client";

import { useEffect, useState } from "react";

import {
  getAnalysisAvailability,
  type AnalysisAvailability,
} from "./analysis-client";

/**
 * Consulta, em tempo de execução, se a análise está habilitada no servidor
 * (a página é estática; a flag não pode ficar gravada no build).
 */
export function useAnalysisAvailability():
  { status: "loading" } | ({ status: "ready" } & AnalysisAvailability) {
  const [state, setState] = useState<
    { status: "loading" } | ({ status: "ready" } & AnalysisAvailability)
  >({ status: "loading" });
  useEffect(() => {
    let active = true;
    void getAnalysisAvailability().then((a) => {
      if (active) setState({ status: "ready", ...a });
    });
    return () => {
      active = false;
    };
  }, []);
  return state;
}

/**
 * Modo para os textos sobre a foto. Enquanto carrega, vale o modo que envia
 * a foto ("real"): na dúvida, a interface não promete que nada sai do
 * aparelho.
 */
export function photoModeOf(
  a: ReturnType<typeof useAnalysisAvailability>,
): "off" | "simulated" | "real" {
  if (a.status !== "ready") return "real";
  if (!a.enabled) return "off";
  return a.simulated ? "simulated" : "real";
}
