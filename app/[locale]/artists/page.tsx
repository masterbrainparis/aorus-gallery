import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getArtistsListForFrontend } from '@/lib/queries/artists';
import { ArtistsPageClient } from './client';
import type { Locale } from '@/i18n/routing';
import { OG_LOCALE, generateAlternates } from '@/lib/seo';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: t('artistsTitle'),
    description: t('artistsDescription'),
    alternates: generateAlternates(locale, '/artists'),
    openGraph: {
      title: t('artistsTitle'),
      description: t('artistsDescription'),
      type: 'website',
      siteName: 'ORUS Gallery',
      locale: OG_LOCALE[locale],
      images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'ORUS Gallery' }],
    },
    twitter: { card: 'summary_large_image' as const },
  };
}

export default async function ArtistsPage({ params }: Props) {
  const { locale } = await params;
  const artists = await getArtistsListForFrontend(locale as Locale);
  return <ArtistsPageClient artists={artists} />;
}
