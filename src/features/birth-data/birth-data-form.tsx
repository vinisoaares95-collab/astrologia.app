"use client";

import {
  CalendarDays,
  Clock3,
  FlaskConical,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useId,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";

import { ActionDock, Button, Callout } from "@/components/ui";
import { routes } from "@/config/routes";
import { getPlaceAction } from "@/features/places/actions";
import type { PlaceSummary } from "@/features/places/types";
import { cn } from "@/lib/cn";

import { NatalChartView } from "@/features/natal-chart/components/natal-chart-view";
import {
  computeChartAction,
  type ComputeChartResult,
} from "@/features/natal-chart/actions";

import { normalizeBirthAction } from "./actions";
import { NormalizationReview } from "./components/normalization-review";
import { PlaceCombobox } from "./components/place-combobox";
import {
  TimePrecisionField,
  type TimePrecision,
} from "./components/time-precision-field";
import type {
  ApproximateMargin,
  BirthDataInput,
  NormalizationResult,
} from "./contract";
import { DEMO_CASES } from "./demo-cases";
import { maskDateBR, maskTime24 } from "./input-masks";
import { validateBirthData, type BirthDataErrors } from "./validate-birth-data";

const inputClass =
  "h-9 w-full bg-transparent text-base text-fg tabular-nums placeholder:text-fg-subtle/70 focus:outline-none disabled:opacity-40";

function Field({
  id,
  icon: Icon,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  icon: LucideIcon;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl bg-bg-deep/70 py-1.5 pr-4 pl-1.5 shadow-[0_0_0_1px_var(--color-line)] transition-shadow duration-300 focus-within:shadow-[0_0_0_1px_var(--color-accent),0_0_0_4px_#ff7a331f]",
          error && "shadow-[0_0_0_1px_var(--color-danger)]",
        )}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-raised text-accent">
          <Icon aria-hidden className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <label
            htmlFor={id}
            className="block font-mono text-[0.6rem] tracking-[0.16em] text-fg-subtle uppercase"
          >
            {label}
          </label>
          {children}
        </div>
      </div>
      {error ? (
        <p id={`${id}-error`} className="px-1 text-xs text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="px-1 text-xs text-fg-subtle">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

type FormState = {
  date: string;
  time: string;
  precision: TimePrecision;
  margin: ApproximateMargin;
  place: PlaceSummary | null;
};

const EMPTY: FormState = {
  date: "",
  time: "",
  precision: "exact",
  margin: 30,
  place: null,
};

function toInput(
  values: FormState,
  occurrence?: "earlier" | "later",
): BirthDataInput {
  const time: BirthDataInput["time"] =
    values.precision === "unknown"
      ? { precision: "unknown" }
      : values.precision === "approximate"
        ? {
            precision: "approximate",
            value: values.time,
            marginMinutes: values.margin,
          }
        : { precision: "exact", value: values.time };
  return {
    date: values.date,
    time,
    placeId: values.place?.id ?? null,
    occurrence,
  };
}

export function BirthDataForm({
  engineEnabled = false,
}: {
  /** Motor de cálculo disponível (somente ambiente interno). */
  engineEnabled?: boolean;
}) {
  const router = useRouter();
  const id = useId();
  const [values, setValues] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<BirthDataErrors>({});
  const [result, setResult] = useState<NormalizationResult | null>(null);
  const [occurrence, setOccurrence] = useState<"earlier" | "later">();
  const [chart, setChart] = useState<ComputeChartResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [chartPending, startChartTransition] = useTransition();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setResult(null); // qualquer edição invalida a conferência anterior
    setChart(null);
    const field = key === "precision" || key === "margin" ? "time" : key;
    setErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field as keyof BirthDataErrors];
      return next;
    });
  }

  function normalize(occurrence?: "earlier" | "later") {
    const input = toInput(values, occurrence);
    const found = validateBirthData(input, new Date());
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setOccurrence(occurrence);
    setChart(null);
    startTransition(async () => {
      const response = await normalizeBirthAction(input);
      if (response.status === "invalid") {
        const next: BirthDataErrors = {};
        for (const issue of response.issues)
          next[issue.field] ??= issue.message;
        setErrors(next);
        setResult(null);
      } else {
        setResult(response);
      }
    });
  }

  function computeChart() {
    // Mesma entrada já conferida (inclui a ocorrência escolhida, se houver);
    // o servidor normaliza de novo com o mesmo código antes de calcular.
    const input = toInput(values, occurrence);
    startChartTransition(async () => {
      setChart(await computeChartAction(input));
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (result?.status === "ok") {
      // Nada é enviado nem salvo: seguimos para a proposta e os dados são descartados.
      router.push(routes.report);
      return;
    }
    normalize();
  }

  async function loadDemo(index: number) {
    const demo = DEMO_CASES[index];
    const place = await getPlaceAction(demo.placeId);
    setValues({
      date: demo.date,
      time: demo.time,
      precision: demo.precision,
      margin: demo.margin ?? 30,
      place,
    });
    setErrors({});
    setResult(null);
  }

  const describedBy = (field: keyof BirthDataErrors, hasHint = false) =>
    errors[field]
      ? `${id}-${field}-error`
      : hasHint
        ? `${id}-${field}-hint`
        : undefined;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col gap-4">
      {/*
       * Data e hora usam campos de texto com máscara em vez de inputs nativos:
       * o formato nativo segue o idioma do navegador (mm/dd, 12 h) e não o
       * padrão brasileiro.
       */}
      <Field
        id={`${id}-date`}
        icon={CalendarDays}
        label="Data de nascimento"
        hint="Dia, mês e ano — ex.: 14/03/1992."
        error={errors.date}
      >
        <input
          id={`${id}-date`}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="DD/MM/AAAA"
          maxLength={10}
          className={inputClass}
          value={values.date}
          onChange={(e) => update("date", maskDateBR(e.target.value))}
          aria-invalid={Boolean(errors.date)}
          aria-describedby={describedBy("date", true)}
        />
      </Field>

      <div className="space-y-2">
        <TimePrecisionField
          precision={values.precision}
          margin={values.margin}
          onPrecisionChange={(p) => update("precision", p)}
          onMarginChange={(m) => update("margin", m)}
        />
        {values.precision !== "unknown" && (
          <Field
            id={`${id}-time`}
            icon={Clock3}
            label={
              values.precision === "approximate"
                ? "Horário aproximado (24 h)"
                : "Horário (24 h)"
            }
            hint="Ex.: 09:30 ou 21:45. Consulte a certidão, se possível."
            error={errors.time}
          >
            <input
              id={`${id}-time`}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="HH:MM"
              maxLength={5}
              className={inputClass}
              value={values.time}
              onChange={(e) => update("time", maskTime24(e.target.value))}
              aria-invalid={Boolean(errors.time)}
              aria-describedby={describedBy("time", true)}
            />
          </Field>
        )}
        {values.precision === "unknown" && (
          <Callout tone="info">
            Sem o horário, o Ascendente e as casas não serão calculados. O
            relatório indicará isso com clareza.
          </Callout>
        )}
        {values.precision === "unknown" && errors.time && (
          <p className="px-1 text-xs text-danger">{errors.time}</p>
        )}
      </div>

      <PlaceCombobox
        value={values.place}
        onChange={(p) => update("place", p)}
        error={errors.place}
      />

      {result?.status === "needs-choice" && (
        <Callout
          tone="info"
          title={`O horário ${result.localTime} aconteceu duas vezes`}
        >
          <p>
            Nesta data, os relógios foram atrasados e esse horário se repetiu.
            Qual das ocorrências corresponde ao nascimento? Se não souber,
            consulte a certidão.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {result.options.map((option) => (
              <Button
                key={option.occurrence}
                variant="secondary"
                onClick={() => normalize(option.occurrence)}
                disabled={pending}
              >
                {option.description}
              </Button>
            ))}
          </div>
        </Callout>
      )}

      {result?.status === "ok" && <NormalizationReview birth={result.birth} />}

      {result?.status === "ok" && engineEnabled && (
        <Button
          variant="secondary"
          onClick={computeChart}
          disabled={chartPending}
        >
          {chartPending
            ? "Calculando…"
            : "Calcular mapa natal (ambiente interno)"}
        </Button>
      )}
      {chart?.status === "engine-disabled" && (
        <Callout tone="info" title="Cálculo indisponível neste ambiente">
          O motor astrológico só funciona no ambiente interno de
          desenvolvimento.
        </Callout>
      )}
      {chart?.status === "engine-error" && (
        <Callout tone="danger" title="Não foi possível calcular o mapa">
          {chart.message}
        </Callout>
      )}
      {chart?.status === "invalid" && (
        <Callout tone="danger" title="Dados inválidos para o cálculo">
          {chart.issues.map((i) => i.message).join(" ")}
        </Callout>
      )}
      {chart?.status === "ok" && <NatalChartView chart={chart.chart} />}

      <Callout tone="demo" title="Versão demonstrativa">
        Os dados ficam apenas nesta tela. A verificação acontece no servidor,
        sem salvar nada,{" "}
        {engineEnabled
          ? "e o mapa só é calculado neste ambiente interno."
          : "e nenhum mapa é calculado ainda."}
      </Callout>

      <details className="group rounded-2xl bg-surface/60 px-4 py-3 edge-light">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm text-fg-muted">
          <FlaskConical aria-hidden className="size-4 text-accent" />
          Casos de verificação (fictícios)
        </summary>
        <ul className="mt-3 grid gap-1.5">
          {DEMO_CASES.map((demo, i) => (
            <li key={demo.label}>
              <button
                type="button"
                onClick={() => loadDemo(i)}
                className="w-full rounded-xl px-3 py-2 text-left text-xs text-fg-muted transition-colors hover:bg-surface-bright hover:text-fg"
              >
                {demo.label}
              </button>
            </li>
          ))}
        </ul>
      </details>

      {/* Com uma escolha pendente, a ação fica nas opções acima. */}
      {result?.status !== "needs-choice" && (
        <ActionDock>
          <Button type="submit" size="lg" fullWidth disabled={pending}>
            {pending
              ? "Verificando…"
              : result?.status === "ok"
                ? "Confirmar e ver a proposta"
                : "Verificar dados"}
          </Button>
          {result?.status === "ok" && (
            <Button variant="ghost" onClick={() => setResult(null)}>
              Corrigir dados
            </Button>
          )}
        </ActionDock>
      )}
    </form>
  );
}
