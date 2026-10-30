"use client";

import { useId } from "react";

import { cn } from "@/lib/cn";

import { APPROXIMATE_MARGINS, type ApproximateMargin } from "../contract";

export type TimePrecision = "exact" | "approximate" | "unknown";

const OPTIONS: { value: TimePrecision; label: string }[] = [
  { value: "exact", label: "Exato" },
  { value: "approximate", label: "Aproximado" },
  { value: "unknown", label: "Não sei" },
];

const marginLabel = (m: number) => (m < 60 ? `± ${m} min` : `± ${m / 60} h`);

function Segmented<T extends string | number>({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-full bg-surface p-1 shadow-[inset_0_0_0_1px_var(--color-line-soft)]">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "relative cursor-pointer rounded-full px-2 py-2 text-center text-xs font-medium transition-all duration-300 ease-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
              option.value === value
                ? "bg-surface-bright text-fg shadow-[inset_0_1px_0_#ffffff14,0_0_0_1px_#ff7a3340]"
                : "text-fg-subtle hover:text-fg",
            )}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Precisão do horário: exato, aproximado (com margem) ou desconhecido. */
export function TimePrecisionField({
  precision,
  margin,
  onPrecisionChange,
  onMarginChange,
}: {
  precision: TimePrecision;
  margin: ApproximateMargin;
  onPrecisionChange: (value: TimePrecision) => void;
  onMarginChange: (value: ApproximateMargin) => void;
}) {
  const id = useId();
  return (
    <div className="space-y-2">
      <Segmented
        name={`${id}-precision`}
        legend="Precisão do horário de nascimento"
        options={OPTIONS}
        value={precision}
        onChange={onPrecisionChange}
      />
      {precision === "approximate" && (
        <div className="animate-fade-up space-y-1.5">
          <p className="px-1 text-xs text-fg-muted">Margem de incerteza</p>
          <Segmented
            name={`${id}-margin`}
            legend="Margem de incerteza do horário"
            options={APPROXIMATE_MARGINS.map((m) => ({
              value: m,
              label: marginLabel(m),
            }))}
            value={margin}
            onChange={onMarginChange}
          />
        </div>
      )}
    </div>
  );
}
