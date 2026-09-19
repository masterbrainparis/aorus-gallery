'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { AnimatedSection } from '@/components/AnimatedSection';
import { CTAStrip } from '@/components/CTAStrip';
import { AdaptiveImage } from '@/components/ui/adaptive-image';
import { Lightbox } from '@/components/ui/lightbox';
import { ArtworkHero } from '@/components/artwork-display';
import { HorizontalRail } from '@/components/ui/horizontal-rail';

interface ArtworkData {
  id: string;
  slug: string;
  title: string;
  medium: string | null;
  dimensions: string | null;
  formattedDimensions: string | null;
  year: number | null;
  price: number | null;
  currency: string;
  showPrice: boolean;
  sold: boolean;
  imageUrl: string;
  imageWidth: number | null;
  imageHeight: number | null;
  images: string[];
  imagesMeta: Array<{ width: number | null; height: number | null; index: number }>;
  artist: {
    id: string;
    name: string;
    slug: string;
  };
  prevArtwork: { slug: string; title: string } | null;
  nextArtwork: { slug: string; title: string } | null;
}

export function ArtworkDetailClient({ artwork }: { artwork: ArtworkData }) {
  const t = useTranslations('artwork');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const allImages = [
    { src: artwork.imageUrl, alt: artwork.title, width: artwork.imageWidth, height: artwork.imageHeight },
    ...artwork.images.map((img, i) => ({
      src: img,
      alt: `${artwork.title} — ${i + 1}`,
      width: artwork.imagesMeta[i]?.width ?? null,
      height: artwork.imagesMeta[i]?.height ?? null,
    })),
  ];

  const activeImage = allImages[activeIndex] ?? allImages[0];
  const hasMultiple = allImages.length > 1;

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  return (
    <div className="flex flex-col">
      {/* Back navigation */}
      <section className="bg-blanc hero-offset">
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <Link
              href={`/artists/${artwork.artist.slug}`}
              className="text-noir/60 hover:text-noir transition-colors duration-300 text-sm tracking-[0.1em] uppercase inline-flex items-center gap-2 group"
            >
              <svg
                className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
              {artwork.artist.name}
            </Link>
          </motion.div>

          {/* Main artwork image — ratio natif preserved, generous breathing room */}
          <div className="px-4 sm:px-8 md:px-16 lg:px-24 py-6 md:py-12">
            <ArtworkHero
              key={activeImage.src}
              src={activeImage.src}
              alt={activeImage.alt}
              imageWidth={activeImage.width}
              imageHeight={activeImage.height}
              onClick={() => openLightbox(activeIndex)}
              onKeyDown={(e) => { if (e.key === 'Enter') openLightbox(activeIndex); }}
              ariaLabel={t('viewFullscreen')}
            />
          </div>

          {/* Thumbnail strip */}
          {hasMultiple && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-6 flex gap-3 overflow-x-auto scrollbar-hide snap-x"
              data-testid="artwork-thumbnails"
            >
              {allImages.map((image, index) => (
                <button
                  key={image.src}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`${t('details')} ${index + 1}`}
                  aria-current={activeIndex === index}
                  className={`relative shrink-0 w-20 h-20 md:w-24 md:h-24 snap-start overflow-hidden border transition-all duration-300 ${
                    activeIndex === index
                      ? 'border-noir opacity-100'
                      : 'border-noir/10 opacity-60 hover:opacity-100'
                  }`}
                >
                  <AdaptiveImage
                    src={image.src}
                    alt={image.alt}
                    sizes="96px"
                    fit="cover"
                  />
                </button>
              ))}
            </motion.div>
          )}

          {/* Cartel — museum-grade hierarchy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-12 md:mt-16 max-w-xl"
          >
            {/* 1. Artist */}
            <Link
              href={`/artists/${artwork.artist.slug}`}
              className="font-display text-2xl md:text-3xl text-noir tracking-wide hover:text-or transition-colors duration-300"
            >
              {artwork.artist.name}
            </Link>

            {/* 2. Title + Year */}
            <p className="text-noir/80 text-lg md:text-xl mt-4">
              <span className="italic">{artwork.title}</span>
              {artwork.year && <span className="text-noir/60">, {artwork.year}</span>}
            </p>

            {/* 3. Medium + Dimensions — single block, museum cartel style */}
            {(artwork.medium || artwork.formattedDimensions) && (
              <div className="mt-5 space-y-1 text-sm text-noir/55 tracking-wide">
                {artwork.medium && <p>{artwork.medium}</p>}
                {artwork.formattedDimensions && <p>{artwork.formattedDimensions}</p>}
              </div>
            )}

            {/* 4. Status — discrete */}
            {artwork.sold ? (
              <p className="text-noir/45 text-[0.7rem] tracking-[0.2em] uppercase mt-6">
                {t('sold')}
              </p>
            ) : (
              <p className="text-noir/45 text-[0.7rem] tracking-[0.2em] uppercase mt-6">
                {t('priceOnRequest')}
              </p>
            )}

            {/* 5. Inquire CTA — sober button-link style */}
            {!artwork.sold && (
              <a
                href={`mailto:info@orusgallery.com?subject=${encodeURIComponent(
                  `Renseignement — ${artwork.artist.name}, ${artwork.title}${artwork.year ? `, ${artwork.year}` : ''}`,
                )}`}
                className="mt-10 inline-block border-b border-noir/40 pb-1.5 text-xs tracking-[0.25em] uppercase text-noir hover:border-noir transition-colors duration-300"
                data-testid="inquire-mailto"
              >
                {t('inquire')}
              </a>
            )}
          </motion.div>
        </div>
      </section>

      {/* Contextual images — horizontal snap rail, ratio natif preserved */}
      {artwork.images.length > 0 && (
        <AnimatedSection
          bg="blanc-muted"
          initial={{ opacity: 0, y: 40 }}
          transition={{ duration: 1 }}
          viewportMargin="-100px"
          container={false}
        >
          <div className="text-center mb-12 px-6">
            <p className="text-or text-sm tracking-[0.2em] uppercase font-medium">{t('details')}</p>
          </div>
          <div style={{ ['--rail-h' as string]: '340px' } as React.CSSProperties}>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-r from-blanc-muted to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-l from-blanc-muted to-transparent z-10 pointer-events-none" />
              <HorizontalRail
                label={t('details')}
                previousLabel={t('previousImage')}
                nextLabel={t('nextImage')}
                testId="artwork-contextual-carousel"
                buttonClassName="bg-blanc-muted/90"
                className="flex gap-4 md:gap-6 scrollbar-hide snap-x snap-mandatory scroll-smooth px-4 md:px-8 lg:px-12 pb-4 cursor-grab active:cursor-grabbing"
              >
                {artwork.images.map((image, index) => {
                  const meta = artwork.imagesMeta[index];
                  const w = meta?.width ?? null;
                  const h = meta?.height ?? null;
                  const ratio = w && h ? `${w} / ${h}` : '4 / 3';
                  return (
                    <motion.button
                      type="button"
                      key={image}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.05 }}
                      onClick={() => openLightbox(index + 1)}
                      className="snap-start shrink-0 h-[240px] md:h-[300px] lg:h-[340px] bg-blanc-muted border border-noir/10 cursor-zoom-in group"
                      style={{ aspectRatio: ratio }}
                      aria-label={`${t('detail')} ${index + 1}`}
                    >
                      <div className="relative h-full" style={{ aspectRatio: ratio }}>
                        <AdaptiveImage
                          src={image}
                          alt={`${artwork.title} — ${t('detail')} ${index + 1}`}
                          sizes="(max-width: 768px) 80vw, 40vw"
                          fit="native"
                          width={w}
                          height={h}
                          className="transition-transform duration-700 group-hover:scale-[1.02]"
                        />
                      </div>
                    </motion.button>
                  );
                })}
              </HorizontalRail>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* Prev / Next navigation */}
      {(artwork.prevArtwork || artwork.nextArtwork) && (
        <AnimatedSection
          bg="blanc"
          initial={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          viewportMargin="-100px"
        >
          <div className="flex items-center justify-between">
            {artwork.prevArtwork ? (
              <Link
                href={`/artworks/${artwork.prevArtwork.slug}`}
                className="group inline-flex items-center gap-2 text-noir/60 hover:text-noir transition-colors duration-300"
              >
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm tracking-[0.1em] uppercase">{artwork.prevArtwork.title}</span>
              </Link>
            ) : (
              <div />
            )}
            {artwork.nextArtwork ? (
              <Link
                href={`/artworks/${artwork.nextArtwork.slug}`}
                className="group inline-flex items-center gap-2 text-noir/60 hover:text-noir transition-colors duration-300"
              >
                <span className="text-sm tracking-[0.1em] uppercase">{artwork.nextArtwork.title}</span>
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </AnimatedSection>
      )}

      {/* Inquire CTA */}
      <CTAStrip
        title={t('inquireAbout')}
        primaryLink={{ href: '/contact', label: t('contactUs') }}
      />

      {/* Lightbox */}
      <Lightbox
        images={allImages}
        index={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setLightboxIndex}
      />
    </div>
  );
}
