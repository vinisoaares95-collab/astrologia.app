"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { PalmConsent, PalmHand } from "./consent";
import type { ConsentReceiptToken } from "./lib/analysis-client";
import type { LocalPhoto } from "./lib/load-image";
import type { PalmAnalysisResult } from "./vision/analyze";

type PalmPhotoContextValue = {
  photo: LocalPhoto | null;
  setPhoto: (photo: LocalPhoto) => void;
  clearPhoto: () => void;
  consent: PalmConsent | null;
  hand: PalmHand | null;
  /** Registra consentimento e mão (só em memória). */
  accept: (consent: PalmConsent, hand: PalmHand) => void;
  /** Retira o consentimento: descarta foto, mão e aceite. */
  withdraw: () => void;
  /** Recibo assinado pelo servidor (só quando a análise está habilitada). */
  receipt: ConsentReceiptToken | null;
  setReceipt: (receipt: ConsentReceiptToken | null) => void;
  /** Resultado da análise da foto atual (apagado ao trocar a foto). */
  analysis: PalmAnalysisResult | null;
  setAnalysis: (analysis: PalmAnalysisResult | null) => void;
};

const PalmPhotoContext = createContext<PalmPhotoContextValue | null>(null);

/**
 * Mantém foto, consentimento e mão apenas em memória enquanto a pessoa
 * estiver nas telas de leitura das mãos. Ao substituir, remover ou sair do
 * fluxo, a URL local é revogada e tudo é descartado.
 */
export function PalmPhotoProvider({
  children,
  initialConsent = null,
  initialHand = null,
  initialReceipt = null,
}: {
  children: ReactNode;
  /** Só para testes e demonstração. */
  initialConsent?: PalmConsent | null;
  initialHand?: PalmHand | null;
  initialReceipt?: ConsentReceiptToken | null;
}) {
  const [photo, setPhotoState] = useState<LocalPhoto | null>(null);
  const [consent, setConsent] = useState<PalmConsent | null>(initialConsent);
  const [hand, setHand] = useState<PalmHand | null>(initialHand);
  const [receipt, setReceipt] = useState<ConsentReceiptToken | null>(
    initialReceipt,
  );
  const [analysis, setAnalysis] = useState<PalmAnalysisResult | null>(null);
  const currentUrl = useRef<string | null>(null);

  const release = useCallback(() => {
    if (currentUrl.current) {
      URL.revokeObjectURL(currentUrl.current);
      currentUrl.current = null;
    }
  }, []);

  const setPhoto = useCallback(
    (next: LocalPhoto) => {
      release();
      currentUrl.current = next.url;
      setPhotoState(next);
      setAnalysis(null);
    },
    [release],
  );

  const clearPhoto = useCallback(() => {
    release();
    setPhotoState(null);
    setAnalysis(null);
  }, [release]);

  const accept = useCallback((next: PalmConsent, nextHand: PalmHand) => {
    setConsent(next);
    setHand(nextHand);
  }, []);

  const withdraw = useCallback(() => {
    release();
    setPhotoState(null);
    setConsent(null);
    setHand(null);
    setReceipt(null);
    setAnalysis(null);
  }, [release]);

  useEffect(() => release, [release]);

  const value = useMemo(
    () => ({
      photo,
      setPhoto,
      clearPhoto,
      consent,
      hand,
      accept,
      withdraw,
      receipt,
      setReceipt,
      analysis,
      setAnalysis,
    }),
    [
      photo,
      setPhoto,
      clearPhoto,
      consent,
      hand,
      accept,
      withdraw,
      receipt,
      analysis,
    ],
  );

  return (
    <PalmPhotoContext.Provider value={value}>
      {children}
    </PalmPhotoContext.Provider>
  );
}

export function usePalmPhoto() {
  const ctx = useContext(PalmPhotoContext);
  if (!ctx) {
    throw new Error("usePalmPhoto deve ser usado dentro de PalmPhotoProvider");
  }
  return ctx;
}
