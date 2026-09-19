import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getFeaturedArtworks } from '@/lib/queries/artworks';
import { getArtistsListForFrontend } from '@/lib/queries/artists';
import { getActiveBanner } from '@/lib/queries/banner';
import { getSiteSettings } from '@/lib/queries/settings';
import { HomePageClient } from './client';
import type { Locale } from '@/i18n/routing';
import { BASE_URL, OG_LOCALE, generateAlternates } from '@/lib/seo';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: generateAlternates(locale),
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
      siteName: 'ORUS Gallery',
      locale: OG_LOCALE[locale],
      images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'ORUS Gallery' }],
    },
    twitter: { card: 'summary_large_image' as const },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const featuredArtworks = await getFeaturedArtworks(locale as Locale);
  const allArtists = await getArtistsListForFrontend(locale as Locale);
  const featuredArtists = allArtists.slice(0, 4);
  const settings = await getSiteSettings();
  const banner = settings.showBanner ? await getActiveBanner(locale as Locale) : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ArtGallery',
    '@id': `${BASE_URL}#organization`,
    name: 'ORUS Gallery',
    alternateName: 'ORUS',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    image: `${BASE_URL}/opengraph-image.png`,
    description: 'Contemporary art gallery bridging Taipei and Paris. Origin + Us.',
    slogan: 'Origin + Us',
    email: 'info@orusgallery.com',
    // schema.org Person identification intentionally omitted pre-launch — the
    // gallery is presented as an institutional entity, not a personal project.
    address: [
      { '@type': 'PostalAddress', addressLocality: 'Paris', addressCountry: 'FR' },
      { '@type': 'PostalAddress', addressLocality: 'Taipei', addressCountry: 'TW' },
    ],
    location: [
      {
        '@type': 'Place',
        name: 'ORUS Gallery Paris',
        address: { '@type': 'PostalAddress', addressLocality: 'Paris', addressCountry: 'FR' },
      },
      {
        '@type': 'Place',
        name: 'ORUS Gallery Taipei',
        address: { '@type': 'PostalAddress', addressLocality: 'Taipei', addressCountry: 'TW' },
      },
    ],
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      description: 'By appointment only',
    },
    sameAs: [
      // To be filled with the gallery's social accounts
      // 'https://www.instagram.com/orusgallery',
      // 'https://www.artsy.net/partner/orus-gallery',
    ].filter(Boolean),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePageClient featuredArtworks={featuredArtworks} featuredArtists={featuredArtists} banner={banner} />
    </>
  );
}
