'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AdaptiveImage } from '@/components/ui/adaptive-image';

/**
 * Multi-format artwork display primitives.
 *
 * Design decisions (data/development/briefs/orus-gallery/multi-format-strategy.md § 6):
 *
 * - `<ArtworkRail>` — horizontal rail, constant row height, width adapts to
 *   each image's native aspect ratio. Gagosian pattern. Extreme-ratio items
 *   are capped (panorama ≤ 1.5×row-height) or widened (tall ≥ 0.5×row-height).
 *   Items with ratio > 3:1 or < 1:3 are rendered as `<ArtworkHighlight>`
 *   outside the rail (responsibility of the caller).
 *
 * - `<ArtworkGrid>` — fixed-column grid, each cell uses its image's native
 *   aspect ratio via CSS aspect-ratio. Zwirner/Perrotin pattern. Ratios in
 *   the "stretched" zone span 2 columns; ratios in the "extreme" zone render
 *   as full-width rows (via `<ArtworkHighlight>` above the grid, not here).
 *
 * - `<ArtworkHero>` — artwork detail main image. Container matches the image's
 *   aspect ratio exactly. Max-height 90vh, max-width 1400px, centered, zero crop.
 *
 * When dimensions are unknown (legacy rows pre-backfill), the components fall
 * back to `aspect-[4/5]` + `object-contain` — never crop on native fit, even
 * when ratios are missing (pre-launch feedback 2026-05).
 */

// --- Shared types ---

export interface ArtworkMedia {
  id: string;
  title: string;
  imageUrl: string;
  imageWidth: number | null;
  imageHeight: number | null;
  /** Optional caption shown below the image (artist name, year, etc.). */
  caption?: string;
  /** Optional link — wraps the cell if provided. */
  href?: string;
  /** Real-world dimensions in cm — used by ArtworkSalon for proportional scaling. */
  widthCm?: number | null;
  heightCm?: number | null;
  dimensionsLabel?: string | null;
}

/** Classify ratio for surface-specific handling. */
export type RatioZone = 'normal' | 'wide' | 'tall' | 'extreme-wide' | 'extreme-tall' | 'unknown';

export function classifyRatio(width: number | null, height: number | null): RatioZone {
  if (!width || !height) return 'unknown';
  const ratio = width / height;
  if (ratio > 3) return 'extreme-wide';
  if (ratio < 1 / 3) return 'extreme-tall';
  if (ratio > 2) return 'wide';
  if (ratio < 0.5) return 'tall';
  return 'normal';
}

// --- ArtworkRail ---

interface ArtworkRailProps {
  items: ArtworkMedia[];
  /** Constant row height via Tailwind class (e.g. "h-[420px] md:h-[420px]"). */
  rowHeightClass?: string;
  /** Priority flag passed to the first N images for LCP. */
  priorityCount?: number;
  sizes?: string;
  /** Custom link renderer (e.g. next-intl's Link). Defaults to `<a>`. */
  linkRenderer?: (href: string, children: ReactNode, className?: string) => ReactNode;
  emptyState?: ReactNode;
  /** Padding applied at rail container edges. */
  paddingClass?: string;
  dataTestId?: string;
}

