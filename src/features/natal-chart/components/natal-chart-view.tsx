"use client";

import { useState } from "react";

import type { Body } from "@/features/astrology/domain/types";
import { Badge, Callout, Switch } from "@/components/ui";

import type { ChartView } from "../contract";
import { BodyDetails } from "./body-details";
import { ChartLegend } from "./chart-legend";
import { ChartParameters } from "./chart-parameters";
import { ChartTables } from "./chart-tables";
import { NatalWheel } from "./natal-wheel";

/** Mandala + detalhes + tabelas + parâmetros. Só exibe dados calculados. */
export function NatalChartView({ chart }: { chart: ChartView }) {
  const [selected, setSelected] = useState<Body | null>(null);
  const [showAspects, setShowAspects] = useState(true);

  return (
    <section
      className="animate-fade-up space-y-5"
      aria-labelledby="mapa-natal"
      data-testid="natal-chart"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="mapa-natal" className="text-xl font-semibold text-fg">
          Mapa natal calculado
        </h2>
        <div className="flex gap-2">
          <Badge tone="accent">Ambiente interno</Badge>
          {chart.precision !== "exact" && (
            <Badge tone="demo">
              {chart.precision === "approximate"
                ? "Horário aproximado"
                : "Sem horário"}
            </Badge>
          )}
        </div>
      </div>

      <Callout tone="info" title="Somente dados astronômicos">
        Posições calculadas pelo Swiss Ephemeris para os dados informados.
        Nenhuma interpretação é apresentada nesta etapa.
      </Callout>

      {chart.warnings.length > 0 && (
        <ul
          className="space-y-1.5 rounded-2xl border border-line bg-surface-raised/60 p-3 text-xs leading-relaxed text-fg-muted"
          data-testid="chart-warnings"
        >
          {chart.warnings.map((w) => (
            <li key={w.code + w.message}>• {w.message}</li>
          ))}
        </ul>
      )}

      <div className="@container mx-auto w-full max-w-[40rem]">
        <NatalWheel
          chart={chart}
          selected={selected}
          onSelect={setSelected}
          showAspects={showAspects}
        />
      </div>

      <Switch
        label="Mostrar linhas de aspectos"
        checked={showAspects}
        onChange={setShowAspects}
      />

      {selected ? (
        <BodyDetails chart={chart} body={selected} />
      ) : (
        <p className="text-center text-xs text-fg-subtle">
          Toque em um planeta (ou use Tab e as setas) para ver os dados
          calculados.
        </p>
      )}

      <ChartLegend />
      <ChartTables chart={chart} />

      <section className="space-y-2" aria-labelledby="parametros">
        <h3 id="parametros" className="font-semibold text-fg">
          Dados e parâmetros do cálculo
        </h3>
        <ChartParameters chart={chart} />
      </section>
    </section>
  );
}
