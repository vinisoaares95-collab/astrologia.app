"use client";

import { ArrowRight, Hand, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ActionDock, Button, Callout, Checkbox } from "@/components/ui";
import { routes } from "@/config/routes";
import { cn } from "@/lib/cn";

import {
  CONSENT_SECTIONS,
  HAND_LABELS,
  MIN_AGE,
  createConsent,
  type PalmHand,
} from "../consent";
import { requestConsentReceipt } from "../lib/analysis-client";
import { useAnalysisAvailability } from "../lib/use-analysis-availability";
import { usePalmPhoto } from "../palm-photo-context";

const HANDS: PalmHand[] = ["right", "left"];

/**
 * Antes da câmera: finalidade da foto, confirmação de idade, consentimento
 * específico (caixas desmarcadas por padrão) e a mão que será fotografada.
 */
export function ConsentForm() {
  const router = useRouter();
  const {
    consent,
    hand: savedHand,
    accept,
    withdraw,
    setReceipt,
  } = usePalmPhoto();
  const availability = useAnalysisAvailability();
  const [sending, setSending] = useState(false);
  const [receiptFailed, setReceiptFailed] = useState(false);
  const [adult, setAdult] = useState(Boolean(consent));
  const [analysis, setAnalysis] = useState(Boolean(consent));
  const [hand, setHand] = useState<PalmHand | null>(savedHand);
  const [tried, setTried] = useState(false);

  const missing = [
    !adult && `confirme que tem ${MIN_AGE} anos ou mais`,
    !analysis && "autorize o uso da foto",
    !hand && "escolha a mão",
  ].filter(Boolean) as string[];

  async function submit() {
    setTried(true);
    const next = createConsent({ adult, analysis });
    if (!next || !hand) return;
    accept(next, hand);
    // Com a análise habilitada, o servidor confere o aceite e emite um
    // recibo assinado; sem ele, a foto continua só no aparelho.
    if (availability.status === "ready" && availability.enabled) {
      setSending(true);
      const r = await requestConsentReceipt(next, hand);
      setSending(false);
      setReceipt(r.ok ? r.receipt : null);
      if (!r.ok) {
        setReceiptFailed(true);
        return;
      }
    }
    router.push(routes.palmPhoto);
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <section aria-labelledby="sobre-a-foto" className="space-y-3">
        <h2 id="sobre-a-foto" className="text-lg font-semibold text-fg">
          Sobre a sua foto
        </h2>
        <dl className="divide-y divide-line-soft rounded-2xl bg-surface/80 edge-light">
          {CONSENT_SECTIONS.map((s) => (
            <div key={s.title} className="space-y-1 px-4 py-3.5">
              <dt className="text-sm font-semibold text-fg">{s.title}</dt>
              <dd className="text-xs leading-relaxed text-fg-muted">
                {s.body}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <fieldset className="space-y-3">
        <legend className="mb-3 text-lg font-semibold text-fg">
          Qual mão você vai fotografar?
        </legend>
        <p className="-mt-1 text-xs leading-relaxed text-fg-muted">
          Use a sua mão dominante, aquela com que você escreve. Fotografe a
          palma da mesma mão que escolher aqui.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {HANDS.map((h) => (
            <label
              key={h}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-2.5 rounded-2xl p-4 text-center transition-all duration-300 ease-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
                hand === h
                  ? "bg-accent-soft shadow-[0_0_0_1px_var(--color-accent)]"
                  : "bg-bg-deep/60 shadow-[0_0_0_1px_var(--color-line)] hover:shadow-[0_0_0_1px_#ff7a3366]",
              )}
            >
              <input
                type="radio"
                name="palm-hand"
                value={h}
                className="sr-only"
                checked={hand === h}
                onChange={() => setHand(h)}
              />
              <span className="flex size-11 items-center justify-center rounded-xl bg-surface-bright text-accent">
                {/* O ícone mostra uma palma direita; espelhado para a esquerda. */}
                <Hand
                  aria-hidden
                  className={cn("size-6", h === "left" && "-scale-x-100")}
                />
              </span>
              <span className="text-sm font-medium text-fg">
                {HAND_LABELS[h]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-3">
        <Checkbox checked={adult} onChange={setAdult}>
          Tenho {MIN_AGE} anos ou mais
        </Checkbox>
        <Checkbox
          checked={analysis}
          onChange={setAnalysis}
          description="Você pode desistir a qualquer momento. Texto provisório, sujeito a revisão jurídica antes do lançamento."
        >
          Autorizo o uso da foto da palma da minha mão para a leitura simbólica
          das mãos, nas condições acima
        </Checkbox>
      </div>

      {tried && missing.length > 0 && (
        <Callout tone="danger" title="Falta pouco">
          Para continuar, {missing.join(", ")}.
        </Callout>
      )}

      {receiptFailed && (
        <Callout
          tone="danger"
          title="Não conseguimos registrar o consentimento"
        >
          Tente de novo em instantes. Se preferir, continue: a foto será só
          preparada neste aparelho, sem análise.
        </Callout>
      )}

      <ActionDock>
        <Button
          size="lg"
          fullWidth
          onClick={() => void submit()}
          disabled={sending}
        >
          {sending ? (
            <LoaderCircle aria-hidden className="size-4 animate-spin" />
          ) : null}
          Continuar para a foto
          {!sending && <ArrowRight aria-hidden className="size-4" />}
        </Button>
        {receiptFailed && (
          <Button
            variant="secondary"
            onClick={() => router.push(routes.palmPhoto)}
          >
            Continuar sem análise
          </Button>
        )}
        {consent && (
          <Button
            variant="ghost"
            onClick={() => {
              withdraw();
              setAdult(false);
              setAnalysis(false);
              setHand(null);
              setTried(false);
            }}
          >
            Retirar consentimento e descartar foto
          </Button>
        )}
      </ActionDock>
    </div>
  );
}