export function ArtworkRail({
  items,
  rowHeightClass = 'h-[280px] md:h-[360px] lg:h-[420px]',
  priorityCount = 2,
  sizes = '(max-width: 768px) 85vw, (max-width: 1024px) 55vw, 40vw',
  linkRenderer,
  emptyState,
  paddingClass = 'px-4 md:px-8 lg:px-12',
  dataTestId = 'artwork-rail',
}: ArtworkRailProps) {
  if (items.length === 0) return <>{emptyState ?? null}</>;

  return (
    <div className="relative">
      <div className="absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-r from-blanc to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-l from-blanc to-transparent z-10 pointer-events-none" />
      <div
        className={cn(
          'flex items-start gap-6 md:gap-10 overflow-x-auto overflow-y-hidden overscroll-y-none scrollbar-hide snap-x snap-mandatory scroll-smooth pb-8 cursor-grab active:cursor-grabbing',
          paddingClass,
        )}
        data-testid={dataTestId}
      >
        {items.map((item, index) => {
          const content = (
            <ArtworkRailCell
              item={item}
              rowHeightClass={rowHeightClass}
              priority={index < priorityCount}
              sizes={sizes}
            />
          );
          if (item.href && linkRenderer) {
            return (
              <div key={item.id} className="snap-start shrink-0">
                {linkRenderer(item.href, content, 'block h-full')}
              </div>
            );
          }
          if (item.href) {
            return (
              <a key={item.id} href={item.href} className="snap-start shrink-0 block">
                {content}
              </a>
            );
          }
          return (
            <div key={item.id} className="snap-start shrink-0">
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ArtworkRailCellProps {
  item: ArtworkMedia;
  rowHeightClass: string;
  priority: boolean;
  sizes: string;
}

function ArtworkRailCell({ item, rowHeightClass, priority, sizes }: ArtworkRailCellProps) {
  const zone = classifyRatio(item.imageWidth, item.imageHeight);
  const aspectRatio = item.imageWidth && item.imageHeight ? `${item.imageWidth} / ${item.imageHeight}` : '4 / 5';

  // Cap widths for stretched/extreme ratios (designer § 6.2)
  const imageBoxStyle = {
    aspectRatio,
    maxWidth:
      zone === 'extreme-wide'
        ? 'calc(var(--rail-h, 280px) * 3)'
        : zone === 'wide'
          ? 'calc(var(--rail-h, 280px) * 1.8)'
          : undefined,
    minWidth:
      zone === 'extreme-tall'
        ? 'calc(var(--rail-h, 280px) * 0.45)'
        : zone === 'tall'
          ? 'calc(var(--rail-h, 280px) * 0.55)'
          : undefined,
  } as React.CSSProperties;

  return (
    <motion.figure
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
      className="group flex flex-col"
      data-ratio-zone={zone}
    >
      <div
        className={cn('relative bg-blanc-muted overflow-hidden', rowHeightClass)}
        style={imageBoxStyle}
      >
        <AdaptiveImage
          src={item.imageUrl}
          alt={item.title}
          fit="native"
          width={item.imageWidth}
          height={item.imageHeight}
          priority={priority}
          sizes={sizes}
          className="transition-opacity duration-500 group-hover:opacity-90"
        />
      </div>
      <figcaption className="mt-5 px-0.5 max-w-full">
        {item.caption && (
          <p className="text-[0.65rem] md:text-xs tracking-[0.2em] uppercase text-noir/55">
            {item.caption}
          </p>
        )}
        <p className="font-display italic text-sm md:text-[0.95rem] text-noir/85 tracking-wide mt-1.5 truncate">
          {item.title}
        </p>
      </figcaption>
    </motion.figure>
  );
}

// --- ArtworkGrid ---

interface ArtworkGridProps {
  items: ArtworkMedia[];
  /** Column counts by breakpoint. Defaults: 1/2/3. */
  columns?: { base?: number; md?: number; lg?: number };
  gap?: string;
  linkRenderer?: (href: string, children: ReactNode, className?: string) => ReactNode;
  emptyState?: ReactNode;
  dataTestId?: string;
}

export function ArtworkGrid({
  items,
  columns = { base: 1, md: 2, lg: 3 },
  gap = 'gap-6 md:gap-10',
  linkRenderer,
  emptyState,
  dataTestId = 'artwork-grid',
}: ArtworkGridProps) {
  if (items.length === 0) return <>{emptyState ?? null}</>;

  const gridColsClass = cn(
    columns.base === 1 && 'grid-cols-1',
    columns.base === 2 && 'grid-cols-2',
    columns.md === 2 && 'md:grid-cols-2',
    columns.md === 3 && 'md:grid-cols-3',
    columns.lg === 2 && 'lg:grid-cols-2',
    columns.lg === 3 && 'lg:grid-cols-3',
    columns.lg === 4 && 'lg:grid-cols-4',
  );

  return (
    <div className={cn('grid items-start', gridColsClass, gap)} data-testid={dataTestId}>
      {items.map((item, index) => {
        const content = <ArtworkGridCell item={item} priority={index < 3} />;
        if (item.href && linkRenderer) {
          return (
            <div key={item.id}>
              {linkRenderer(item.href, content, 'block')}
            </div>
          );
        }
        if (item.href) {
          return (
            <a key={item.id} href={item.href} className="block">
              {content}
            </a>
          );
        }
        return <div key={item.id}>{content}</div>;
      })}
    </div>
  );
}

interface ArtworkGridCellProps {
  item: ArtworkMedia;
  priority: boolean;
}

function ArtworkGridCell({ item, priority }: ArtworkGridCellProps) {
  const zone = classifyRatio(item.imageWidth, item.imageHeight);
  const spanClass = zone === 'wide' || zone === 'extreme-wide' ? 'md:col-span-2' : '';

  return (
    <motion.figure
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
      className={cn('group', spanClass)}
      data-ratio-zone={zone}
    >
      <div className="relative overflow-hidden bg-blanc-muted">
        <AdaptiveImage
          src={item.imageUrl}
          alt={item.title}
          fit="native"
          width={item.imageWidth}
          height={item.imageHeight}
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="transition-transform duration-700 group-hover:scale-[1.02]"
        />
      </div>
      <figcaption className="mt-4">
        <p className="font-display text-base text-noir tracking-wide">{item.title}</p>
        {item.caption && <p className="text-noir/50 text-sm tracking-wide mt-1">{item.caption}</p>}
      </figcaption>
    </motion.figure>
  );
}

// --- ArtworkHero ---

interface ArtworkHeroProps {
  src: string;
  alt: string;
  imageWidth: number | null;
  imageHeight: number | null;
  priority?: boolean;
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  ariaLabel?: string;
  dataTestId?: string;
}

export function ArtworkHero({
  src,
  alt,
  imageWidth,
  imageHeight,
  priority = true,
  onClick,
  onKeyDown,
  ariaLabel,
  dataTestId = 'artwork-main-image',
}: ArtworkHeroProps) {
  const hasDims = !!imageWidth && !!imageHeight;
  const zone = classifyRatio(imageWidth, imageHeight);
  // Safari does not derive width from aspect-ratio when max-height clamps height
  // (WebKit aspect-ratio + max-height + overflow:hidden quirk → image gets cut).
  // We translate the height cap into a width cap via the aspect ratio so the
  // single remaining constraint is width-based; aspect-ratio then derives the
  // correct height on every engine.
  const ratioValue = hasDims ? imageWidth! / imageHeight! : 4 / 5;
  const heightCap = 'min(75vh, 800px)';
  const widthFromHeight = `calc(${heightCap} * ${ratioValue})`;
  const widthFromMax = zone === 'extreme-wide' ? '100%' : 'min(1100px, 100%)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className={cn(
        'relative mx-auto overflow-hidden',
        onClick && 'cursor-zoom-in',
      )}
      style={{
        aspectRatio: hasDims ? `${imageWidth} / ${imageHeight}` : '4 / 5',
        width: `min(${widthFromMax}, ${widthFromHeight})`,
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onKeyDown}
      aria-label={ariaLabel}
      data-testid={dataTestId}
      data-ratio-zone={zone}
    >
      <AdaptiveImage
        src={src}
        alt={alt}
        fit="native"
        width={imageWidth}
        height={imageHeight}
        priority={priority}
        sizes="(max-width: 768px) 92vw, (max-width: 1100px) 80vw, 1100px"
      />
    </motion.div>
  );
}

// --- ArtworkHighlight ---

/**
 * Full-width editorial moment for extreme ratios (panoramas > 3:1, very-tall < 1:3).
 * Used by callers who want to promote an extreme-ratio item out of the rail/grid.
 */
interface ArtworkHighlightProps {
  src: string;
  alt: string;
  imageWidth: number | null;
  imageHeight: number | null;
  caption?: string;
  priority?: boolean;
}

export function ArtworkHighlight({
  src,
  alt,
  imageWidth,
  imageHeight,
  caption,
  priority = false,
}: ArtworkHighlightProps) {
  const zone = classifyRatio(imageWidth, imageHeight);
  return (
    <motion.figure
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 1 }}
      className="w-full my-12 md:my-20"
      data-testid="artwork-highlight"
      data-ratio-zone={zone}
    >
      <div className="relative">
        <AdaptiveImage
          src={src}
          alt={alt}
          fit="native"
          width={imageWidth}
          height={imageHeight}
          priority={priority}
          sizes="100vw"
        />
      </div>
      {caption && (
        <figcaption className="mt-4 text-sm text-noir/50 tracking-wide italic text-center">
          {caption}
        </figcaption>
      )}
    </motion.figure>
  );
}

// --- ArtworkSalon ---

/**
 * Gallery-grade display for an artist's body of work.
 *
 * Uniform column grid (Zwirner/Pace pattern), each cell preserves the image's
 * native aspect ratio. Generous gutters, no crop, no proportional scaling.
 *
 * - Mobile (<md): 2 columns
 * - Tablet (md): 2 columns, wider gutters
 * - Desktop (lg+): 3 columns, max-width container for breathing room
 *
 * Real-world cm dimensions (widthCm/heightCm), if present, are surfaced in the
 * caption — they no longer drive layout sizing.
 */
interface ArtworkSalonProps {
  items: ArtworkMedia[];
  linkRenderer?: (href: string, children: ReactNode, className?: string) => ReactNode;
  emptyState?: ReactNode;
  /** Deprecated — kept for backwards-compat with existing call sites. No-op. */
  referenceHeight?: number;
  /** Deprecated — kept for backwards-compat with existing call sites. No-op. */
  scaleFloor?: number;
  dataTestId?: string;
}

export function ArtworkSalon({
  items,
  linkRenderer,
  emptyState,
  dataTestId = 'artwork-salon',
}: ArtworkSalonProps) {
  if (items.length === 0) return <>{emptyState ?? null}</>;

  const renderCell = (item: ArtworkMedia, index: number) => {
    const cell = <ArtworkSalonCell item={item} priority={index < 3} />;
    if (item.href && linkRenderer) {
      return <div key={item.id}>{linkRenderer(item.href, cell, 'block')}</div>;
    }
    if (item.href) {
      return (
        <a key={item.id} href={item.href} className="block">
          {cell}
        </a>
      );
    }
    return <div key={item.id}>{cell}</div>;
  };

  return (
    <div className="max-w-7xl mx-auto" data-testid={dataTestId}>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10 md:gap-12 lg:gap-16 items-start">
        {items.map((item, index) => renderCell(item, index))}
      </div>
    </div>
  );
}

interface ArtworkSalonCellProps {
  item: ArtworkMedia;
  priority: boolean;
}

function ArtworkSalonCell({ item, priority }: ArtworkSalonCellProps) {
  const aspectRatio =
    item.imageWidth && item.imageHeight ? `${item.imageWidth} / ${item.imageHeight}` : '4 / 5';
  const dimsCaption = item.dimensionsLabel
    ?? (item.widthCm && item.heightCm ? `${item.widthCm} × ${item.heightCm} cm` : null);

  return (
    <motion.figure
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
      className="group flex flex-col"
    >
      <div className="relative overflow-hidden" style={{ aspectRatio }}>
        <AdaptiveImage
          src={item.imageUrl}
          alt={item.title}
          fit="native"
          width={item.imageWidth}
          height={item.imageHeight}
          priority={priority}
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 50vw, 33vw"
          className="transition-opacity duration-500 group-hover:opacity-90"
        />
      </div>
      <figcaption className="mt-5 px-0.5">
        <p className="font-display italic text-sm md:text-base text-noir/85 tracking-wide truncate">
          {item.title}
        </p>
        {item.caption && (
          <p className="text-noir/50 text-xs md:text-sm tracking-wide mt-1 truncate">{item.caption}</p>
        )}
        {dimsCaption && (
          <p className="text-noir/45 text-[0.7rem] tracking-[0.15em] uppercase mt-1.5">
            {dimsCaption}
          </p>
        )}
      </figcaption>
    </motion.figure>
  );
}
