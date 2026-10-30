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

const sectors = Array.from({ length: 12 }, (_, i) => i * 30);
const ticks = Array.from({ length: 72 }, (_, i) => i * 5);

// Estrela de 12 pontas no centro
const star = Array.from({ length: 24 }, (_, i) => {
  const p = polar(i % 2 === 0 ? 62 : 30, i * 15);
  return `${p.x},${p.y}`;
}).join(" ");

/**
 * Mandala decorativa inspirada em mapas celestes.
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
      className={cn("text-accent", className)}
      fill="none"
      stroke="currentColor"
    >
      <g className={cn("origin-center", animated && "animate-spin-slow")}>
        <circle cx={C} cy={C} r={196} strokeOpacity={0.35} />
        <circle cx={C} cy={C} r={182} strokeOpacity={0.6} />
        {ticks.map((deg) => {
          const long = deg % 30 === 0;
          const a = polar(182, deg);
          const b = polar(long ? 168 : 176, deg);
          return (
            <line
              key={deg}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              strokeOpacity={long ? 0.8 : 0.35}
            />
          );
        })}
        <circle cx={C} cy={C} r={150} strokeOpacity={0.5} />
        {sectors.map((deg) => {
          const a = polar(150, deg);
          const b = polar(92, deg);
          const dot = polar(166, deg + 15);
          return (
            <g key={deg}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeOpacity={0.4} />
              <circle
                cx={dot.x}
                cy={dot.y}
                r={2.2}
                fill="currentColor"
                stroke="none"
                fillOpacity={0.7}
              />
            </g>
          );
        })}
        <circle cx={C} cy={C} r={92} strokeOpacity={0.55} />
      </g>
      <g className="text-celestial" stroke="currentColor">
        <circle
          cx={C}
          cy={C}
          r={74}
          strokeOpacity={0.35}
          strokeDasharray="2 6"
        />
        <polygon points={star} strokeOpacity={0.6} />
        <circle cx={C} cy={C} r={4} fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}
