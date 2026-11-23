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
  Undo2,
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
import {
  photoModeOf,
  useAnalysisAvailability,
} from "../lib/use-analysis-availability";
import { PHOTO_PRIVACY } from "../privacy-copy";
import type { PalmAnalysisResult } from "../chapters/presentation";
import { ACCEPT_ATTRIBUTE } from "../lib/image-validation";
import { loadLocalPhoto } from "../lib/load-image";
import { usePalmPhoto } from "../palm-photo-context";

type Run =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "decision"; result: PalmAnalysisResult }
  | { kind: "error"; code: AnalysisErrorCode };

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "cancelled" }
  | { kind: "error"; message: string };

/** Conferência antes de analisar: curta, para ler no celular. */
const selfCheck = [
  "É a palma da mão escolhida, não o dorso",
  "Mão inteira: do pulso às pontas dos dedos",
  "Palma de frente, dedos levemente afastados",
  "Celular paralelo à palma, sem inclinar",
  "Foto nítida, com boa luz, fundo liso e sem reflexos",
  "Só a palma: sem rosto, outras pessoas, documentos ou telas",
];

/**
 * Antes de seguir, a pessoa decide (03F.2, Etapa B) quando algum capítulo
 * ficou indisponível ou a leitura ficou parcial com pouco observado.
 */
