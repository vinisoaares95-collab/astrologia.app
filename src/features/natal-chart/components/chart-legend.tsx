import { BODIES, SIGNS } from "@/features/astrology/domain/types";

import { BODY_NAMES, SIGN_NAMES } from "../labels";
import { GlyphIcon } from "./glyph";

export function ChartLegend() {
  return (
    <details className="group rounded-2xl bg-surface/60 px-4 py-3 edge-light">
      <summary className="cursor-pointer list-none text-sm font-medium text-fg-muted">
        Legenda dos símbolos
      </summary>
      <div className="mt-3 grid gap-4 text-xs text-fg-muted sm:grid-cols-3">
        <ul className="grid grid-cols-2 gap-1.5">
          {BODIES.map((b) => (
            <li key={b} className="flex items-center gap-2">
              <GlyphIcon name={b} className="size-4 text-fg" /> {BODY_NAMES[b]}
            </li>
          ))}
        </ul>
        <ul className="grid grid-cols-2 gap-1.5">
          {SIGNS.map((s) => (
            <li key={s} className="flex items-center gap-2">
              <GlyphIcon name={s} className="size-4 text-accent-strong" />{" "}
              {SIGN_NAMES[s]}
            </li>
          ))}
        </ul>
        <ul className="space-y-1.5">
          <li className="flex items-center gap-2">
            <span className="h-0.5 w-6 bg-accent" /> Quadratura, oposição
          </li>
          <li className="flex items-center gap-2">
            <span className="h-0.5 w-6 bg-celestial" /> Trígono, sextil
          </li>
          <li className="flex items-center gap-2">
            <span className="h-0 w-6 border-t-2 border-dashed border-fg-subtle" />{" "}
            Aspecto incerto
          </li>
          <li>Conjunções: listadas na tabela</li>
          <li className="flex items-center gap-2">
            <span className="h-3 w-0.5 bg-accent" /> Posição exata na escala
          </li>
          <li>
            <span className="font-mono text-danger">R</span> Retrógrado
          </li>
        </ul>
      </div>
    </details>
  );
}
