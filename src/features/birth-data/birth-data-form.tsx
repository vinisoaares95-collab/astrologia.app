"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent, type ReactNode } from "react";

import { Button, Callout } from "@/components/ui";
import { routes } from "@/config/routes";
import { cn } from "@/lib/cn";

import {
  validateBirthData,
  type BirthDataErrors,
  type BirthDataInput,
} from "./validate-birth-data";

const inputClass =
  "h-12 w-full rounded-2xl border border-line bg-bg-deep px-4 text-fg placeholder:text-fg-subtle transition-colors focus:border-accent focus:outline-none disabled:opacity-50 [color-scheme:dark]";

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-fg">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-fg-subtle">
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
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <Field id={`${id}-date`} label="Data de nascimento" error={errors.date}>
        <input
          id={`${id}-date`}
          type="date"
          className={cn(inputClass, errors.date && "border-danger")}
          value={values.date}
          onChange={(e) => update("date", e.target.value)}
          aria-invalid={Boolean(errors.date)}
          aria-describedby={describedBy("date")}
        />
      </Field>

      <Field
        id={`${id}-time`}
        label="Horário de nascimento"
        hint="Consulte a certidão de nascimento, se possível. O horário define o Ascendente."
        error={errors.time}
      >
        <input
          id={`${id}-time`}
          type="time"
          className={cn(inputClass, errors.time && "border-danger")}
          value={values.time}
          disabled={values.unknownTime}
          onChange={(e) => update("time", e.target.value)}
          aria-invalid={Boolean(errors.time)}
          aria-describedby={describedBy("time", true)}
        />
      </Field>
      <label className="-mt-2 flex items-center gap-3 text-sm text-fg-muted">
        <input
          type="checkbox"
          className="size-4 accent-[var(--color-accent)]"
          checked={values.unknownTime}
          onChange={(e) => update("unknownTime", e.target.checked)}
        />
        Não sei o horário exato
      </label>

      <Field
        id={`${id}-place`}
        label="Cidade de nascimento"
        hint="Ex.: Belo Horizonte, MG. A busca de cidades será adicionada em breve."
        error={errors.place}
      >
        <input
          id={`${id}-place`}
          type="text"
          autoComplete="off"
          placeholder="Cidade, estado ou país"
          className={cn(inputClass, errors.place && "border-danger")}
          value={values.place}
          onChange={(e) => update("place", e.target.value)}
          aria-invalid={Boolean(errors.place)}
          aria-describedby={describedBy("place", true)}
        />
      </Field>

      {values.unknownTime && (
        <Callout tone="info">
          Sem o horário, algumas partes do mapa — como o Ascendente e as casas —
          não podem ser calculadas com precisão. O relatório indicará isso com
          clareza.
        </Callout>
      )}

      <Callout tone="demo" title="Versão demonstrativa">
        Os dados ficam apenas nesta tela. Nada é enviado, salvo ou calculado.
      </Callout>

      <Button type="submit" size="lg" fullWidth>
        Ver a proposta do relatório
      </Button>
    </form>
  );
}
