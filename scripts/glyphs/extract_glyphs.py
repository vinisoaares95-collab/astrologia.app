"""Extrai os contornos dos glifos astrológicos das fontes Noto (SIL OFL 1.1).

Gera src/features/natal-chart/glyph-paths.ts com um <path> SVG por símbolo,
centrado na origem e com a maior dimensão igual a 100 unidades. Desenhar os
contornos evita depender de fontes no navegador e a troca por emoji no iOS.

Uso (ambiente isolado):
    python -m venv refenv && refenv/bin/pip install fonttools brotli
    refenv/bin/python scripts/glyphs/extract_glyphs.py > src/features/natal-chart/glyph-paths.ts
"""

import hashlib
import io
import urllib.request

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

FONTS = {
    "symbols": (
        "https://fonts.gstatic.com/s/notosanssymbols/v47/rP2up3q65FkAtHfwd-eIS2brbDN6gxP34F9jRRCe4W3gfQ8QA_9Edkw.woff2",
        "2386dfba50e3a0df9efebd63f5774e4a455bc4c86f47b03eed82fea92ad86e3b",
    ),
    "symbols2": (
        "https://fonts.gstatic.com/s/notosanssymbols2/v25/I_uyMoGduATTei9eI8daxVHDyfisHr71-vrgfE71.woff2",
        "9c07d511848c274b5430c75bf98d1f2582680ef5f967947bfbdd06b75ca177c2",
    ),
}

GLYPHS = {
    # planetas
    "sun": ("symbols2", 0x2609),
    "moon": ("symbols", 0x263D),
    "mercury": ("symbols", 0x263F),
    "venus": ("symbols", 0x2640),
    "mars": ("symbols", 0x2642),
    "jupiter": ("symbols", 0x2643),
    "saturn": ("symbols", 0x2644),
    "uranus": ("symbols", 0x2645),
    "neptune": ("symbols", 0x2646),
    "pluto": ("symbols", 0x2647),
    # signos
    "aries": ("symbols", 0x2648),
    "taurus": ("symbols", 0x2649),
    "gemini": ("symbols", 0x264A),
    "cancer": ("symbols", 0x264B),
    "leo": ("symbols", 0x264C),
    "virgo": ("symbols", 0x264D),
    "libra": ("symbols", 0x264E),
    "scorpio": ("symbols", 0x264F),
    "sagittarius": ("symbols", 0x2650),
    "capricorn": ("symbols", 0x2651),
    "aquarius": ("symbols", 0x2652),
    "pisces": ("symbols", 0x2653),
}


def load(url, sha):
    data = urllib.request.urlopen(url).read()
    digest = hashlib.sha256(data).hexdigest()
    if digest != sha:
        raise SystemExit(f"SHA-256 divergente para {url}: {digest}")
    return TTFont(io.BytesIO(data))


def main():
    fonts = {k: load(url, sha) for k, (url, sha) in FONTS.items()}
    out = []
    for name, (font_key, code) in GLYPHS.items():
        font = fonts[font_key]
        glyph_set = font.getGlyphSet()
        glyph_name = font.getBestCmap()[code]
        bounds = BoundsPen(glyph_set)
        glyph_set[glyph_name].draw(bounds)
        x0, y0, x1, y1 = bounds.bounds
        scale = 100 / max(x1 - x0, y1 - y0)
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        pen = SVGPathPen(glyph_set, ntos=lambda v: f"{v:.1f}".rstrip("0").rstrip("."))
        # Centraliza, escala e inverte o eixo y (fonte: y para cima; SVG: para baixo).
        transform = TransformPen(pen, (scale, 0, 0, -scale, -cx * scale, cy * scale))
        glyph_set[glyph_name].draw(transform)
        out.append(f'  {name}: "{pen.getCommands()}",')
    print("// Gerado por scripts/glyphs/extract_glyphs.py — não editar à mão.")
    print("// Contornos das fontes Noto Sans Symbols e Noto Sans Symbols 2")
    print("// (SIL Open Font License 1.1; veja GLYPHS-OFL.txt).")
    print("// Cada caminho está centrado em (0, 0), com a maior dimensão = 100.")
    print("export const GLYPH_PATHS = {")
    print("\n".join(out))
    print("} as const;")
    print("")
    print("export type GlyphName = keyof typeof GLYPH_PATHS;")


if __name__ == "__main__":
    main()
