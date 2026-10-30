import { cn } from "@/lib/cn";

export const palmLines = [
  {
    id: "heart",
    label: "Linha do coração",
    color: "var(--color-accent-strong)",
    d: "M150 142 C130 133 104 131 78 132",
  },
  {
    id: "head",
    label: "Linha da cabeça",
    color: "var(--color-celestial)",
    d: "M52 152 C80 154 112 162 140 176",
  },
  {
    id: "life",
    label: "Linha da vida",
    color: "var(--color-success)",
    d: "M54 150 C76 170 78 206 94 238",
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
      fill="var(--color-surface-raised)"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinejoin="round"
    >
      {/* Dedos */}
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
      {/* Palma */}
      <path d="M48 126 C46 172 52 212 72 236 C92 252 124 250 138 236 C154 214 156 170 152 128 C130 120 70 120 48 126 Z" />
      {showLines &&
        palmLines.map((line, i) => (
          <path
            key={line.id}
            d={line.d}
            pathLength={1}
            fill="none"
            stroke={line.color}
            strokeWidth={2.4}
            strokeLinecap="round"
            className={animated ? "draw-line" : undefined}
            style={
              animated ? { animationDelay: `${300 + i * 350}ms` } : undefined
            }
          />
        ))}
    </svg>
  );
}
