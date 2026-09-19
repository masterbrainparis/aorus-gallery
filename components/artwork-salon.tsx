'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

import { AdaptiveImage } from '@/components/ui/adaptive-image';
import type { ArtworkMedia } from '@/components/artwork-display';
import { cn } from '@/lib/utils';

interface ArtworkSalonProps {
  items: ArtworkMedia[];
  linkRenderer?: (href: string, children: ReactNode, className?: string) => ReactNode;
  emptyState?: ReactNode;
  dataTestId?: string;
}

type SalonOrientation = 'portrait' | 'landscape' | 'square';

function getOrientation(width: number | null, height: number | null): SalonOrientation {
  if (!width || !height) return 'portrait';
  const ratio = width / height;
  if (ratio < 0.9) return 'portrait';
  if (ratio > 1 / 0.9) return 'landscape';
  return 'square';
}

export function ArtworkSalon({
  items,
  linkRenderer,
  emptyState,
  dataTestId = 'artwork-salon',
}: ArtworkSalonProps) {
  if (items.length === 0) return <>{emptyState ?? null}</>;

  return (
    <div className="w-full max-w-[1480px] mx-auto" data-testid={dataTestId}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 md:gap-x-10 lg:gap-x-12 xl:gap-x-14 2xl:gap-x-16 gap-y-16 md:gap-y-20 lg:gap-y-24 items-start">
        {items.map((item, index) => {
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
        })}
      </div>
    </div>
  );
}

function ArtworkSalonCell({ item, priority }: { item: ArtworkMedia; priority: boolean }) {
  const aspectRatio =
    item.imageWidth && item.imageHeight ? `${item.imageWidth} / ${item.imageHeight}` : '4 / 5';
  const dimensions = item.dimensionsLabel
    ?? (item.widthCm && item.heightCm ? `${item.widthCm} × ${item.heightCm} cm` : null);
  const orientation = getOrientation(item.imageWidth, item.imageHeight);

  const imageBoxClass =
    orientation === 'landscape'
      ? 'w-full'
      : orientation === 'square'
        ? 'w-[92%] md:w-auto md:h-[92%]'
        : 'w-[84%] md:w-auto md:h-full';

  return (
    <motion.figure
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
      className="group flex flex-col"
      data-salon-orientation={orientation}
    >
      <div className="flex w-full items-end justify-center md:aspect-square">
        <div
          className={cn('relative max-w-full max-h-full overflow-hidden', imageBoxClass)}
          style={{ aspectRatio }}
        >
          <AdaptiveImage
            src={item.imageUrl}
            alt={item.title}
            fit="native"
            width={item.imageWidth}
            height={item.imageHeight}
            priority={priority}
            sizes="(max-width: 767px) 92vw, (max-width: 1279px) 48vw, 31vw"
            className="transition-opacity duration-500 group-hover:opacity-90"
          />
        </div>
      </div>

      <figcaption className="mt-5 md:mt-6 px-0.5">
        <p className="font-display italic text-sm md:text-base text-noir/85 tracking-wide truncate">
          {item.title}
        </p>
        {item.caption && (
          <p className="text-noir/50 text-xs md:text-sm tracking-wide mt-1 truncate">{item.caption}</p>
        )}
        {dimensions && (
          <p className="text-noir/45 text-[0.7rem] tracking-[0.15em] uppercase mt-1.5">
            {dimensions}
          </p>
        )}
      </figcaption>
    </motion.figure>
  );
}
