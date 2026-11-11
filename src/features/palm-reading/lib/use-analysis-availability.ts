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
