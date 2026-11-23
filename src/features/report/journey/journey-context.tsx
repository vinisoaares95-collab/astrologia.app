"use client";

/**
 * Memória temporária da jornada do relatório (Fase 04B).
 *
 * Fica no layout de `(jornada)`, que envolve leitura das mãos, nascimento,
 * oferta e leitura do relatório. Guarda SÓ o texto já entregue pelo motor das
 * mãos (capítulos 6 e 7), copiado campo a campo por `toJourneyHands`: nunca
 * foto, JPEG, URL de imagem, hash, recibo ou credenciais.
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
  useState,
  type ReactNode,
} from "react";

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

type JourneyValue = {
  hands: JourneyHands | null;
  /** Leva o texto da prévia para a jornada (sem foto). */
  transferHands: (result: PalmAnalysisResult) => void;
  /** Descarta o texto (ex.: ao retirar o consentimento). */
  clearHands: () => void;
};

const JourneyContext = createContext<JourneyValue | null>(null);

export function JourneyProvider({
  children,
  initialHands = null,
}: {
  children: ReactNode;
  /** Só para testes. */
  initialHands?: JourneyHands | null;
}) {
  const [hands, setHands] = useState<JourneyHands | null>(initialHands);
  const [flowKey, setFlowKey] = useState(0);

  const transferHands = useCallback((result: PalmAnalysisResult) => {
    setHands(toJourneyHands(result));
  }, []);
  const clearHands = useCallback(() => setHands(null), []);

  const leaveJourney = useCallback(() => {
    setHands(null);
    setFlowKey((k) => k + 1);
  }, []);
  // Roda quando a jornada é escondida (saída para o site) ou desmontada.
  useLayoutEffect(() => leaveJourney, [leaveJourney]);

  const value = useMemo(
    () => ({ hands, transferHands, clearHands }),
    [hands, transferHands, clearHands],
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
