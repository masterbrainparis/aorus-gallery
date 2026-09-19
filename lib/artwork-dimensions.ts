export const ARTWORK_DIMENSION_TYPES = ['UNCONFIRMED', 'RECTANGULAR', 'CIRCULAR'] as const;
export type ArtworkDimensionType = (typeof ARTWORK_DIMENSION_TYPES)[number];

export interface ArtworkDimensions {
  dimensionType?: ArtworkDimensionType | null;
  dimensions?: string | null;
  widthCm?: number | string | null;
  heightCm?: number | string | null;
  diameterCm?: number | string | null;
  depthCm?: number | string | null;
}

function finiteNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function formatNumber(value: number | string, locale: string): string {
  const number = finiteNumber(value);
  if (number === null) return '';
  return new Intl.NumberFormat(locale === 'zh' ? 'zh-Hant-TW' : locale, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    useGrouping: false,
  }).format(number);
}

function legacyFallback(dimensions: ArtworkDimensions, locale: string): string | null {
  const legacy = dimensions.dimensions?.trim();
  if (legacy) return legacy;
  const width = finiteNumber(dimensions.widthCm);
  const height = finiteNumber(dimensions.heightCm);
  if (width !== null && height !== null) {
    return `${formatNumber(width, locale)} × ${formatNumber(height, locale)} cm`;
  }
  return null;
}

export function formatArtworkDimensions(
  dimensions: ArtworkDimensions,
  locale: string = 'fr',
): string | null {
  const type = dimensions.dimensionType ?? 'UNCONFIRMED';
  const depth = finiteNumber(dimensions.depthCm);

  if (type === 'RECTANGULAR') {
    const width = finiteNumber(dimensions.widthCm);
    const height = finiteNumber(dimensions.heightCm);
    if (width === null || height === null) return legacyFallback(dimensions, locale);
    const base = `${formatNumber(width, locale)} × ${formatNumber(height, locale)} cm`;
    if (depth === null) return base;
    const depthLabel = locale === 'fr' ? 'profondeur' : locale === 'zh' ? '深度' : 'depth';
    return `${base} · ${depthLabel} ${formatNumber(depth, locale)} cm`;
  }

  if (type === 'CIRCULAR') {
    const diameter = finiteNumber(dimensions.diameterCm);
    if (diameter === null) return legacyFallback(dimensions, locale);
    const base = `Ø ${formatNumber(diameter, locale)} cm`;
    if (depth === null) return base;
    const depthLabel = locale === 'fr' ? 'profondeur' : locale === 'zh' ? '深度' : 'depth';
    return `${base} · ${depthLabel} ${formatNumber(depth, locale)} cm`;
  }

  return legacyFallback(dimensions, locale);
}
