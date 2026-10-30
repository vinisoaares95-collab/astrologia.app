"use client";

import { Camera, ImageUp, LoaderCircle, RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

import { Button, Callout } from "@/components/ui";
import { routes } from "@/config/routes";
import { cn } from "@/lib/cn";
import { formatFileSize } from "@/lib/format";

import { ACCEPT_ATTRIBUTE } from "../lib/image-validation";
import { loadLocalPhoto } from "../lib/load-image";
import { usePalmPhoto } from "../palm-photo-context";

type Status =
  { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string };

const selfCheck = [
  "A palma inteira aparece, do pulso aos dedos",
  "As linhas estão nítidas, sem tremor",
  "A luz está uniforme, sem reflexos fortes",
];

export function PhotoCapture() {
  const router = useRouter();
  const { photo, setPhoto, clearPhoto } = usePalmPhoto();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [dragging, setDragging] = useState(false);
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setStatus({ kind: "loading" });
    const result = await loadLocalPhoto(file);
    if (result.ok) {
      setPhoto(result.photo);
      setStatus({ kind: "idle" });
    } else {
      setStatus({ kind: "error", message: result.message });
    }
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Permite selecionar o mesmo arquivo novamente depois de um erro.
    event.target.value = "";
    void handleFile(file);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void handleFile(event.dataTransfer.files?.[0]);
  }

  const loading = status.kind === "loading";

  const pickers = (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button
        onClick={() => cameraInput.current?.click()}
        disabled={loading}
        variant={photo ? "secondary" : "primary"}
        className="pointer-fine:hidden"
      >
        <Camera aria-hidden className="size-4" />
        {photo ? "Tirar outra foto" : "Tirar foto"}
      </Button>
      <Button
        onClick={() => galleryInput.current?.click()}
        disabled={loading}
        variant="secondary"
      >
        <ImageUp aria-hidden className="size-4" />
        {photo ? "Escolher outra imagem" : "Escolher da galeria"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Inputs nativos: `capture` abre a câmera traseira em celulares compatíveis */}
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={onInputChange}
      />
      <input
        ref={galleryInput}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        className="sr-only"
        tabIndex={-1}
        aria-label="Selecionar foto da palma"
        data-testid="gallery-input"
        onChange={onInputChange}
      />

      {photo ? (
        <div className="animate-fade-up space-y-6">
          <figure className="overflow-hidden rounded-3xl border border-line bg-bg-deep">
            {/* eslint-disable-next-line @next/next/no-img-element -- URL blob local; next/image não se aplica */}
            <img
              src={photo.url}
              alt="Pré-visualização da foto da sua palma"
              className="mx-auto max-h-[60vh] w-auto object-contain"
            />
            <figcaption className="flex flex-wrap justify-between gap-2 border-t border-line-soft px-4 py-3 text-xs text-fg-subtle">
              <span className="truncate">{photo.fileName}</span>
              <span className="tabular-nums">
                {photo.width}×{photo.height} px ·{" "}
                {formatFileSize(photo.sizeBytes)}
              </span>
            </figcaption>
          </figure>

          {photo.hints.map((hint) => (
            <Callout key={hint} tone="info">
              {hint}
            </Callout>
          ))}

          <div className="space-y-3">
            <p className="text-sm font-medium text-fg">
              Confira antes de seguir:
            </p>
            <ul className="space-y-2 text-sm text-fg-muted">
              {selfCheck.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden className="text-accent">
                    ✦
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button size="lg" onClick={() => router.push(routes.palmPreview)}>
              Usar esta foto
            </Button>
            {pickers}
            <Button
              variant="ghost"
              onClick={() => {
                clearPhoto();
                setStatus({ kind: "idle" });
              }}
            >
              <Trash2 aria-hidden className="size-4" />
              Remover foto
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex flex-col items-center gap-6 rounded-3xl border border-dashed px-6 py-12 text-center transition-colors duration-300",
            dragging
              ? "border-accent bg-accent-soft"
              : "border-line bg-surface/50",
          )}
        >
          {loading ? (
            <LoaderCircle
              aria-hidden
              className="size-8 animate-spin text-accent"
            />
          ) : (
            <RefreshCw aria-hidden className="size-8 text-fg-subtle" />
          )}
          <div className="space-y-1" aria-live="polite">
            <p className="font-medium text-fg">
              {loading
                ? "Preparando a pré-visualização…"
                : "Adicione a foto da sua palma"}
            </p>
            <p className="text-sm text-fg-muted">
              <span className="pointer-coarse:hidden">
                Arraste a imagem para cá ou escolha um arquivo.{" "}
              </span>
              JPG, PNG, WEBP ou HEIC, até 15 MB.
            </p>
          </div>
          {pickers}
        </div>
      )}

      {status.kind === "error" && (
        <Callout tone="danger" title="Não foi possível usar esta imagem">
          {status.message}
        </Callout>
      )}
    </div>
  );
}
