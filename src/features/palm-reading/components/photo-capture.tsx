"use client";

import {
  Camera,
  CheckCircle2,
  Hand,
  ImageUp,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import {
  ActionDock,
  Badge,
  Button,
  ButtonLink,
  Callout,
  Card,
  FrameCorners,
  Stat,
} from "@/components/ui";
import { PalmIllustration } from "@/components/visuals/palm-illustration";
import { routes } from "@/config/routes";
import { cn } from "@/lib/cn";
import { formatFileSize } from "@/lib/format";

import { HAND_LABELS } from "../consent";
import {
  ANALYSIS_ERROR_MESSAGES,
  requestPalmAnalysis,
  type AnalysisErrorCode,
} from "../lib/analysis-client";
import { useAnalysisAvailability } from "../lib/use-analysis-availability";
import type { PalmAnalysisResult } from "../vision/analyze";
import { ACCEPT_ATTRIBUTE } from "../lib/image-validation";
import { loadLocalPhoto } from "../lib/load-image";
import { usePalmPhoto } from "../palm-photo-context";

type Run =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "needs-decision"; result: PalmAnalysisResult }
  | { kind: "error"; code: AnalysisErrorCode };

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "cancelled" }
  | { kind: "error"; message: string };

const selfCheck = [
  "É a palma (não o dorso) da mão que você escolheu",
  "A palma inteira aparece, do pulso aos dedos",
  "As linhas estão nítidas, sem tremor",
  "A luz está uniforme, sem reflexos fortes",
];

export function PhotoCapture() {
  const { consent, hand } = usePalmPhoto();
  // A foto só é pedida depois do consentimento e da escolha da mão.
  if (!consent || !hand) return <ConsentRequired />;
  return <PhotoCaptureSteps handLabel={HAND_LABELS[hand]} />;
}

function ConsentRequired() {
  return (
    <Card className="my-auto flex flex-col items-center gap-5 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-surface-bright">
        <ShieldCheck aria-hidden className="size-6 text-fg-subtle" />
      </span>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-fg">Antes da foto</h2>
        <p className="text-sm text-fg-muted">
          Confirme sua idade, leia como a foto será usada e escolha a mão. Se
          você recarregou a página, essas escolhas foram descartadas.
        </p>
      </div>
      <ButtonLink href={routes.palmConsent}>Ir para o consentimento</ButtonLink>
    </Card>
  );
}

