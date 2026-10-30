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

const ticks = Array.from({ length: 120 }, (_, i) => i * 3);
const sectors = Array.from({ length: 12 }, (_, i) => i * 30);

// Dodecagrama: liga cada ponto ao quinto seguinte
const starPoints = sectors.map((deg) => polar(96, deg));
const star = starPoints
  .map((_, i) => starPoints[(i * 5) % 12])
  .map((p) => `${p.x},${p.y}`)
  .join(" ");

// Órbitas decorativas (não representam posições reais)
const orbs = [
  { r: 128, deg: 38, size: 5 },
  { r: 128, deg: 212, size: 3.5 },
  { r: 112, deg: 300, size: 4 },
];

/**
 * Mandala decorativa inspirada em mapas celestes e instrumentos astronômicos.
 * Não representa nenhum mapa astral real — é apenas ornamento.
 */
export function Mandala({
  className,
  animated = true,
}: {
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      aria-hidden
      className={cn("text-fg-subtle", className)}
      fill="none"
      stroke="currentColor"
    >
      <defs>
        <radialGradient id="mandala-core" cx="50%" cy="50%" r="50%">
          <stop
            offset="0%"
            stopColor="var(--color-accent)"
            stopOpacity="0.55"
          />
          <stop
            offset="45%"
            stopColor="var(--color-accent)"
            stopOpacity="0.12"
          />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mandala-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-accent-strong)" />
          <stop offset="100%" stopColor="var(--color-accent-deep)" />
        </linearGradient>
      </defs>

      <circle
        cx={C}
        cy={C}
        r={150}
        fill="url(#mandala-core)"
        stroke="none"
        className={animated ? "animate-pulse-glow" : undefined}
      />

      {/* Anel externo: escala de graus */}
      <g className={cn("origin-center", animated && "animate-spin-slow")}>
        <circle cx={C} cy={C} r={196} strokeOpacity={0.25} />
        <circle cx={C} cy={C} r={176} strokeOpacity={0.5} />
        {ticks.map((deg) => {
          const major = deg % 30 === 0;
          const mid = deg % 15 === 0;
          const a = polar(176, deg);
          const b = polar(major ? 162 : mid ? 168 : 171, deg);
          return (
            <line
              key={deg}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={major ? "var(--color-accent)" : "currentColor"}
              strokeOpacity={major ? 0.9 : 0.4}
            />
          );
        })}
        {sectors.map((deg) => {
          const p = polar(186, deg);
          return (
            <text
              key={deg}
              x={p.x}
              y={p.y}
              fill="currentColor"
              stroke="none"
              fontSize={7}
              textAnchor="middle"
              dominantBaseline="central"
              className="font-mono"
              transform={`rotate(${deg} ${p.x} ${p.y})`}
              fillOpacity={0.7}
            >
              {deg}°
            </text>
          );
        })}
      </g>

      {/* Anel de setores */}
      <g className={cn("origin-center", animated && "animate-spin-reverse")}>
        {sectors.map((deg, i) => (
          <path
            key={deg}
            d={arc(140, 156, deg + 1, deg + 29)}
            fill={i % 3 === 0 ? "var(--color-accent)" : "currentColor"}
            fillOpacity={i % 3 === 0 ? 0.22 : 0.06}
            stroke="none"
          />
        ))}
        <circle
          cx={C}
          cy={C}
          r={128}
          strokeOpacity={0.35}
          strokeDasharray="1 5"
        />
        <circle cx={C} cy={C} r={112} strokeOpacity={0.2} />
        {orbs.map((orb) => {
          const p = polar(orb.r, orb.deg);
          return (
            <g key={orb.deg}>
              <circle
                cx={p.x}
                cy={p.y}
                r={orb.size * 2.6}
                fill="var(--color-accent)"
                fillOpacity={0.15}
                stroke="none"
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={orb.size}
                fill="var(--color-accent-strong)"
                stroke="none"
              />
            </g>
          );
        })}
      </g>

      {/* Núcleo */}
      <circle cx={C} cy={C} r={96} strokeOpacity={0.45} />
      <polygon
        points={star}
        stroke="url(#mandala-stroke)"
        strokeOpacity={0.8}
        strokeWidth={0.9}
      />
      {sectors.map((deg) => {
        const a = polar(96, deg);
        return (
          <circle
            key={deg}
            cx={a.x}
            cy={a.y}
            r={1.8}
            fill="var(--color-accent)"
            stroke="none"
          />
        );
      })}
      <circle cx={C} cy={C} r={54} strokeOpacity={0.3} />
    </svg>
  );
}
