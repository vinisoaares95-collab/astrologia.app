"use client";

import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useLayoutEffect,
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
  /**
   * Começa uma tarefa assíncrona do fluxo (preparar a foto, pedir o recibo,
   * analisar). Ao sair do fluxo, `signal` é abortado e `isCurrent()` passa a
   * ser falso: a resposta atrasada não pode restaurar nada nem navegar.
   */
  beginTask: () => FlowTask;
};

export type FlowTask = { signal: AbortSignal; isCurrent: () => boolean };

const PalmPhotoContext = createContext<PalmPhotoContextValue | null>(null);

/**
 * Mantém foto, consentimento e mão apenas em memória enquanto a pessoa
 * estiver nas telas de leitura das mãos. Ao substituir ou remover, a URL
 * local é revogada e a foto é descartada.
 *
 * Ao sair do fluxo (03G.3, D5): com cacheComponents, o Next.js esconde a
 * rota com <Activity> em vez de desmontá-la. Esconder executa a limpeza dos
 * efeitos de layout; é aí que o fluxo é encerrado (`leaveFlow`):
 * - foto atual e anterior, resultado, consentimento, mão, recibo e
 *   contagem voltam a vazio, e as URLs locais são revogadas;
 * - tarefas em andamento são abortadas e invalidadas;
 * - as telas internas são remontadas (chave nova), descartando o estado
 *   local delas (caixas marcadas, resultado exibido, campos de arquivo).
 * Navegar entre as etapas internas não esconde este layout, então o
 * progresso continua. O consentimento NÃO é revogado no servidor: o recibo
 * só deixa de existir neste aparelho (e vence sozinho em 30 min).
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
  // Sessão do fluxo: muda a cada saída. Tarefas antigas deixam de valer.
  const session = useRef(0);
  const tasks = useRef(new Set<AbortController>());
  const [flowKey, setFlowKey] = useState(0);
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

  const beginTask = useCallback((): FlowTask => {
    const controller = new AbortController();
    const started = session.current;
    tasks.current.add(controller);
    controller.signal.addEventListener("abort", () =>
      tasks.current.delete(controller),
    );
    return {
      signal: controller.signal,
      isCurrent: () =>
        session.current === started && !controller.signal.aborted,
    };
  }, []);

  const leaveFlow = useCallback(() => {
    session.current++;
    for (const task of [...tasks.current]) task.abort();
    tasks.current.clear();
    release();
    setPhotoState(null);
    setConsent(null);
    setHand(null);
    setReceipt(null);
    setAnalysis(null);
    setPrevious(null);
    setRemaining(null);
    setFlowKey((k) => k + 1);
  }, [release]);

  // Roda quando a rota é escondida (saída do fluxo) ou desmontada.
  useLayoutEffect(() => leaveFlow, [leaveFlow]);

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
      beginTask,
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
      beginTask,
    ],
  );

  return (
    <PalmPhotoContext.Provider value={value}>
      <Fragment key={flowKey}>{children}</Fragment>
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