function PhotoCaptureSteps({ handLabel }: { handLabel: string }) {
  const router = useRouter();
  const { photo, setPhoto, clearPhoto, receipt, setAnalysis } = usePalmPhoto();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const availability = useAnalysisAvailability();
  const canAnalyze = availability.status === "ready" && availability.enabled;
  const simulated = canAnalyze && availability.simulated;
  const [run, setRun] = useState<Run>({ kind: "idle" });

  async function analyze() {
    if (!photo) return;
    if (!receipt) {
      setRun({ kind: "error", code: "consent_required" });
      return;
    }
    setRun({ kind: "running" });
    const r = await requestPalmAnalysis(photo.blob, receipt);
    if (!r.ok) {
      setRun({ kind: "error", code: r.error });
      return;
    }
    setAnalysis(r.result);
    if (r.result.status === "insufficient" || r.result.retakeRecommended)
      setRun({ kind: "needs-decision", result: r.result });
    else router.push(routes.palmPreview);
  }
  const [dragging, setDragging] = useState(false);
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  // Câmera ou galeria fechadas sem foto (inclui permissão negada no aparelho).
  useEffect(() => {
    const inputs = [cameraInput.current, galleryInput.current];
    const onCancel = () => setStatus({ kind: "cancelled" });
    inputs.forEach((el) => el?.addEventListener("cancel", onCancel));
    return () =>
      inputs.forEach((el) => el?.removeEventListener("cancel", onCancel));
  }, []);

  async function handleFile(file: File | undefined) {
    if (!file) {
      setStatus({ kind: "cancelled" });
      return;
    }
    setStatus({ kind: "loading" });
    try {
      const result = await loadLocalPhoto(file);
      if (result.ok) {
        setPhoto(result.photo);
        setStatus({ kind: "idle" });
        setRun({ kind: "idle" });
      } else {
        setStatus({ kind: "error", message: result.message });
      }
    } catch {
      setStatus({
        kind: "error",
        message:
          "Algo deu errado ao preparar a foto neste aparelho. Tente de novo ou escolha outra imagem.",
      });
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
          <figure className="relative overflow-hidden rounded-3xl bg-bg-deep edge-light">
            {/* eslint-disable-next-line @next/next/no-img-element -- URL blob local; next/image não se aplica */}
            <img
              src={photo.url}
              alt="Pré-visualização da foto da sua palma"
              className="mx-auto max-h-[46vh] w-auto object-contain"
            />
            <FrameCorners />
            <figcaption className="absolute top-5 left-5">
              <Badge tone="success" dot>
                Foto pronta
              </Badge>
            </figcaption>
          </figure>

          <div className="grid grid-cols-2 gap-x-3 gap-y-4 rounded-2xl bg-surface/80 p-4 edge-light">
            <Stat label="Mão" value={handLabel} />
            <Stat label="Resolução" value={`${photo.width}×${photo.height}`} />
            <Stat label="Tamanho" value={formatFileSize(photo.sizeBytes)} />
            <Stat label="EXIF/GPS" value="Removidos" />
          </div>
          <p className="-mt-2 px-1 text-xs leading-relaxed text-fg-subtle">
            A foto foi redesenhada neste aparelho, sem dados de localização nem
            do celular, e continua só aqui.
          </p>

          {photo.hints.map((hint) => (
            <Callout key={hint} tone="info">
              {hint}
            </Callout>
          ))}

          <Callout tone="info" title="Verificação automática (aproximada)">
            {photo.quality.length > 0 ? (
              <ul className="list-disc space-y-1.5 pl-4">
                {photo.quality.map((q) => (
                  <li key={q.code}>{q.message}</li>
                ))}
              </ul>
            ) : (
              "Não encontramos sinais evidentes de pouca luz, reflexo ou falta de foco."
            )}{" "}
            <span className="mt-2 block text-fg-subtle">
              Esta verificação é aproximada e não garante que as linhas poderão
              ser identificadas. Confira a foto você também.
            </span>
          </Callout>

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
            "relative flex aspect-[4/5] max-h-[50vh] w-full flex-col items-center justify-center gap-5 self-center overflow-hidden rounded-3xl px-6 text-center edge-light transition-[background-color,box-shadow] duration-500",
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
                ? "Preparando a foto neste aparelho…"
                : "Adicione a foto da sua palma"}
            </p>
            <p className="flex items-center justify-center gap-1.5 text-xs text-fg-muted">
              <Hand aria-hidden className="size-3.5 text-accent" />
              Palma da {handLabel.toLowerCase()} ·{" "}
              <Link
                href={routes.palmConsent}
                className="underline underline-offset-2 hover:text-fg"
              >
                trocar
              </Link>
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
      {status.kind === "cancelled" && !photo && (
        <Callout tone="info" title="Nenhuma foto recebida">
          Se a câmera não abriu, confira se o navegador tem permissão para
          usá-la nas configurações do aparelho. Você também pode escolher uma
          foto da galeria.
        </Callout>
      )}

      {photo && <AnalysisFeedback run={run} simulated={simulated} />}

      <ActionDock>
        {photo ? (
          <>
            {canAnalyze ? (
              run.kind === "needs-decision" &&
              run.result.status !== "insufficient" ? (
                <Button
                  size="lg"
                  fullWidth
                  onClick={() => router.push(routes.palmPreview)}
                >
                  Seguir com esta análise
                </Button>
              ) : (
                <Button
                  size="lg"
                  fullWidth
                  onClick={() => void analyze()}
                  disabled={
                    run.kind === "running" ||
                    (run.kind === "needs-decision" &&
                      run.result.status === "insufficient")
                  }
                >
                  {run.kind === "running" && (
                    <LoaderCircle aria-hidden className="size-4 animate-spin" />
                  )}
                  {run.kind === "running"
                    ? "Analisando a foto…"
                    : simulated
                      ? "Analisar a foto (simulação)"
                      : "Analisar a foto"}
                </Button>
              )
            ) : (
              <Button
                size="lg"
                fullWidth
                onClick={() => router.push(routes.palmPreview)}
              >
                Usar esta foto
              </Button>
            )}
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="secondary"
                onClick={openCamera}
                disabled={loading}
                className="pointer-fine:hidden"
              >
                <Camera aria-hidden className="size-4" />
                Tirar outra
              </Button>
              <Button
                variant="secondary"
                onClick={openGallery}
                disabled={loading}
                className="pointer-coarse:hidden"
              >
                <RefreshCw aria-hidden className="size-4" />
                Trocar foto
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  clearPhoto();
                  setStatus({ kind: "idle" });
                  setRun({ kind: "idle" });
                }}
              >
                <Trash2 aria-hidden className="size-4" />
                Descartar
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

/** Mensagens da análise: andamento, resultado parcial/insuficiente, erros. */
function AnalysisFeedback({
  run,
  simulated,
}: {
  run: Run;
  simulated: boolean;
}) {
  if (run.kind === "idle")
    return simulated ? (
      <Callout tone="demo" title="Análise simulada">
        Nesta versão interna, a análise usa um simulador: a foto é conferida
        pelo servidor, mas nenhuma inteligência artificial a observa e o
        resultado é fictício.
      </Callout>
    ) : null;
  if (run.kind === "running")
    return (
      <div aria-live="polite">
        <Callout tone="info" title="Analisando a foto">
          Isso pode levar alguns segundos. A foto não é guardada pelo Sidera.
        </Callout>
      </div>
    );
  if (run.kind === "error") {
    const m = ANALYSIS_ERROR_MESSAGES[run.code];
    return (
      <Callout tone="danger" title={m.title}>
        {m.body}
        {m.reconsent && (
          <>
            {" "}
            <Link
              href={routes.palmConsent}
              className="underline underline-offset-2"
            >
              Confirmar consentimento
            </Link>
          </>
        )}
        {m.retake && (
          <span className="mt-1 block">
            Use &quot;Tirar outra&quot; ou &quot;Trocar foto&quot; abaixo.
          </span>
        )}
      </Callout>
    );
  }
  const { result } = run;
  if (result.status === "insufficient")
    return (
      <Callout tone="danger" title="A foto não permitiu a análise">
        Não foi possível observar a palma com segurança. Tire outra foto: palma
        aberta e de frente, mão inteira no quadro, com luz natural e sem
        reflexos.
      </Callout>
    );
  return (
    <Callout tone="info" title="Só parte da palma pôde ser observada">
      Algumas características não ficaram visíveis e não serão interpretadas.
      Recomendamos tirar outra foto, mas você pode seguir com esta análise.
    </Callout>
  );
}
