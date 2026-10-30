import { cn } from "@/lib/cn";

export const palmLines = [
  {
    id: "heart",
    label: "Linha do coração",
    short: "Coração",
    color: "var(--color-accent-strong)",
    d: "M150 142 C130 133 104 131 78 132",
    end: [78, 132],
  },
  {
    id: "head",
    label: "Linha da cabeça",
    short: "Cabeça",
    color: "var(--color-accent)",
    d: "M52 152 C80 154 112 162 140 176",
    end: [140, 176],
  },
  {
    id: "life",
    label: "Linha da vida",
    short: "Vida",
    color: "var(--color-celestial)",
    d: "M54 150 C76 170 78 206 94 238",
    end: [94, 238],
  },
] as const;

/**
 * Ilustração esquemática de uma palma aberta com as três linhas principais.
 * Serve para orientar a pessoa — não é derivada de nenhuma fotografia.
 */
export function PalmIllustration({
  className,
  showLines = true,
  animated = true,
}: {
  className?: string;
  showLines?: boolean;
  animated?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 200 260"
      aria-hidden
      className={cn("text-fg-subtle", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinejoin="round"
    >
      <defs>
        <linearGradient id="palm-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#26262b" />
          <stop offset="100%" stopColor="#151518" />
        </linearGradient>
      </defs>
      <g fill="var(--color-surface-raised)" strokeOpacity={0.75}>
        <rect x={52} y={44} width={22} height={96} rx={11} />
        <rect x={79} y={24} width={23} height={114} rx={11.5} />
        <rect x={107} y={34} width={22} height={104} rx={11} />
        <rect x={133} y={62} width={19} height={80} rx={9.5} />
        <rect
          x={20}
          y={128}
          width={22}
          height={74}
          rx={11}
          transform="rotate(-38 31 165)"
        />
        <path
          d="M48 126 C46 172 52 212 72 236 C92 252 124 250 138 236 C154 214 156 170 152 128 C130 120 70 120 48 126 Z"
          fill="url(#palm-fill)"
        />
      </g>
      {showLines &&
        palmLines.map((line, i) => (
          <g key={line.id}>
            <path
              d={line.d}
              pathLength={1}
              stroke={line.color}
              strokeWidth={6}
              strokeOpacity={0.18}
              strokeLinecap="round"
              className={animated ? "draw-line" : undefined}
              style={
                animated ? { animationDelay: `${300 + i * 350}ms` } : undefined
              }
            />
            <path
              d={line.d}
              pathLength={1}
              stroke={line.color}
              strokeWidth={2}
              strokeLinecap="round"
              className={animated ? "draw-line" : undefined}
              style={
                animated ? { animationDelay: `${300 + i * 350}ms` } : undefined
              }
            />
            <circle
              cx={line.end[0]}
              cy={line.end[1]}
              r={2.6}
              fill={line.color}
              stroke="var(--color-bg)"
              strokeWidth={1.2}
            />
          </g>
        ))}
    </svg>
  );
}
