import Link from "next/link";

import { brand } from "@/config/brand";
import { routes } from "@/config/routes";

export function Wordmark() {
  return (
    <Link
      href={routes.home}
      className="group inline-flex items-center gap-2.5 rounded-full"
      aria-label={`${brand.name} — página inicial`}
    >
      <svg
        viewBox="0 0 32 32"
        aria-hidden
        className="size-7 text-accent transition-transform duration-700 ease-soft group-hover:rotate-45"
        fill="none"
        stroke="currentColor"
      >
        <circle cx={16} cy={16} r={14.5} strokeOpacity={0.5} />
        <path
          d="M16 4 L18 14 L28 16 L18 18 L16 28 L14 18 L4 16 L14 14 Z"
          fill="currentColor"
          fillOpacity={0.9}
          stroke="none"
        />
      </svg>
      <span className="font-display text-xl tracking-tight text-fg">
        {brand.name}
      </span>
    </Link>
  );
}