export function needsDecision(result: PalmAnalysisResult): boolean {
  return (
    result.retakeRecommended ||
    result.chapters.some((c) => c.status === "unavailable")
  );
}

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
  const {
    photo,
    setPhoto,
    clearPhoto,
    receipt,
    analysis,
    setAnalysis,
    previous,
    restorePrevious,
    remaining,
    setRemaining,
  } = usePalmPhoto();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const availability = useAnalysisAvailability();
  const canAnalyze = availability.status === "ready" && availability.enabled;
  const simulated = canAnalyze && availability.simulated;
  // Voltando da prévia com a foto já analisada, a decisão continua aberta.
  const [run, setRun] = useState<Run>(() =>
    analysis ? { kind: "decision", result: analysis } : { kind: "idle" },
  );
  const decisionRef = useRef<HTMLDivElement>(null);
  // Cada envio tem um número; trocar ou descartar a foto invalida o envio em
  // andamento, para que uma resposta atrasada nunca valha para outra foto.
  const attempt = useRef(0);

  async function analyze() {
    if (!photo) return;
    if (!receipt) {
      setRun({ kind: "error", code: "consent_required" });
      return;
    }
    const id = ++attempt.current;
    setRun({ kind: "running" });
    const r = await requestPalmAnalysis(photo.blob, receipt);
    if (r.remaining !== null) setRemaining(r.remaining);
    if (id !== attempt.current) return;
    if (!r.ok) {
      setRun({ kind: "error", code: r.error });
      return;
    }
    setAnalysis(r.result);
    if (needsDecision(r.result)) setRun({ kind: "decision", result: r.result });
    else router.push(routes.palmPreview);
  }

  // A decisão aparece no topo: a pessoa lê o motivo antes das ações.
  useEffect(() => {
    if (run.kind !== "decision") return;
    decisionRef.current?.scrollIntoView?.({ block: "start" });
    decisionRef.current?.focus({ preventScroll: true });
  }, [run.kind]);

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
        attempt.current++;
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
  const running = run.kind === "running";
  const openCamera = () => cameraInput.current?.click();
  const openGallery = () => galleryInput.current?.click();
  const decision = run.kind === "decision" ? run.result : null;
  const hasContent = decision?.chapters.some((c) => c.status === "content");
  const noneLeft = remaining === 0;

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
        data-testid="camera-input"
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

      {photo && decision && (
        <DecisionPanel
          ref={decisionRef}
          result={decision}
          remaining={remaining}
        />
      )}

      {photo ? (
        <div className="animate-fade-up space-y-5">
          <figure className="relative overflow-hidden rounded-3xl bg-bg-deep edge-light">
            {/* eslint-disable-next-line @next/next/no-img-element -- URL blob local; next/image não se aplica */}
            <img
              src={photo.url}
              alt="Pré-visualização da foto da sua palma"
              className={cn(
                "mx-auto w-auto object-contain",
                decision ? "max-h-[28vh]" : "max-h-[46vh]",
              )}
            />
            <FrameCorners />
            <figcaption className="absolute top-5 left-5">
              <Badge tone={decision ? "neutral" : "success"} dot>
                {decision ? "Foto analisada" : "Foto pronta"}
              </Badge>
            </figcaption>
          </figure>

          {/* Ações secundárias fora do rodapé fixo: ele não cobre o texto em telas pequenas. */}
          <div className="-mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
            {previous && !decision && !running && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  attempt.current++;
                  restorePrevious();
                  setRun({ kind: "decision", result: previous.analysis });
                }}
              >
                <Undo2 aria-hidden className="size-4" />
                Voltar à foto analisada antes
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              disabled={running}
              onClick={() => {
                attempt.current++;
                clearPhoto();
                setStatus({ kind: "idle" });
                setRun({ kind: "idle" });
              }}
            >
              <Trash2 aria-hidden className="size-4" />
              Descartar foto
            </Button>
          </div>

          {!decision && (
            <>
              <div className="grid grid-cols-2 gap-x-3 gap-y-4 rounded-2xl bg-surface/80 p-4 edge-light">
                <Stat label="Mão" value={handLabel} />
                <Stat
                  label="Resolução"
                  value={`${photo.width}×${photo.height}`}
                />
                <Stat label="Tamanho" value={formatFileSize(photo.sizeBytes)} />
                <Stat label="EXIF/GPS" value="Removidos" />
              </div>
              <p className="-mt-2 px-1 text-xs leading-relaxed text-fg-subtle">
                {PHOTO_PRIVACY.prepared[photoModeOf(availability)]}
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
                  Esta verificação é aproximada: não percebe mão inclinada nem
                  cortada. Confira a foto você também.
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
            </>
          )}
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
              className="h-[40%] opacity-60"
            />
          )}
          <div className="space-y-1.5" aria-live="polite">
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
            {!loading && (
              <p className="text-xs leading-relaxed text-fg">
                Palma de frente · celular paralelo à mão · mão inteira, do pulso
                às pontas dos dedos · só a palma, fundo liso
              </p>
            )}
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

      {photo && !decision && (
        <AnalysisFeedback
          run={run}
          simulated={simulated}
          remaining={canAnalyze ? remaining : null}
        />
      )}

      <ActionDock>
        {photo ? (
          <>
            {decision ? (
              !noneLeft ? (
                <>
                  {/* Nova foto como ação principal: câmera no celular; no
                      computador, o mesmo campo abre a escolha de arquivo. */}
                  <Button
                    size="lg"
                    fullWidth
                    onClick={openCamera}
                    disabled={loading}
                  >
                    <Camera
                      aria-hidden
                      className="size-4 pointer-fine:hidden"
                    />
                    <ImageUp
                      aria-hidden
                      className="hidden size-4 pointer-fine:block"
                    />
                    <span className="pointer-fine:hidden">
                      Tirar outra foto
                    </span>
                    <span className="hidden pointer-fine:inline">
                      Escolher outra foto
                    </span>
                  </Button>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Button
                      variant="secondary"
                      onClick={openGallery}
                      disabled={loading}
                      className={cn(
                        "pointer-fine:hidden",
                        !hasContent && "col-span-2",
                      )}
                    >
                      <ImageUp aria-hidden className="size-4" />
                      Da galeria
                    </Button>
                    {hasContent && (
                      <Button
                        variant="secondary"
                        onClick={() => router.push(routes.palmPreview)}
                        className="pointer-fine:col-span-2"
                      >
                        Seguir com esta leitura
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                hasContent && (
                  <Button
                    size="lg"
                    fullWidth
                    onClick={() => router.push(routes.palmPreview)}
                  >
                    Seguir com esta leitura
                  </Button>
                )
              )
            ) : (
              <>
                {canAnalyze ? (
                  <Button
                    size="lg"
                    fullWidth
                    onClick={() => void analyze()}
                    disabled={running || noneLeft}
                  >
                    {running && (
                      <LoaderCircle
                        aria-hidden
                        className="size-4 animate-spin"
                      />
                    )}
                    {running
                      ? "Analisando a foto…"
                      : simulated
                        ? "Analisar a foto (simulação)"
                        : "Analisar a foto"}
                  </Button>
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
                    disabled={loading || running}
                    className="pointer-fine:hidden"
                  >
                    <Camera aria-hidden className="size-4" />
                    Tirar outra
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={openGallery}
                    disabled={loading || running}
                    className="pointer-fine:col-span-2"
                  >
                    <RefreshCw aria-hidden className="size-4" />
                    <span className="pointer-fine:hidden">Da galeria</span>
                    <span className="hidden pointer-fine:inline">
                      Trocar foto
                    </span>
                  </Button>
                </div>
              </>
            )}
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

const remainingText = (n: number) =>
  n === 1
    ? "Resta 1 análise nesta sessão."
    : `Restam ${n} análises nesta sessão.`;

/**
 * Resultado que pede decisão: o que cada capítulo trouxe, por que algum
 * ficou indisponível e como tirar uma foto melhor. Nada é interpretado
 * aqui: as mensagens vêm do resultado.
 */
function DecisionPanel({
  ref,
  result,
  remaining,
}: {
  ref: React.Ref<HTMLDivElement>;
  result: PalmAnalysisResult;
  remaining: number | null;
}) {
  const unavailable = result.chapters.filter((c) => c.status === "unavailable");
  const none = unavailable.length === result.chapters.length;
  const complete = !unavailable.length && !result.retakeRecommended;
  const title = none
    ? "Esta foto não permitiu a leitura"
    : unavailable.length
      ? "Uma parte da leitura não pôde ser feita"
      : complete
        ? "Sua leitura está pronta"
        : "A leitura ficou parcial";
  return (
    <div
      ref={ref}
      tabIndex={-1}
      aria-live="polite"
      className="scroll-mt-24 space-y-3 outline-none"
    >
      <Callout tone={none ? "danger" : "info"} title={title}>
        {none
          ? "Nenhum dos dois capítulos pôde ser feito com esta foto. Com uma nova foto, a leitura pode ser completada."
          : unavailable.length
            ? "Você pode seguir com o que foi lido ou tirar outra foto para completar."
            : complete
              ? "Se quiser tentar outra foto, esta leitura continua nesta tela até você decidir."
              : "Algumas características não ficaram visíveis e não foram interpretadas. Uma nova foto pode completar a leitura."}
      </Callout>
      <ul className="space-y-2" aria-label="Capítulos desta análise">
        {result.chapters.map((c) => (
          <li
            key={c.number}
            className="space-y-1.5 rounded-2xl bg-surface/80 p-4 edge-light"
          >
            <p className="flex items-center justify-between gap-3 text-sm font-semibold text-fg">
              <span>
                Capítulo {c.number} · {c.title}
              </span>
              <Badge tone={c.status === "content" ? "success" : "neutral"}>
                {c.status === "content" ? "Pronto" : "Indisponível"}
              </Badge>
            </p>
            {c.status === "unavailable" && c.unavailableMessage && (
              <p className="text-xs leading-relaxed text-fg-muted">
                {c.unavailableMessage}
              </p>
            )}
          </li>
        ))}
      </ul>
      {remaining !== null && (
        <p className="px-1 text-xs text-fg-muted">
          {remaining > 0
            ? remainingText(remaining)
            : none
              ? "Você usou as análises desta sessão. Tente mais tarde, com uma nova foto."
              : "Você usou as análises desta sessão. Siga com a leitura obtida."}
        </p>
      )}
    </div>
  );
}

/** Mensagens antes e durante a análise e erros (a decisão tem painel próprio). */
function AnalysisFeedback({
  run,
  simulated,
  remaining,
}: {
  run: Run;
  simulated: boolean;
  remaining: number | null;
}) {
  const left =
    remaining === null ? null : (
      <p className="px-1 text-xs text-fg-muted" data-testid="remaining">
        {remaining > 0
          ? `${remaining === 1 ? "1 análise disponível" : `${remaining} análises disponíveis`} nesta sessão. Falhas técnicas não contam.`
          : "Você usou as análises disponíveis nesta sessão."}
      </p>
    );
  if (run.kind === "idle")
    return (
      <>
        {simulated && (
          <Callout tone="demo" title="Análise simulada">
            Nesta versão interna, a análise usa um simulador: a foto é conferida
            pelo servidor, mas nenhuma inteligência artificial a observa e o
            resultado é fictício.
          </Callout>
        )}
        {left}
      </>
    );
  if (run.kind === "running")
    return (
      <div aria-live="polite">
        <Callout tone="info" title="Analisando a foto">
          A análise e a redação da leitura costumam levar de 20 a 40 segundos.
          Mantenha esta tela aberta.{" "}
          {PHOTO_PRIVACY.running[simulated ? "simulated" : "real"]}
        </Callout>
      </div>
    );
  if (run.kind === "error") {
    const m = ANALYSIS_ERROR_MESSAGES[run.code];
    return (
      <>
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
              Use &quot;Tirar outra&quot; ou &quot;Da galeria&quot; abaixo.
            </span>
          )}
        </Callout>
        {left}
      </>
    );
  }
  return null;
}
