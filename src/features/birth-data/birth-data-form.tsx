"use client";

import { CalendarDays, Clock3, MapPin, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent, type ReactNode } from "react";

import { ActionDock, Button, Callout, Switch } from "@/components/ui";
import { routes } from "@/config/routes";
import { cn } from "@/lib/cn";

import {
  validateBirthData,
  type BirthDataErrors,
  type BirthDataInput,
} from "./validate-birth-data";

const inputClass =
  "h-11 w-full bg-transparent text-[0.95rem] text-fg placeholder:text-fg-subtle focus:outline-none disabled:opacity-40 [color-scheme:dark]";

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
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-raised text-accent">
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

export function BirthDataForm() {
  const router = useRouter();
  const id = useId();
  const [values, setValues] = useState<BirthDataInput>({
    date: "",
    time: "",
    unknownTime: false,
    place: "",
  });
  const [errors, setErrors] = useState<BirthDataErrors>({});

  function update<K extends keyof BirthDataInput>(
    key: K,
    value: BirthDataInput[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
    // O erro de um campo some assim que a pessoa volta a editá-lo.
    const field = key === "unknownTime" ? "time" : key;
    setErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field as keyof BirthDataErrors];
      return next;
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateBirthData(values, new Date());
    setErrors(found);
    if (Object.keys(found).length === 0) {
      // Nada é enviado: seguimos para a proposta e os dados são descartados.
      router.push(routes.report);
    }
  }

  const describedBy = (field: keyof BirthDataErrors, hasHint = false) =>
    errors[field]
      ? `${id}-${field}-error`
      : hasHint
        ? `${id}-${field}-hint`
        : undefined;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col gap-5">
      <Field
        id={`${id}-date`}
        icon={CalendarDays}
        label="Data de nascimento"
        error={errors.date}
      >
        <input
          id={`${id}-date`}
          type="date"
          className={inputClass}
          value={values.date}
          onChange={(e) => update("date", e.target.value)}
          aria-invalid={Boolean(errors.date)}
          aria-describedby={describedBy("date")}
        />
      </Field>

      <div className="space-y-3">
        <Field
          id={`${id}-time`}
          icon={Clock3}
          label="Horário"
          hint="Consulte a certidão, se possível. O horário define o Ascendente."
          error={errors.time}
        >
          <input
            id={`${id}-time`}
            type="time"
            className={inputClass}
            value={values.time}
            disabled={values.unknownTime}
            onChange={(e) => update("time", e.target.value)}
            aria-invalid={Boolean(errors.time)}
            aria-describedby={describedBy("time", true)}
          />
        </Field>
        <Switch
          label="Não sei o horário exato"
          checked={values.unknownTime}
          onChange={(checked) => update("unknownTime", checked)}
        />
      </div>

      <Field
        id={`${id}-place`}
        icon={MapPin}
        label="Cidade de nascimento"
        hint="Ex.: Belo Horizonte, MG. A busca de cidades chega em breve."
        error={errors.place}
      >
        <input
          id={`${id}-place`}
          type="text"
          autoComplete="off"
          placeholder="Cidade, estado ou país"
          className={inputClass}
          value={values.place}
          onChange={(e) => update("place", e.target.value)}
          aria-invalid={Boolean(errors.place)}
          aria-describedby={describedBy("place", true)}
        />
      </Field>

      {values.unknownTime && (
        <Callout tone="info">
          Sem o horário, o Ascendente e as casas não podem ser calculados com
          precisão. O relatório indicará isso com clareza.
        </Callout>
      )}

      <Callout tone="demo" title="Versão demonstrativa">
        Os dados ficam apenas nesta tela. Nada é enviado, salvo ou calculado.
      </Callout>

      <ActionDock>
        <Button type="submit" size="lg" fullWidth>
          Ver a proposta do relatório
        </Button>
      </ActionDock>
    </form>
  );
}
