'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { Target, Clock, Globe } from 'lucide-react';
import { AnimatedSection } from '@/components/AnimatedSection';
import { CTAStrip } from '@/components/CTAStrip';
import { AdaptiveImage } from '@/components/ui/adaptive-image';

const valueIcons = [Target, Clock, Globe];

interface FeaturedArtwork {
  id: string;
  slug: string;
  title: string;
  imageUrl: string;
  imageWidth: number | null;
  imageHeight: number | null;
  artistName: string;
  artistSlug: string;
}

interface Artist {
  id: string;
  name: string;
  nationality: string;
  image: string;
}

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
}

export function HomePageClient({ featuredArtworks, featuredArtists, banner }: { featuredArtworks: FeaturedArtwork[]; featuredArtists: Artist[]; banner: Banner | null }) {
  const t = useTranslations('home');

  const bannerContent = banner ? (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      className="text-center px-6 max-w-4xl"
    >
      <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-blanc tracking-[0.04em] leading-tight">
        {banner.title}
      </h2>
      {banner.subtitle && (
        <p className="text-blanc/85 text-base md:text-lg mt-6 tracking-[0.12em] uppercase">
          {banner.subtitle}
        </p>
      )}
      {banner.linkUrl && (
        <span className="inline-block mt-10 text-xs tracking-[0.25em] uppercase text-blanc border-b border-blanc/60 pb-1 hover:border-blanc transition-colors">
          {t('gallery.cta')}
        </span>
      )}
    </motion.div>
  ) : null;

  return (
    <div className="flex flex-col">
      {/* ===== BLOCK 1 — HERO =====
          Watermark logo subtil (5% opacity) + texte par-dessus. Sizing en
          `vmin` pour stabilité absolue : la taille suit la plus petite
          dimension du viewport (largeur OU hauteur), donc le watermark ne
          réagit pas aux variations parasites quand l'utilisateur resize
          uniquement la largeur (cas Victor 2026-05-20 : feedback fenêtre
          desktop réduite encore instable malgré clamp(vw)). Borne haute via
          `min()` pour cap desktop large. Carré 1:1 strict (aspect-square)
          → aucun reflow possible. */}
      <section className="bg-blanc min-h-[100svh] md:min-h-screen flex items-center justify-center relative overflow-x-clip">
        <div className="absolute inset-0">
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src="/images/gallery/logo.jpeg"
              alt=""
              width={720}
              height={720}
              className="w-[min(78vw,70vh)] sm:w-[min(70vmin,720px)] aspect-square opacity-[0.05] object-contain"
              aria-hidden="true"
              priority
            />
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-[calc(100vw-2rem)] text-center px-2 sm:px-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mb-12"
          >
            <h1 className="font-display text-[clamp(2.75rem,12vw,3rem)] sm:text-6xl md:text-7xl lg:text-8xl uppercase leading-none text-noir text-center">
              <span className="tracking-[0.38em] sm:tracking-[0.45em] block">ORUS</span>
              <span className="tracking-[0.1em] sm:tracking-[0.15em] block">GALLERY</span>
            </h1>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="flex items-center justify-center gap-4 sm:gap-6 mb-8 sm:mb-10"
          >
            <span className="font-display text-xs sm:text-base md:text-lg tracking-[0.24em] sm:tracking-[0.3em] uppercase text-noir">TAIPEI</span>
            <div className="w-10 sm:w-12 h-px bg-or" />
            <span className="font-display text-xs sm:text-base md:text-lg tracking-[0.24em] sm:tracking-[0.3em] uppercase text-noir">PARIS</span>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.9 }}
            className="text-noir/50 text-xs sm:text-base md:text-lg tracking-[0.12em] sm:tracking-[0.15em] uppercase"
          >
            {t('hero.tagline')}
          </motion.p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="w-px h-16 bg-gradient-to-b from-or/60 to-transparent" />
          </motion.div>
        </motion.div>
      </section>

      {/* ===== BANNIÈRE — sous le hero quand configurée ===== */}
      {banner && (
        <section
          className="relative h-[70vh] md:h-[80vh] overflow-hidden"
          data-testid="home-banner"
        >
          <Image
            src={banner.imageUrl}
            alt={banner.title}
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-noir/30 via-noir/40 to-noir/60" />
          <div className="absolute inset-0 flex items-center justify-center">
            {banner.linkUrl ? (
              <Link href={banner.linkUrl} aria-label={banner.title}>
                {bannerContent}
              </Link>
            ) : (
              bannerContent
            )}
          </div>
        </section>
      )}

      {/* ===== BLOCK 2 — SELECTION D'OEUVRES ===== */}
      <AnimatedSection
        padding="lg"
        initial={{ opacity: 0 }}
        transition={{ duration: 1 }}
        viewportMargin="-100px"
        container={false}
      >
        <div className="text-center mb-20 px-4 md:px-8 lg:px-12">
          <h2 className="title-section text-noir">{t('gallery.title')}</h2>
        </div>
        {featuredArtworks.length > 0 ? (
          <div>
            {/* Restored uniform 4:5 card grid (pré-PR phase2+3 ArtworkRail).
                Feedback Victor 2026-05-20 : le rail multi-format produisait des
                tailles déséquilibrées (œuvres trop petites/grandes). Retour
                au rendu équilibré horizontal scroll snap, taille fixe par card. */}
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-12 md:w-20 bg-gradient-to-r from-blanc to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-12 md:w-20 bg-gradient-to-l from-blanc to-transparent z-10 pointer-events-none" />
              <div className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth px-6 md:px-12 lg:px-20">
                {featuredArtworks.slice(0, 10).map((artwork, index) => (
                  <motion.div
                    key={artwork.id}
                    initial={{ opacity: 0, x: 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: index * 0.06 }}
                    className="group snap-start shrink-0 w-[260px] md:w-[300px]"
                  >
                    <Link href={`/artworks/${artwork.slug}`}>
                      <div className="aspect-[4/5] relative overflow-hidden">
                        <AdaptiveImage
                          src={artwork.imageUrl}
                          alt={artwork.title}
                          sizes="300px"
                          className="transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-noir/0 group-hover:bg-noir/30 transition-colors duration-500 flex items-end p-6 opacity-0 group-hover:opacity-100">
                          <div>
                            <p className="font-display text-lg text-blanc tracking-wide">{artwork.title}</p>
                            <p className="text-blanc/70 text-sm mt-1">{artwork.artistName}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="font-display text-base text-noir tracking-wide">{artwork.title}</p>
                        <p className="text-noir/50 text-sm tracking-wide mt-1">{artwork.artistName}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="text-center mt-16">
              <Link
                href="/artists"
                className="inline-flex items-center gap-3 text-noir/60 text-sm tracking-[0.1em] uppercase transition-colors duration-300 hover:text-noir"
              >
                {t('gallery.cta')} <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 px-4 md:px-8 lg:px-12">
            {featuredArtists.map((artist, index) => (
              <motion.div
                key={artist.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="group"
              >
                <Link href={`/artists/${artist.id}`}>
                  <div className="aspect-[4/3] relative overflow-hidden mb-6">
                    <Image
                      src={artist.image}
                      alt={artist.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <p className="font-display text-lg text-noir tracking-wide">{artist.name}</p>
                  <p className="text-noir/50 text-sm tracking-wide mt-1">{artist.nationality}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatedSection>

      {/* ===== BLOCK 3 — DIRECTION CURATORIALE ===== */}
      <section className="bg-blanc-muted section-padding-lg">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 1 }}
              className="aspect-[4/5] relative overflow-hidden"
            >
              <Image
                src="/images/gallery/Galerie 1.png"
                alt="ORUS Gallery facade"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-center lg:text-left"
            >
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-noir mb-10 tracking-[0.04em]">
                {t('curatorial.title')}
              </h2>
              <div className="w-20 h-px bg-gradient-to-r from-transparent via-or to-transparent mx-auto lg:mx-0 mb-10" />
              <p className="text-noir/70 text-lg leading-relaxed mb-6">{t('curatorial.text1')}</p>
              <p className="text-noir/60 text-base leading-relaxed mb-6">{t('curatorial.text2')}</p>
              <p className="text-noir/50 text-base leading-relaxed">{t('curatorial.text3')}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== BLOCK 4 — POURQUOI ORUS ===== */}
      <AnimatedSection
        padding="lg"
        initial={{ opacity: 0 }}
        transition={{ duration: 1 }}
        viewportMargin="-100px"
      >
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 * (index + 1) }}
              className="text-center px-6 py-10"
            >
              {(() => { const Icon = valueIcons[index]; return <Icon className="w-8 h-8 mx-auto mb-6 stroke-[1.5]" style={{ color: '#4A7C6F' }} />; })()}
              <h3 className="font-display text-xl text-noir mb-4 tracking-wide">
                {t(`values.items.${index}.title`)}
              </h3>
              <p className="text-noir/60 text-sm leading-relaxed">
                {t(`values.items.${index}.description`)}
              </p>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* ===== BLOCK 5 — CONTACT STRIP ===== */}
      <CTAStrip
        text={t('cta.text')}
        primaryLink={{ href: '/contact', label: t('cta.contact') }}
        secondaryLink={{ href: '/artists', label: t('cta.artists') }}
        locationTag={t('cta.location')}
      />
    </div>
  );
}
