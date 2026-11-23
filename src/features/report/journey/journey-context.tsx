"use client";

/**
 * Memória temporária da jornada do relatório (Fase 04B).
 *
 * Fica no layout de `(jornada)`, que envolve leitura das mãos, nascimento,
 * oferta e leitura do relatório. Guarda SÓ texto já entregue pelos motores,
 * copiado campo a campo: capítulos 6 e 7 (`toJourneyHands`; nunca foto, JPEG,
 * URL de imagem, hash, recibo ou credenciais) e, desde a 04C, capítulos 1 a 5
 * (`toJourneySky`; nunca data, hora ou local de nascimento).
 *
 * - A transferência é explícita (`transferHands`), no clique de "Continuar"
 *   da prévia — antes de o layout das mãos ser escondido e o D5 descartar a
 *   foto. Nenhuma nova chamada a modelo acontece.
 * - Abandonar a jornada (ir para as páginas do site): o Next.js esconde este
 *   layout com <Activity>; a limpeza dos efeitos de layout descarta o texto
 *   e remonta as telas (mesmo padrão do D5). Recarregar ou fechar a página
 *   também apaga (só memória: nada de localStorage, sessionStorage, cookies
 *   ou banco).
 * - Retirar o consentimento também descarta o texto (`clearHands`).
 * - A liberação efetiva da memória é feita pelo navegador; o Sidera só deixa
 *   de manter referências.
 */
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

import type { ClientReport } from "@/features/interpretation/ai/presentation";
import type { PalmAnalysisResult } from "@/features/palm-reading/chapters/presentation";

/** Exatamente o que a apresentação usa; nada além disso. */
export type JourneyHands = PalmAnalysisResult;

/**
 * Cópia explícita, campo a campo, do resultado das mãos para a jornada.
 * Qualquer campo que não esteja aqui (presente ou futuro) não é levado.
 */
export function toJourneyHands(r: PalmAnalysisResult): JourneyHands {
  return {
    status: r.status,
    retakeRecommended: r.retakeRecommended,
    simulated: r.simulated,
    disclaimer: r.disclaimer,
    chapters: r.chapters.map((c) => ({
      number: c.number,
      title: c.title,
      status: c.status,
      introduction: c.introduction,
      sections: c.sections.map((s) => ({
        text: s.text,
        observed: [...s.observed],
        notes: [...s.notes],
      })),
      synthesis: c.synthesis,
      reflectionQuestions: [...c.reflectionQuestions],
      limitations: [...c.limitations],
      unavailableMessage: c.unavailableMessage,
    })),
  };
}

/**
 * Capítulos 1 a 5 na jornada (Fase 04C): só o texto entregue pelo motor
 * (`ClientReport`), copiado campo a campo. Nunca data, hora ou local.
 */
export type JourneySky =
  | { state: "loading" }
  | { state: "ready"; report: ClientReport }
  | { state: "unavailable"; reason: string };

export function toJourneySky(r: ClientReport): ClientReport {
  return {
    disclaimer: r.disclaimer,
    chapters: r.chapters.map((c) => ({
      number: c.number,
      title: c.title,
      introduction: c.introduction,
      sections: c.sections.map((s) => ({ text: s.text, notes: [...s.notes] })),
      synthesis: c.synthesis,
      reflectionQuestions: [...c.reflectionQuestions],
      limitations: [...c.limitations],
    })),
  };
}

/** Um cálculo em andamento; só o mais recente da sessão atual vale. */
export type SkyTask = {
  isCurrent: () => boolean;
  /** Grava o resultado só se ainda for o pedido atual (ignora atrasados). */
  settle: (
    result:
      | { state: "ready"; report: ClientReport }
      | { state: "unavailable"; reason: string },
  ) => boolean;
};

type JourneyValue = {
  hands: JourneyHands | null;
  /** Leva o texto da prévia para a jornada (sem foto). */
  transferHands: (result: PalmAnalysisResult) => void;
  /** Descarta o texto (ex.: ao retirar o consentimento). */
  clearHands: () => void;
  sky: JourneySky | null;
  /** Começa o cálculo dos capítulos 1–5 para um envio confirmado. */
  beginSky: () => SkyTask;
};

const JourneyContext = createContext<JourneyValue | null>(null);

export function JourneyProvider({
  children,
  initialHands = null,
  initialSky = null,
}: {
  children: ReactNode;
  /** Só para testes. */
  initialHands?: JourneyHands | null;
  initialSky?: JourneySky | null;
}) {
  const [hands, setHands] = useState<JourneyHands | null>(initialHands);
  const [sky, setSky] = useState<JourneySky | null>(initialSky);
  const [flowKey, setFlowKey] = useState(0);
  // Sessão da jornada (muda ao sair) e pedido do céu (muda a cada envio).
  const session = useRef(0);
  const skyRequest = useRef(0);

  const beginSky = useCallback((): SkyTask => {
    const started = session.current;
    const id = ++skyRequest.current;
    setSky({ state: "loading" });
    const isCurrent = () =>
      session.current === started && skyRequest.current === id;
    return {
      isCurrent,
      settle: (result) => {
        if (!isCurrent()) return false;
        setSky(
          result.state === "ready"
            ? { state: "ready", report: toJourneySky(result.report) }
            : { state: "unavailable", reason: result.reason },
        );
        return true;
      },
    };
  }, []);

  const transferHands = useCallback((result: PalmAnalysisResult) => {
    setHands(toJourneyHands(result));
  }, []);
  const clearHands = useCallback(() => setHands(null), []);

  const leaveJourney = useCallback(() => {
    session.current++;
    setHands(null);
    setSky(null);
    setFlowKey((k) => k + 1);
  }, []);
  // Roda quando a jornada é escondida (saída para o site) ou desmontada.
  useLayoutEffect(() => leaveJourney, [leaveJourney]);

  const value = useMemo(
    () => ({ hands, transferHands, clearHands, sky, beginSky }),
    [hands, transferHands, clearHands, sky, beginSky],
  );
  return (
    <JourneyContext.Provider value={value}>
      <Fragment key={flowKey}>{children}</Fragment>
    </JourneyContext.Provider>
  );
}

export function useJourney(): JourneyValue {
  const ctx = useContext(JourneyContext);
  if (!ctx)
    throw new Error("useJourney deve ser usado dentro de JourneyProvider");
  return ctx;
}

/** Para componentes que também rodam fora da jornada (ex.: testes isolados). */
export function useOptionalJourney(): JourneyValue | null {
  return useContext(JourneyContext);
}
