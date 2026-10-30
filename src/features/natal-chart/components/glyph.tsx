import { GLYPH_PATHS, type GlyphName } from "../glyph-paths";

/** Símbolo vetorial (contorno extraído da fonte Noto), centrado em (x, y). */
export function Glyph({
  name,
  x = 0,
  y = 0,
  size,
  className,
}: {
  name: GlyphName;
  x?: number;
  y?: number;
  size: number;
  className?: string;
}) {
  return (
    <path
      d={GLYPH_PATHS[name]}
      transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${(size / 100).toFixed(4)})`}
      className={className}
      fill="currentColor"
      aria-hidden
    />
  );
}

/** Glifo como ícone HTML (legendas e tabelas). */
export function GlyphIcon({
  name,
  className,
}: {
  name: GlyphName;
  className?: string;
}) {
  return (
    <svg
      viewBox="-55 -55 110 110"
      className={className ?? "size-4"}
      aria-hidden
      focusable="false"
    >
      <Glyph name={name} size={100} />
    </svg>
  );
}
