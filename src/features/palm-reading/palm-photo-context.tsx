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
import type { PalmAnalysisResult } from "./chapters/presentation";

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
  /** Resultado da análise da foto atual. */
  analysis: PalmAnalysisResult | null;
  setAnalysis: (analysis: PalmAnalysisResult | null) => void;
  /**
   * Foto já analisada que foi substituída (03F.2, Etapa B): fica só na
   * memória desta tela enquanto a pessoa decide, para poder voltar a ela.
   * Sai ao restaurar, ao trocar de novo, ao descartar ou ao sair do fluxo.
   */
  previous: { photo: LocalPhoto; analysis: PalmAnalysisResult } | null;
  restorePrevious: () => void;
  /** Análises ainda disponíveis com o recibo atual (informadas pelo servidor). */
  remaining: number | null;
  setRemaining: (remaining: number | null) => void;
};

const PalmPhotoContext = createContext<PalmPhotoContextValue | null>(null);

/**
 * Mantém foto, consentimento e mão apenas em memória enquanto a pessoa
 * estiver nas telas de leitura das mãos. Ao substituir ou remover, a URL
 * local é revogada e tudo é descartado. Ao sair do fluxo, hoje só a URL é
 * revogada: o estado fica na rota escondida pelo Next.js (ver o layout de
 * /leitura-das-maos).
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
  const [previous, setPrevious] = useState<{
    photo: LocalPhoto;
    analysis: PalmAnalysisResult;
  } | null>(null);
  const [remaining, setRemaining] = useState<number | null>(
    initialReceipt?.remaining ?? null,
  );
  // URLs locais vivas (foto atual e, no máximo, a anterior analisada).
  const urls = useRef(new Set<string>());
  const revoke = useCallback((url: string | undefined) => {
    if (url && urls.current.delete(url)) URL.revokeObjectURL(url);
  }, []);
  const release = useCallback(() => {
    for (const url of urls.current) URL.revokeObjectURL(url);
    urls.current.clear();
  }, []);

  const setPhoto = useCallback(
    (next: LocalPhoto) => {
      urls.current.add(next.url);
      if (photo && analysis) {
        // A foto analisada fica guardada para a pessoa poder voltar a ela.
        if (previous) revoke(previous.photo.url);
        setPrevious({ photo, analysis });
      } else if (photo) {
        revoke(photo.url);
      }
      setPhotoState(next);
      setAnalysis(null);
    },
    [photo, analysis, previous, revoke],
  );

  const restorePrevious = useCallback(() => {
    if (!previous) return;
    if (photo) revoke(photo.url);
    setPhotoState(previous.photo);
    setAnalysis(previous.analysis);
    setPrevious(null);
  }, [photo, previous, revoke]);

  const clearPhoto = useCallback(() => {
    release();
    setPhotoState(null);
    setAnalysis(null);
    setPrevious(null);
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
    setPrevious(null);
    setRemaining(null);
  }, [release]);

  const setReceiptAndRemaining = useCallback(
    (next: ConsentReceiptToken | null) => {
      setReceipt(next);
      setRemaining(next?.remaining ?? null);
    },
    [],
  );

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
      setReceipt: setReceiptAndRemaining,
      analysis,
      setAnalysis,
      previous,
      restorePrevious,
      remaining,
      setRemaining,
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
      setReceiptAndRemaining,
      analysis,
      previous,
      restorePrevious,
      remaining,
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
