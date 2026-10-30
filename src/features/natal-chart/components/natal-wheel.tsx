"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { SIGNS, type Body } from "@/features/astrology/domain/types";
import { cn } from "@/lib/cn";

import type { ChartAspect, ChartView, LongitudeRange } from "../contract";
import { WHEEL, annularSectorPath, layoutGlyphs, pointAt } from "../geometry";
import {
  BODY_NAMES,
  SIGN_NAMES,
  formatDegree,
  formatPosition,
} from "../labels";
import { Glyph } from "./glyph";

const {
  rOuter,
  rZodiacInner,
  rHouseInner,
  rPlanet,
  rDegreeLabel,
  rAspect,
  rAxisLabel,
} = WHEEL;
const GLYPH_GAP = 9; // graus mínimos entre símbolos no anel dos planetas
const f = (n: number) => Number(n.toFixed(2));

const TENSE = new Set(["square", "opposition"]);

function aspectStyle(
  aspect: ChartAspect,
  emphasis: "normal" | "strong" | "dim",
) {
  const tight = Math.max(0, 1 - aspect.orb / 10);
  return {
    stroke: TENSE.has(aspect.type)
      ? "var(--color-accent)"
      : "var(--color-celestial)",
    strokeOpacity:
      emphasis === "dim"
        ? 0.07
        : emphasis === "strong"
          ? 0.95
          : 0.25 + 0.55 * tight,
    strokeWidth: emphasis === "strong" ? 2.6 : 1 + tight,
    strokeDasharray: aspect.uncertain ? "7 6" : undefined,
  };
}

