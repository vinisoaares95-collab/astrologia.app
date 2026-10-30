import Link from "next/link";

import { brand } from "@/config/brand";
import { routes } from "@/config/routes";

/** Marca provisória: símbolo + nome vindos de `config/brand.ts`. */
export function Wordmark() {
  return (
    <Link
      href={routes.home}
      className="group inline-flex items-center gap-2 rounded-full"
      aria-label={`${brand.name} — página inicial`}
    >
      <span className="relative flex size-8 items-center justify-center rounded-full bg-[radial-gradient(circle,#ff7a3340,transparent_70%)]">
        <svg
          viewBox="0 0 32 32"
          aria-hidden
          className="size-7 transition-transform duration-700 ease-soft group-hover:rotate-90"
          fill="none"
        >
          <circle cx={16} cy={16} r={13} stroke="var(--color-line)" />
          <circle
            cx={16}
            cy={16}
            r={13}
            stroke="var(--color-accent)"
            strokeDasharray="20 62"
            strokeLinecap="round"
          />
          <path
            d="M16 6 L17.6 14.4 L26 16 L17.6 17.6 L16 26 L14.4 17.6 L6 16 L14.4 14.4 Z"
            fill="var(--color-accent)"
          />
        </svg>
      </span>
      <span className="text-[1.05rem] font-semibold tracking-tight text-fg">
        {brand.name}
      </span>
    </Link>
  );
}
