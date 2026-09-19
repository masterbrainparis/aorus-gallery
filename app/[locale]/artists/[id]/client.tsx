'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { AnimatedSection } from '@/components/AnimatedSection';
import { CTAStrip } from '@/components/CTAStrip';
import type { ArtworkMedia } from '@/components/artwork-display';
import { ArtworkSalon } from '@/components/artwork-salon';

interface Artwork {
  id: string;
  slug: string;
  title: string;
  medium: string | null;
  dimensions: string | null;
  widthCm: number | null;
  heightCm: number | null;
  formattedDimensions: string | null;
  imageUrl: string;
  imageWidth: number | null;
  imageHeight: number | null;
  showPrice: boolean;
  price: number | null;
  currency: string;
}

interface Artist {
  id: string;
  name: string;
  nationality: string;
  bio: string;
  image: string;
  cv: {
    soloShows: string[];
    groupShows: string[];
    artFairs: string[];
    residencies: string[];
    awards: string[];
    collections: string[];
  };
  artworks: Artwork[];
}

const cvSectionKeys = [
  'soloShows',
  'groupShows',
  'artFairs',
  'residencies',
  'awards',
  'collections',
] as const;

export function ArtistDetailClient({ artist }: { artist: Artist }) {
  const t = useTranslations('artist');

  const cvSections = cvSectionKeys
    .map((key) => ({ key, label: t(key), items: artist.cv[key] }))
    .filter((s) => s.items.length > 0);

  return (
    <div className="flex flex-col">
      {/* ── Section 1: Hero Cover ── */}
      <section className="bg-blanc">
        {/* Back link */}
        <div className="px-edge pt-24 md:pt-28">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Link
              href="/artists"
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
              {t('backToArtists')}
            </Link>
          </motion.div>
        </div>

        {/* Hero content */}
        <div className="px-edge pt-8 md:pt-6 pb-12 md:pb-16 lg:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="container-wide grid md:grid-cols-3 gap-8 md:gap-12 lg:gap-16 items-center w-full"
          >
            {/* Artist portrait */}
            <div className="md:col-span-1">
              <div className="aspect-[3/4] relative overflow-hidden">
                <Image
                  src={artist.image}
                  alt={artist.name}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
            </div>

            {/* Name + nationality */}
            <div className="md:col-span-2 flex flex-col justify-center">
              <h1 className="font-display text-5xl md:text-7xl text-noir tracking-wide leading-[1.05]">
                {artist.name}
              </h1>
              <div className="divider-gold-wide mt-6 mb-4 md:mt-8 md:mb-6" />
              <p className="text-jade text-sm tracking-[0.2em] uppercase font-medium">
                {artist.nationality}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Section 2: Biography ── */}
      <AnimatedSection
        bg="blanc-muted"
        container={false}
        className="py-12 md:py-14 lg:py-16"
        initial={{ opacity: 0, y: 40 }}
        transition={{ duration: 1 }}
        viewportMargin="-100px"
      >
        <div className="max-w-3xl mx-auto px-6">
          <div className="divider-gold-wide mx-auto mb-6" />
          <p className="text-jade text-xs tracking-[0.25em] uppercase font-medium text-center mb-8">
            {t('biography')}
          </p>
          <div
            className="artist-rich-text text-noir/70 text-base md:text-lg leading-relaxed md:leading-loose font-body"
            dangerouslySetInnerHTML={{ __html: artist.bio }}
          />
          <div className="divider-gold-wide mx-auto mt-8" />
        </div>
      </AnimatedSection>

      {/* ── Section 3: Selected Works ── */}
      <AnimatedSection
        bg="blanc"
        container={false}
        containerClassName="w-full"
        className="py-16 md:py-20"
        initial={{ opacity: 0, y: 40 }}
        transition={{ duration: 1 }}
        viewportMargin="-100px"
      >
        <div className="text-center mb-10 md:mb-12">
          <p className="text-jade text-xs tracking-[0.25em] uppercase font-medium mb-4">
            {t('works')}
          </p>
          <h2 className="font-display text-3xl md:text-5xl text-noir tracking-wide">
            {t('selectedWorks')}
          </h2>
        </div>

        {artist.artworks.length > 0 ? (
          <ArtworkSalon
            items={artist.artworks.map<ArtworkMedia>((artwork) => ({
              id: artwork.id,
              title: artwork.title,
              imageUrl: artwork.imageUrl,
              imageWidth: artwork.imageWidth,
              imageHeight: artwork.imageHeight,
              widthCm: artwork.widthCm,
              heightCm: artwork.heightCm,
              dimensionsLabel: artwork.formattedDimensions,
              caption: artwork.medium ?? undefined,
              href: `/artworks/${artwork.slug}`,
            }))}
            linkRenderer={(href, children, className) => (
              <Link href={href} className={className}>
                {children}
              </Link>
            )}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-noir/50 text-sm tracking-[0.1em] uppercase">
              {t('works')} — {t('comingSoon')}
            </p>
          </div>
        )}
      </AnimatedSection>

      {/* ── Section 4: Curriculum Vitae ── */}
      {cvSections.length > 0 && (
        <AnimatedSection
          bg="blanc-muted"
          container="wide"
          className="py-12 md:py-16"
          initial={{ opacity: 0, y: 40 }}
          transition={{ duration: 1 }}
          viewportMargin="-100px"
        >
          <div className="text-center mb-10 md:mb-12">
            <p className="text-jade text-xs tracking-[0.25em] uppercase font-medium mb-4">
              {t('cv')}
            </p>
            <h2 className="font-display text-3xl md:text-5xl text-noir tracking-wide">
              {t('career')}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-10 md:gap-12">
            {cvSections.map((section) => (
              <div key={section.key}>
                <h3 className="font-display text-xl md:text-2xl text-jade tracking-wide mb-4">
                  {section.label}
                </h3>
                <div className="divider-gold mb-5" />
                <ul className="space-y-3">
                  {section.items.map((item, i) => (
                    <li key={i} className="text-noir/60 text-sm leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </AnimatedSection>
      )}

      {/* ── Section 5: Inquire CTA ── */}
      <CTAStrip
        title={t('inquire')}
        primaryLink={{ href: '/contact', label: t('contactUs') }}
        sectionClassName="py-12 md:py-16"
      />
    </div>
  );
}