export function NatalWheel({
  chart,
  selected,
  onSelect,
  showAspects,
}: {
  chart: ChartView;
  selected: Body | null;
  onSelect: (body: Body | null) => void;
  showAspects: boolean;
}) {
  const titleId = useId();
  const descId = useId();
  const orientation = chart.orientation.longitude;
  const at = (lon: number, r: number) => pointAt(lon, r, orientation);
  const placements = useMemo(
    () =>
      layoutGlyphs(
        chart.bodies.map((b) => ({ id: b.body, longitude: b.longitude })),
        GLYPH_GAP,
      ),
    [chart.bodies],
  );
  const order = placements.map((p) => p.id); // ordem zodiacal para o teclado
  const refs = useRef(new Map<Body, SVGGElement>());
  const [focused, setFocused] = useState<Body | null>(null);
  const [rovingIndex, setRovingIndex] = useState(0);

  const byId = new Map(chart.bodies.map((b) => [b.body, b]));
  const sun = byId.get("sun")!;
  const summary = [
    `Sol em ${formatPosition(sun)}`,
    chart.angles
      ? `Ascendente em ${formatPosition(chart.angles.asc)}`
      : "sem Ascendente (horário desconhecido)",
  ].join(", ");

  function move(index: number) {
    const next = (index + order.length) % order.length;
    setRovingIndex(next);
    refs.current.get(order[next])?.focus();
  }

  function onKeyDown(event: KeyboardEvent<SVGGElement>, index: number) {
    const body = order[index];
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      move(index + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      move(index - 1);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      move(event.key === "Home" ? 0 : order.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(selected === body ? null : body);
    } else if (event.key === "Escape") {
      onSelect(null);
    }
  }

  const arc = (range: LongitudeRange, r1: number, r2: number) =>
    annularSectorPath(
      r2,
      r1,
      range.start,
      range.start + Math.max(range.width, 0.15),
      orientation,
    );

  return (
    <svg
      viewBox={`0 0 ${WHEEL.size} ${WHEEL.size}`}
      role="group"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="h-auto w-full select-none"
      data-testid="natal-wheel"
      data-orientation={chart.orientation.kind}
      data-orientation-longitude={orientation}
    >
      <title id={titleId}>{`Mandala natal: ${summary}`}</title>
      <desc id={descId}>
        {chart.orientation.kind === "ascendant"
          ? "Ascendente à esquerda; o zodíaco avança no sentido anti-horário."
          : "Sem horário: 0° de Áries à esquerda, sem Ascendente nem casas; o zodíaco avança no sentido anti-horário."}{" "}
        Use as setas para percorrer os planetas e Enter para ver os detalhes.
      </desc>

      <defs>
        <radialGradient id="wheel-bg" cx="50%" cy="50%" r="50%">
          <stop
            offset="0%"
            stopColor="var(--color-accent)"
            stopOpacity="0.08"
          />
          <stop
            offset="70%"
            stopColor="var(--color-surface)"
            stopOpacity="0.2"
          />
          <stop
            offset="100%"
            stopColor="var(--color-surface)"
            stopOpacity="0"
          />
        </radialGradient>
      </defs>
      <circle
        cx={WHEEL.center}
        cy={WHEEL.center}
        r={rOuter}
        fill="url(#wheel-bg)"
        pointerEvents="none"
      />

      {/* Zodíaco: 12 setores de 30°, a partir de 0° Áries */}
      <g data-layer="zodiac" pointerEvents="none">
        {SIGNS.map((sign, i) => {
          const mid = at(i * 30 + 15, (rOuter + rZodiacInner) / 2);
          return (
            <g key={sign} data-sign={sign} data-start-longitude={i * 30}>
              <path
                d={annularSectorPath(
                  rOuter,
                  rZodiacInner,
                  i * 30,
                  i * 30 + 30,
                  orientation,
                )}
                fill={i % 2 === 0 ? "var(--color-accent)" : "var(--color-fg)"}
                fillOpacity={i % 2 === 0 ? 0.07 : 0.025}
                stroke="var(--color-line)"
                strokeWidth={1}
              />
              <Glyph
                name={sign}
                x={mid.x}
                y={mid.y}
                size={30}
                className="text-accent-strong"
              />
              <title>{SIGN_NAMES[sign]}</title>
            </g>
          );
        })}
        {/* Escala de graus na borda interna do zodíaco */}
        <g stroke="var(--color-fg-subtle)" data-layer="degree-scale">
          {Array.from({ length: 360 }, (_, deg) => {
            const len = deg % 10 === 0 ? 14 : deg % 5 === 0 ? 9 : 5;
            const a = at(deg, rZodiacInner);
            const b = at(deg, rZodiacInner + len);
            return (
              <line
                key={deg}
                x1={f(a.x)}
                y1={f(a.y)}
                x2={f(b.x)}
                y2={f(b.y)}
                strokeOpacity={deg % 10 === 0 ? 0.8 : 0.4}
                strokeWidth={deg % 10 === 0 ? 1.4 : 0.8}
              />
            );
          })}
        </g>
      </g>

      {/* Anel das casas */}
      <circle
        cx={WHEEL.center}
        cy={WHEEL.center}
        r={rHouseInner}
        fill="none"
        stroke="var(--color-line)"
      />
      <circle
        cx={WHEEL.center}
        cy={WHEEL.center}
        r={rAspect}
        fill="var(--color-bg)"
        fillOpacity={0.55}
        pointerEvents="none"
        stroke="var(--color-line)"
      />
      {chart.houses && (
        <g data-layer="houses" pointerEvents="none">
          {chart.houses.cusps.map((cusp, i) => {
            const next = chart.houses!.cusps[(i + 1) % 12].longitude;
            const span = (next - cusp.longitude + 360) % 360;
            const label = at(
              cusp.longitude + span / 2,
              (rZodiacInner + rHouseInner) / 2,
            );
            const a = at(cusp.longitude, rZodiacInner);
            const b = at(cusp.longitude, rAspect);
            const angular = i % 3 === 0;
            return (
              <g
                key={i}
                data-house={i + 1}
                data-cusp-longitude={cusp.longitude}
              >
                <line
                  x1={f(a.x)}
                  y1={f(a.y)}
                  x2={f(b.x)}
                  y2={f(b.y)}
                  stroke={
                    angular ? "var(--color-accent)" : "var(--color-fg-subtle)"
                  }
                  strokeOpacity={angular ? 0.9 : 0.55}
                  strokeWidth={angular ? 2 : 1}
                />
                <text
                  x={f(label.x)}
                  y={f(label.y)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={20}
                  className="fill-fg-muted font-mono"
                >
                  {i + 1}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* Eixos: ASC/DSC e MC/IC */}
      {chart.angles && (
        <g data-layer="angles" pointerEvents="none">
          {(
            [
              ["asc", "ASC", chart.angles.asc],
              [
                "dsc",
                "DSC",
                {
                  ...chart.angles.asc,
                  longitude: (chart.angles.asc.longitude + 180) % 360,
                  range: null,
                },
              ],
              ["mc", "MC", chart.angles.mc],
              [
                "ic",
                "IC",
                {
                  ...chart.angles.mc,
                  longitude: (chart.angles.mc.longitude + 180) % 360,
                  range: null,
                },
              ],
            ] as const
          ).map(([key, label, angle]) => {
            const inner = at(angle.longitude, rAspect);
            const outer = at(angle.longitude, rOuter + 8);
            const text = at(angle.longitude, rAxisLabel);
            const approximate = chart.precision === "approximate";
            return (
              <g key={key} data-angle={key} data-longitude={angle.longitude}>
                {angle.range && (
                  <path
                    d={arc(angle.range, rOuter, rOuter + 12)}
                    fill="var(--color-accent)"
                    fillOpacity={0.45}
                    data-range-for={key}
                  >
                    <title>{`${label}: intervalo na janela de incerteza`}</title>
                  </path>
                )}
                <line
                  x1={f(inner.x)}
                  y1={f(inner.y)}
                  x2={f(outer.x)}
                  y2={f(outer.y)}
                  stroke="var(--color-accent)"
                  strokeWidth={key === "asc" || key === "mc" ? 2.6 : 1.6}
                  strokeDasharray={approximate ? "10 8" : undefined}
                />
                <text
                  x={f(text.x)}
                  y={f(text.y)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={22}
                  className="fill-accent-strong font-mono"
                  fontWeight={600}
                >
                  {approximate && (key === "asc" || key === "mc")
                    ? `${label}≈`
                    : label}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* Aspectos (posições reais, não as deslocadas) */}
      {showAspects && (
        <g data-layer="aspects" pointerEvents="none">
          {chart.aspects
            .filter(
              (a) =>
                a.type !== "conjunction" &&
                a.a !== "asc" &&
                a.a !== "mc" &&
                a.b !== "asc" &&
                a.b !== "mc",
            )
            .map((aspect) => {
              const p = byId.get(aspect.a as Body)!;
              const q = byId.get(aspect.b as Body)!;
              const s = at(p.longitude, rAspect);
              const t = at(q.longitude, rAspect);
              const emphasis = !selected
                ? "normal"
                : aspect.a === selected || aspect.b === selected
                  ? "strong"
                  : "dim";
              return (
                <line
                  key={`${aspect.a}-${aspect.b}`}
                  x1={f(s.x)}
                  y1={f(s.y)}
                  x2={f(t.x)}
                  y2={f(t.y)}
                  data-aspect={`${aspect.a}-${aspect.b}-${aspect.type}`}
                  {...aspectStyle(aspect, emphasis)}
                />
              );
            })}
        </g>
      )}

      {/* Aviso central, por cima das linhas de aspecto para continuar legível */}
      {!chart.houses && (
        <g pointerEvents="none" data-layer="center-note">
          <rect
            x={WHEEL.center - 165}
            y={WHEEL.center - 20}
            width={330}
            height={40}
            rx={20}
            fill="var(--color-bg)"
            fillOpacity={0.9}
            stroke="var(--color-line)"
          />
          <text
            x={WHEEL.center}
            y={WHEEL.center}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={18}
            className="fill-fg-muted"
          >
            {chart.precision === "unknown"
              ? "Sem horário: sem Ascendente e casas"
              : chart.precision === "approximate"
                ? "Casas não determinadas"
                : "Casas Placidus indefinidas"}
          </text>
        </g>
      )}

      {/* Planetas */}
      <g data-layer="bodies">
        {placements.map((placement, index) => {
          const body = byId.get(placement.id)!;
          const tickOuter = at(body.longitude, rZodiacInner);
          const tickInner = at(body.longitude, rZodiacInner - 14);
          const glyphPos = at(placement.displayLongitude, rPlanet);
          const connectorEnd = at(placement.displayLongitude, rPlanet + 28);
          const label = at(placement.displayLongitude, rDegreeLabel);
          const isSelected = selected === body.body;
          const isFocused = focused === body.body;
          const name = BODY_NAMES[body.body];
          const aria = [
            `${name} em ${formatPosition(body)}`,
            body.house ? `casa ${body.house}` : null,
            body.retrograde ? "retrógrado" : null,
            body.range
              ? `posição varia ${body.range.width.toFixed(1).replace(".", ",")}° na janela de incerteza`
              : null,
          ]
            .filter(Boolean)
            .join(", ");
          return (
            <g
              key={body.body}
              ref={(el) => {
                if (el) refs.current.set(body.body, el);
                else refs.current.delete(body.body);
              }}
              role="button"
              tabIndex={index === rovingIndex ? 0 : -1}
              aria-pressed={isSelected}
              aria-label={aria}
              data-body={body.body}
              data-longitude={body.longitude}
              data-display-longitude={placement.displayLongitude}
              onClick={() => {
                setRovingIndex(index);
                onSelect(isSelected ? null : body.body);
              }}
              onKeyDown={(e) => onKeyDown(e, index)}
              onFocus={() => {
                setFocused(body.body);
                setRovingIndex(index);
              }}
              onBlur={() => setFocused(null)}
              className="cursor-pointer outline-none"
            >
              {body.range && body.range.width > 0.2 && (
                <path
                  d={arc(body.range, rZodiacInner - 20, rZodiacInner - 14)}
                  fill="var(--color-accent-strong)"
                  fillOpacity={0.6}
                  data-range-for={body.body}
                />
              )}
              {/* Marca da posição REAL na escala de graus */}
              <line
                x1={f(tickOuter.x)}
                y1={f(tickOuter.y)}
                x2={f(tickInner.x)}
                y2={f(tickInner.y)}
                stroke="var(--color-accent)"
                strokeWidth={2.4}
                data-tick-for={body.body}
              />
              {/* Conector até o símbolo, quando ele foi afastado */}
              <line
                x1={f(tickInner.x)}
                y1={f(tickInner.y)}
                x2={f(connectorEnd.x)}
                y2={f(connectorEnd.y)}
                stroke="var(--color-fg-subtle)"
                strokeOpacity={0.5}
                strokeWidth={1}
              />
              <circle
                cx={f(glyphPos.x)}
                cy={f(glyphPos.y)}
                r={25}
                fill={
                  isSelected
                    ? "var(--color-accent)"
                    : "var(--color-surface-raised)"
                }
                stroke={
                  isFocused
                    ? "var(--color-fg)"
                    : isSelected
                      ? "var(--color-accent-strong)"
                      : "var(--color-line)"
                }
                strokeWidth={isFocused ? 3 : 1.5}
              />
              <Glyph
                name={body.body}
                x={glyphPos.x}
                y={glyphPos.y}
                size={28}
                className={cn(isSelected ? "text-bg-deep" : "text-fg")}
              />
              {body.retrograde && (
                <text
                  x={f(glyphPos.x + 22)}
                  y={f(glyphPos.y + 20)}
                  fontSize={15}
                  fontWeight={700}
                  className="fill-danger font-mono"
                >
                  R
                </text>
              )}
              <text
                x={f(label.x)}
                y={f(label.y)}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={17}
                className="fill-fg-muted font-mono @max-md:hidden"
              >
                {formatDegree(body.degree, body.minute)}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
