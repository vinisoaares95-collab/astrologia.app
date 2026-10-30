"use client";

import {
  Camera,
  CheckCircle2,
  ImageUp,
  LoaderCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

import {
  ActionDock,
  Badge,
  Button,
  Callout,
  FrameCorners,
  Stat,
} from "@/components/ui";
import { PalmIllustration } from "@/components/visuals/palm-illustration";
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
  const openCamera = () => cameraInput.current?.click();
  const openGallery = () => galleryInput.current?.click();

  return (
    <div className="flex flex-1 flex-col gap-6">
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
        <div className="animate-fade-up space-y-5">
          <figure className="relative overflow-hidden rounded-[1.75rem] bg-bg-deep edge-light">
            {/* eslint-disable-next-line @next/next/no-img-element -- URL blob local; next/image não se aplica */}
            <img
              src={photo.url}
              alt="Pré-visualização da foto da sua palma"
              className="mx-auto max-h-[52vh] w-auto object-contain"
            />
            <FrameCorners />
            <figcaption className="absolute top-5 left-5">
              <Badge tone="success" dot>
                Foto pronta
              </Badge>
            </figcaption>
          </figure>

          <div className="grid grid-cols-3 gap-3 rounded-2xl bg-surface/80 p-4 edge-light">
            <Stat label="Resolução" value={`${photo.width}×${photo.height}`} />
            <Stat label="Tamanho" value={formatFileSize(photo.sizeBytes)} />
            <Stat label="Destino" value="Só este aparelho" />
          </div>

          {photo.hints.map((hint) => (
            <Callout key={hint} tone="info">
              {hint}
            </Callout>
          ))}

          <div className="space-y-2">
            <p className="font-mono text-[0.65rem] tracking-[0.16em] text-fg-subtle uppercase">
              Confira antes de seguir
            </p>
            <ul className="divide-y divide-line-soft rounded-2xl bg-surface/80 edge-light">
              {selfCheck.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-fg-muted"
                >
                  <CheckCircle2
                    aria-hidden
                    className="size-4 shrink-0 text-accent"
                  />
                  {item}
                </li>
              ))}
            </ul>
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
            "relative flex aspect-[4/5] max-h-[56vh] w-full flex-col items-center justify-center gap-5 self-center overflow-hidden rounded-[1.75rem] px-6 text-center edge-light transition-[background-color,box-shadow] duration-500",
            dragging
              ? "bg-accent-soft shadow-[0_0_0_1px_var(--color-accent)]"
              : "bg-surface/70 bg-[radial-gradient(80%_60%_at_50%_40%,#ff7a3314,transparent_70%)]",
          )}
        >
          <FrameCorners
            className={cn(
              "transition-opacity",
              dragging ? "opacity-100" : "opacity-70",
            )}
          />
          {loading ? (
            <LoaderCircle
              aria-hidden
              className="size-10 animate-spin text-accent"
            />
          ) : (
            <PalmIllustration
              showLines={false}
              animated={false}
              className="h-[45%] opacity-60"
            />
          )}
          <div className="space-y-1" aria-live="polite">
            <p className="font-semibold text-fg">
              {loading
                ? "Preparando a pré-visualização…"
                : "Adicione a foto da sua palma"}
            </p>
            <p className="text-xs text-fg-muted">
              <span className="pointer-coarse:hidden">
                Arraste a imagem para cá ou escolha um arquivo.{" "}
              </span>
              JPG, PNG, WEBP ou HEIC · até 15 MB
            </p>
          </div>
        </div>
      )}

      {status.kind === "error" && (
        <Callout tone="danger" title="Não foi possível usar esta imagem">
          {status.message}
        </Callout>
      )}

      <ActionDock>
        {photo ? (
          <>
            <Button
              size="lg"
              fullWidth
              onClick={() => router.push(routes.palmPreview)}
            >
              Usar esta foto
            </Button>
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="secondary"
                onClick={openGallery}
                disabled={loading}
              >
                <RefreshCw aria-hidden className="size-4" />
                Trocar foto
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  clearPhoto();
                  setStatus({ kind: "idle" });
                }}
              >
                <Trash2 aria-hidden className="size-4" />
                Remover
              </Button>
            </div>
          </>
        ) : (
          <>
            <Button
              size="lg"
              fullWidth
              onClick={openCamera}
              disabled={loading}
              className="pointer-fine:hidden"
            >
              <Camera aria-hidden className="size-5" />
              Tirar foto
            </Button>
            <Button
              size="lg"
              fullWidth
              variant="secondary"
              onClick={openGallery}
              disabled={loading}
              className="pointer-fine:bg-[linear-gradient(180deg,var(--color-accent-strong),var(--color-accent)_55%,var(--color-accent-deep))] pointer-fine:text-bg-deep"
            >
              <ImageUp aria-hidden className="size-5" />
              Escolher da galeria
            </Button>
          </>
        )}
      </ActionDock>
    </div>
  );
}
