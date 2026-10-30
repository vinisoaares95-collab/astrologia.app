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

import type { LocalPhoto } from "./lib/load-image";

type PalmPhotoContextValue = {
  photo: LocalPhoto | null;
  setPhoto: (photo: LocalPhoto) => void;
  clearPhoto: () => void;
};

const PalmPhotoContext = createContext<PalmPhotoContextValue | null>(null);

/**
 * Mantém a foto apenas em memória enquanto a pessoa estiver nas telas de
 * leitura das mãos. Ao substituir, remover ou sair do fluxo, a URL local é
 * revogada e a imagem descartada.
 */
export function PalmPhotoProvider({ children }: { children: ReactNode }) {
  const [photo, setPhotoState] = useState<LocalPhoto | null>(null);
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
    },
    [release],
  );

  const clearPhoto = useCallback(() => {
    release();
    setPhotoState(null);
  }, [release]);

  useEffect(() => release, [release]);

  const value = useMemo(
    () => ({ photo, setPhoto, clearPhoto }),
    [photo, setPhoto, clearPhoto],
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
