'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { PageHero } from '@/components/PageHero';

interface Artist {
  id: string;
  name: string;
  nationality: string;
  image: string;
}

export function ArtistsPageClient({ artists }: { artists: Artist[] }) {
  const t = useTranslations('artists');

  return (
    <div className="flex flex-col">
      <PageHero
        title={t('title')}
        subtitle={t('subtitle')}
        subtitleClassName="text-noir/60 text-base tracking-[0.08em] mb-8"
      />

      {/* Fond uniforme blanc (feedback Victor 2026-05-20) : la section grille
          était en `bg-blanc-muted` (gris très clair) entre le PageHero blanc
          et le footer, créant une rupture visuelle non voulue. */}
      <section className="section-padding bg-blanc">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="container-wide"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {artists.map((artist, index) => (
              <motion.div
                key={artist.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.05 * Math.min(index, 12) }}
              >
                <Link href={`/artists/${artist.id}`} className="group block">
                  <div className="card-artwork aspect-[3/4] relative">
                    <Image
                      src={artist.image}
                      alt={artist.name}
                      fill
                      sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 20vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-noir/60 via-noir/30 to-transparent" />
                  </div>
                  <div className="p-4 bg-blanc">
                    <p className="text-noir text-sm md:text-base font-display tracking-wide">
                      {artist.name}
                    </p>
                    {artist.nationality && (
                      <p className="text-or text-xs tracking-[0.12em] uppercase mt-1">
                        {artist.nationality}
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
