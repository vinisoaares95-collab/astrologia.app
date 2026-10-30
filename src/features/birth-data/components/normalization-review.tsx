import { CheckCircle2, Info } from "lucide-react";

import { Badge, Card, Stat } from "@/components/ui";

import type { NormalizedBirth } from "../contract";
import {
  describeOffset,
  formatLocalDate,
  formatLocalTime,
  formatUtc,
} from "../format";
import { formatCoordinates } from "./place-combobox";

/** Conferência dos dados normalizados — nada é salvo nem calculado. */
export function NormalizationReview({ birth }: { birth: NormalizedBirth }) {
  const { place, time, localDate } = birth;
  const date = formatLocalDate(localDate);

  return (
    <Card
      variant="raised"
      className="animate-fade-up space-y-4"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-semibold text-fg">
          <CheckCircle2 aria-hidden className="size-4 text-success" />
          Confira os dados
        </p>
        <Badge tone="demo">Não salvo</Badge>
      </div>

      <div
        className="grid grid-cols-2 gap-x-4 gap-y-3"
        data-testid="normalized-review"
      >
        <Stat className="col-span-2" label="Local" value={place.label} />
        <Stat
          label="Coordenadas"
          value={formatCoordinates(place.coordinates)}
        />
        <Stat label="Fuso (IANA)" value={place.timeZone} />
        {time.precision === "exact" && (
          <>
            <Stat
              label="Data e hora locais"
              value={`${date} às ${formatLocalTime(time.local)}`}
            />
            <Stat label="Deslocamento" value={describeOffset(time.instant)} />
            <Stat
              className="col-span-2"
              label="Instante em UTC"
              value={formatUtc(time.instant)}
            />
          </>
        )}
        {time.precision === "approximate" && (
          <>
            <Stat
              label="Data e hora locais"
              value={`${date} às ${formatLocalTime(time.local)} (± ${time.marginMinutes} min)`}
            />
            <Stat label="Deslocamento" value={describeOffset(time.instant)} />
            <Stat
              className="col-span-2"
              label="Janela em UTC"
              value={`${formatUtc(time.earliest)} → ${formatUtc(time.latest)}`}
            />
          </>
        )}
        {time.precision === "unknown" && (
          <>
            <Stat label="Data local" value={`${date} (horário desconhecido)`} />
            <Stat
              label="Meio-dia local em UTC"
              value={formatUtc(time.noonReference)}
            />
            <Stat
              className="col-span-2"
              label="Dia local em UTC"
              value={`${formatUtc(time.dayStart)} → ${formatUtc(time.dayEndExclusive)}`}
            />
          </>
        )}
      </div>

      {birth.warnings.length > 0 && (
        <ul className="space-y-2 border-t border-line-soft pt-3">
          {birth.warnings.map((w) => (
            <li
              key={w.code}
              className="flex gap-2 text-xs leading-relaxed text-fg-muted"
            >
              <Info
                aria-hidden
                className="mt-0.5 size-3.5 shrink-0 text-accent"
              />
              {w.message}
            </li>
          ))}
        </ul>
      )}

      <p className="text-[0.7rem] text-fg-subtle">
        Regras de fuso: IANA tzdb {birth.provenance.tzdbVersion} · Local:{" "}
        {birth.provenance.placeSource}
      </p>
    </Card>
  );
}
