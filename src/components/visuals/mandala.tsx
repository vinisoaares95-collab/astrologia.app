import { cn } from "@/lib/cn";

const SIZE = 400;
const C = SIZE / 2;

function polar(radius: number, degrees: number) {
  const rad = ((degrees - 90) * Math.PI) / 180;
  return {
    x: +(C + radius * Math.cos(rad)).toFixed(2),
    y: +(C + radius * Math.sin(rad)).toFixed(2),
  };
}

function arc(r1: number, r2: number, a1: number, a2: number) {
  const p1 = polar(r2, a1);
  const p2 = polar(r2, a2);
  const p3 = polar(r1, a2);
  const p4 = polar(r1, a1);
  return `M${p1.x} ${p1.y} A${r2} ${r2} 0 0 1 ${p2.x} ${p2.y} L${p3.x} ${p3.y} A${r1} ${r1} 0 0 0 ${p4.x} ${p4.y} Z`;
}

function star(radius: number, points: number, step: number, offset = 0) {
  const vertices = Array.from({ length: points }, (_, i) =>
    polar(radius, offset + (i * 360) / points),
  );
  return Array.from({ length: points }, (_, i) => vertices[(i * step) % points])
    .map((p) => `${p.x},${p.y}`)
    .join(" ");
}

const degrees = Array.from({ length: 360 }, (_, i) => i);
const sectors = Array.from({ length: 12 }, (_, i) => i * 30);
const cardinals = [0, 90, 180, 270];
const rays = Array.from({ length: 48 }, (_, i) => i * 7.5);

/*
 * Símbolos tradicionais dos quatro elementos, na sequência clássica do
 * zodíaco (fogo, terra, ar, água). São ornamentos fixos — não posições.
 */
type Element = "fire" | "earth" | "air" | "water";
const elementCycle: Element[] = ["fire", "earth", "air", "water"];

function ElementGlyph({ element, deg }: { element: Element; deg: number }) {
  const p = polar(147, deg);
  const up = element === "fire" || element === "air";
  const barred = element === "air" || element === "earth";
  const h = 6.5;
  const w = 7.5;
  const tri = up
    ? `M0 ${-h} L${w} ${h} L${-w} ${h} Z`
    : `M0 ${h} L${w} ${-h} L${-w} ${-h} Z`;
  return (
    <g transform={`translate(${p.x} ${p.y}) rotate(${deg})`}>
      <path d={tri} strokeWidth={1.1} strokeLinejoin="round" />
      {barred && (
        <line x1={-w - 2} x2={w + 2} y1={0} y2={0} strokeWidth={1.1} />
      )}
    </g>
  );
}

/**
 * Mandala decorativa inspirada em mapas celestes e instrumentos astronômicos.
 * Não representa nenhum mapa astral real — é apenas ornamento.
 *
 * `detail="compact"` remove a escala fina e os rótulos, para tamanhos pequenos.
 */
