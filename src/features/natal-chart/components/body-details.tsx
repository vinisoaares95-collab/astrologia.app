import type { Body } from "@/features/astrology/domain/types";
import { Badge, Card, Stat } from "@/components/ui";

import type { ChartView } from "../contract";
import {
  ASPECT_NAMES,
  BODY_NAMES,
  POINT_NAMES,
  formatLongitude,
  formatPosition,
} from "../labels";
import { GlyphIcon } from "./glyph";

/** Dados objetivos do corpo selecionado — sem interpretação. */
export function BodyDetails({ chart, body }: { chart: ChartView; body: Body }) {
  const b = chart.bodies.find((x) => x.body === body)!;
  const aspects = chart.aspects.filter((a) => a.a === body || a.b === body);
  const houseText = b.house
    ? `Casa ${b.house}`
    : b.houseVaries
      ? `Varia entre as casas ${b.houseVaries[0]} e ${b.houseVaries[1]}`
      : chart.precision === "unknown"
        ? "Não calculada (sem horário)"
        : "Não determinada";

  return (
    <Card
      variant="raised"
      className="space-y-4"
      aria-live="polite"
      data-testid="body-details"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <GlyphIcon name={body} className="size-6" />
        </span>
        <div className="flex-1">
          <p className="text-lg font-semibold text-fg">{BODY_NAMES[body]}</p>
          <p className="text-sm text-fg-muted">{formatPosition(b)}</p>
        </div>
        {b.retrograde && <Badge tone="accent">Retrógrado</Badge>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Longitude" value={formatLongitude(b.longitude)} />
        <Stat label="Casa" value={houseText} />
        <Stat
          label="Velocidade"
          value={`${b.speed.toFixed(4).replace(".", ",")}°/dia`}
        />
        <Stat label="Latitude eclíptica" value={formatLongitude(b.latitude)} />
        {b.range && (
          <Stat
            className="col-span-2"
            label="Na janela de incerteza"
            value={`${formatLongitude(b.range.start)} → ${formatLongitude(b.range.end)} (${b.range.width.toFixed(2).replace(".", ",")}°${b.range.crossesSign ? ", muda de signo" : ""})`}
          />
        )}
      </div>
      <div className="space-y-2">
        <p className="font-mono text-[0.65rem] tracking-[0.14em] text-fg-subtle uppercase">
          Aspectos calculados ({aspects.length})
        </p>
        {aspects.length === 0 ? (
          <p className="text-sm text-fg-muted">
            Nenhum aspecto maior dentro dos orbes.
          </p>
        ) : (
          <ul className="space-y-1 text-sm text-fg-muted">
            {aspects.map((a) => (
              <li key={`${a.a}-${a.b}-${a.type}`}>
                {ASPECT_NAMES[a.type]} com{" "}
                {POINT_NAMES[a.a === body ? a.b : a.a]} · orbe{" "}
                {a.orb.toFixed(2).replace(".", ",")}°
                {a.applying === null
                  ? ""
                  : a.applying
                    ? " · aplicativo"
                    : " · separativo"}
                {a.uncertain && " · incerto na janela"}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
