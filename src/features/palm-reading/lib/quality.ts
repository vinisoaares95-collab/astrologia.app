/**
 * Verificações locais de qualidade (Fase 03B), calculadas no navegador
 * sobre uma cópia reduzida em tons de cinza.
 *
 * São HEURÍSTICAS: medem luz, contraste e foco de forma aproximada e geram
 * avisos, nunca bloqueiam nem garantem que as linhas serão identificáveis.
 * Os limiares são conservadores (preferimos deixar passar a barrar uma foto
 * boa) e serão recalibrados com fotos reais de voluntários (Fase 03F).
 */

export type QualityMetrics = {
  /** Luminância média, 0–255. */
  meanLuma: number;
  /** Fração de pixels muito escuros (< 25). */
  darkFraction: number;
  /** Fração de pixels quase brancos (> 245): reflexo ou estouro. */
  brightFraction: number;
  /** Desvio-padrão da luminância. */
  contrast: number;
  /** Variância do Laplaciano: maior = mais detalhes finos (foco). */
  sharpness: number;
};

export type QualityHintCode =
  "too-dark" | "too-bright" | "glare" | "low-contrast" | "maybe-blurry";

export type QualityHint = { code: QualityHintCode; message: string };

export const QUALITY_THRESHOLDS = {
  darkMean: 60,
  darkFraction: 0.45,
  brightMean: 215,
  glareFraction: 0.08,
  lowContrast: 18,
  blurSharpness: 20,
} as const;

export const qualityMessages: Record<QualityHintCode, string> = {
  "too-dark":
    "A foto parece escura. Perto de uma janela, com luz natural, as linhas costumam aparecer melhor.",
  "too-bright":
    "A foto parece clara demais. Evite sol direto ou flash sobre a palma.",
  glare:
    "Há áreas muito brilhantes, possivelmente reflexo. Tente mudar um pouco o ângulo da mão ou da luz.",
  "low-contrast":
    "O contraste parece baixo. Um fundo liso e mais escuro que a pele ajuda a destacar a mão.",
  "maybe-blurry":
    "A foto pode estar tremida ou fora de foco. Apoie o celular, toque na palma para focar e confira se as linhas estão nítidas.",
};

/** Métricas a partir de luminância (0–255), linha a linha. */
export function measureQuality(
  gray: ArrayLike<number>,
  width: number,
  height: number,
): QualityMetrics {
  const n = width * height;
  if (n === 0 || gray.length < n) throw new Error("Imagem vazia.");
  let sum = 0;
  let sumSq = 0;
  let dark = 0;
  let bright = 0;
  for (let i = 0; i < n; i++) {
    const v = gray[i];
    sum += v;
    sumSq += v * v;
    if (v < 25) dark++;
    if (v > 245) bright++;
  }
  const mean = sum / n;
  const variance = Math.max(0, sumSq / n - mean * mean);

  // Laplaciano 4-vizinhos (bordas excluídas).
  let lSum = 0;
  let lSumSq = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y++)
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const l =
        gray[i - 1] +
        gray[i + 1] +
        gray[i - width] +
        gray[i + width] -
        4 * gray[i];
      lSum += l;
      lSumSq += l * l;
      count++;
    }
  const lMean = count ? lSum / count : 0;
  const sharpness = count ? Math.max(0, lSumSq / count - lMean * lMean) : 0;

  return {
    meanLuma: mean,
    darkFraction: dark / n,
    brightFraction: bright / n,
    contrast: Math.sqrt(variance),
    sharpness,
  };
}

/** Avisos não bloqueantes, do mais ao menos provável de atrapalhar. */
export function qualityHints(m: QualityMetrics): QualityHint[] {
  const t = QUALITY_THRESHOLDS;
  const codes: QualityHintCode[] = [];
  if (m.meanLuma < t.darkMean || m.darkFraction > t.darkFraction)
    codes.push("too-dark");
  else if (m.meanLuma > t.brightMean) codes.push("too-bright");
  if (m.brightFraction > t.glareFraction && !codes.includes("too-bright"))
    codes.push("glare");
  if (m.contrast < t.lowContrast) codes.push("low-contrast");
  // Foco só é avaliado com luz razoável (no escuro o ruído engana a medida).
  if (!codes.includes("too-dark") && m.sharpness < t.blurSharpness)
    codes.push("maybe-blurry");
  return codes.map((code) => ({ code, message: qualityMessages[code] }));
}
