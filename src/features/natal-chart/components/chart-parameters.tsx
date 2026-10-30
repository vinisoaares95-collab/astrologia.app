import { Stat } from "@/components/ui";
import {
  describeOffset,
  formatLocalDate,
  formatLocalTime,
  formatUtc,
} from "@/features/birth-data/format";
import { formatCoordinates } from "@/features/birth-data/components/place-combobox";

import type { ChartView } from "../contract";

/** Identificação dos dados e parâmetros usados no cálculo. */
export function ChartParameters({ chart }: { chart: ChartView }) {
  const { parameters: p, birth } = chart;
  const t = birth.time;
  const localTime =
    t.precision === "exact"
      ? formatLocalTime(t.local)
      : t.precision === "approximate"
        ? `${formatLocalTime(t.local)} ± ${t.marginMinutes} min`
        : "desconhecido";
  return (
    <div
      className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl bg-surface/80 p-4 edge-light sm:grid-cols-3"
      data-testid="chart-parameters"
    >
      <Stat
        className="col-span-2 sm:col-span-3"
        label="Local"
        value={`${birth.place.label} · ${formatCoordinates(birth.place.coordinates)}`}
      />
      <Stat
        label="Data e hora locais"
        value={`${formatLocalDate(birth.localDate)} · ${localTime}`}
      />
      <Stat
        label="Fuso"
        value={`${birth.place.timeZone}${t.precision !== "unknown" ? ` · ${describeOffset(t.instant)}` : ""}`}
      />
      <Stat
        label={
          t.precision === "unknown"
            ? "Referência (meio-dia local)"
            : "Instante em UTC"
        }
        value={p.instantUtc.replace("T", " ").replace("Z", " UTC")}
      />
      {p.window && (
        <Stat
          className="col-span-2"
          label="Janela considerada (UTC)"
          value={`${p.window.startUtc} → ${p.window.endUtc}`}
        />
      )}
      <Stat label="Zodíaco" value="Tropical" />
      <Stat
        label="Casas"
        value={chart.houses ? "Placidus" : "Placidus (não determinadas)"}
      />
      <Stat
        label="Referencial"
        value="Geocêntrico, aparente, eclíptica da data"
      />
      <Stat label="Motor" value={`Swiss Ephemeris ${p.engineVersion}`} />
      <Stat label="Efemérides" value={p.ephemeris} />
      <Stat label="Orbes" value={p.orbs} />
      <Stat label="Base de fusos" value={`IANA tzdb ${p.tzdbVersion}`} />
      <Stat label="Dia juliano (UT)" value={p.julianDayUt.toFixed(6)} />
      <Stat
        className="col-span-2 sm:col-span-3"
        label="Versão do cálculo"
        value={
          <span className="font-mono text-xs break-all">{p.calcVersion}</span>
        }
      />
      {t.precision !== "unknown" && (
        <Stat label="Conferência" value={formatUtc(t.instant)} />
      )}
    </div>
  );
}