export function Mandala({
  className,
  animated = true,
  detail = "full",
}: {
  className?: string;
  animated?: boolean;
  detail?: "full" | "compact";
}) {
  const full = detail === "full";

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      aria-hidden
      focusable="false"
      className={cn("text-fg-subtle", className)}
      fill="none"
      stroke="currentColor"
    >
      <defs>
        <radialGradient id="mandala-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.5" />
          <stop
            offset="40%"
            stopColor="var(--color-accent)"
            stopOpacity="0.12"
          />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mandala-copper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-accent-strong)" />
          <stop offset="100%" stopColor="var(--color-accent-deep)" />
        </linearGradient>
      </defs>

      <circle
        cx={C}
        cy={C}
        r={170}
        fill="url(#mandala-core)"
        stroke="none"
        className={animated ? "animate-pulse-glow" : undefined}
      />

      {/* Moldura externa com losangos nos pontos cardeais */}
      <circle cx={C} cy={C} r={198} strokeOpacity={0.22} />
      {cardinals.map((deg) => {
        const p = polar(198, deg);
        return (
          <rect
            key={deg}
            x={p.x - 3.5}
            y={p.y - 3.5}
            width={7}
            height={7}
            transform={`rotate(45 ${p.x} ${p.y})`}
            fill="var(--color-bg)"
            stroke="var(--color-accent)"
          />
        );
      })}

      {/* Escala de graus */}
      <g className={cn("origin-center", animated && "animate-spin-slow")}>
        <circle cx={C} cy={C} r={192} strokeOpacity={0.5} />
        <circle cx={C} cy={C} r={180} strokeOpacity={0.25} />
        {degrees.map((deg) => {
          const major = deg % 30 === 0;
          const ten = deg % 10 === 0;
          const five = deg % 5 === 0;
          if (!full && !ten) return null;
          const a = polar(192, deg);
          const b = polar(major ? 178 : ten ? 182 : five ? 185 : 188, deg);
          return (
            <line
              key={deg}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={major ? "var(--color-accent)" : "currentColor"}
              strokeOpacity={major ? 0.95 : ten ? 0.55 : five ? 0.4 : 0.22}
              strokeWidth={major ? 1.2 : 0.7}
            />
          );
        })}
        {full &&
          sectors.map((deg) => {
            const p = polar(171, deg);
            // Na metade inferior, gira 180° para o rótulo não ficar de cabeça para baixo.
            const angle = deg > 90 && deg < 270 ? deg + 180 : deg;
            return (
              <text
                key={deg}
                x={p.x}
                y={p.y}
                fill="currentColor"
                stroke="none"
                fontSize={6.5}
                letterSpacing={0.5}
                textAnchor="middle"
                dominantBaseline="central"
                className="font-mono"
                transform={`rotate(${angle} ${p.x} ${p.y})`}
                fillOpacity={0.75}
              >
                {String(deg).padStart(3, "0")}°
              </text>
            );
          })}
      </g>

      {/* Faixa dos 12 setores com os símbolos dos elementos */}
      <g className={cn("origin-center", animated && "animate-spin-reverse")}>
        <circle cx={C} cy={C} r={162} strokeOpacity={0.45} />
        {sectors.map((deg, i) => (
          <path
            key={deg}
            d={arc(132, 162, deg + 0.6, deg + 29.4)}
            fill={i % 2 === 0 ? "var(--color-accent)" : "currentColor"}
            fillOpacity={i % 2 === 0 ? 0.09 : 0.04}
            stroke="none"
          />
        ))}
        {sectors.map((deg) => {
          const a = polar(162, deg);
          const b = polar(132, deg);
          return (
            <line
              key={deg}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              strokeOpacity={0.5}
            />
          );
        })}
        <g stroke="var(--color-accent-strong)" strokeOpacity={0.9}>
          {sectors.map((deg, i) => (
            <ElementGlyph
              key={deg}
              element={elementCycle[i % 4]}
              deg={deg + 15}
            />
          ))}
        </g>
        <circle cx={C} cy={C} r={132} strokeOpacity={0.45} />
        <circle
          cx={C}
          cy={C}
          r={122}
          strokeOpacity={0.4}
          strokeDasharray="0.6 4.2"
          strokeLinecap="round"
        />
      </g>

      {/* Geometria interna: hexagrama + dodecagrama */}
      <circle cx={C} cy={C} r={108} strokeOpacity={0.35} />
      <polygon
        points={star(108, 12, 5)}
        stroke="url(#mandala-copper)"
        strokeOpacity={0.75}
        strokeWidth={0.8}
      />
      <polygon
        points={star(108, 6, 2)}
        strokeOpacity={0.35}
        strokeWidth={0.8}
      />
      <polygon
        points={star(108, 6, 2, 30)}
        strokeOpacity={0.35}
        strokeWidth={0.8}
      />
      {sectors.map((deg) => {
        const p = polar(108, deg);
        return (
          <circle
            key={deg}
            cx={p.x}
            cy={p.y}
            r={deg % 90 === 0 ? 2.6 : 1.6}
            fill={deg % 90 === 0 ? "var(--color-accent)" : "currentColor"}
            stroke="none"
          />
        );
      })}

      {/* Retícula */}
      {cardinals.map((deg) => {
        const a = polar(58, deg);
        const b = polar(108, deg);
        return (
          <line
            key={deg}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            strokeOpacity={0.3}
            strokeDasharray="2 3"
          />
        );
      })}

      {/* Núcleo */}
      <circle cx={C} cy={C} r={58} strokeOpacity={0.4} />
      {full &&
        rays.map((deg) => {
          const a = polar(46, deg);
          const b = polar(deg % 30 === 0 ? 56 : 52, deg);
          return (
            <line
              key={deg}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              strokeOpacity={deg % 30 === 0 ? 0.6 : 0.25}
            />
          );
        })}
      <circle
        cx={C}
        cy={C}
        r={44}
        stroke="var(--color-accent)"
        strokeOpacity={0.5}
      />
    </svg>
  );
}
