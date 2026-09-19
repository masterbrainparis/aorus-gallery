import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getGalleryExhibitions } from '@/lib/queries/exhibitions';
import { ExhibitionsPageClient } from './client';
import type { Locale } from '@/i18n/routing';
import { BASE_URL, OG_LOCALE, generateAlternates } from '@/lib/seo';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: t('exhibitionsTitle'),
    description: t('exhibitionsDescription'),
    alternates: generateAlternates(locale, '/exhibitions'),
    openGraph: {
      title: t('exhibitionsTitle'),
      description: t('exhibitionsDescription'),
      type: 'website',
      siteName: 'ORUS Gallery',
      locale: OG_LOCALE[locale],
      images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'ORUS Gallery' }],
    },
    twitter: { card: 'summary_large_image' as const },
  };
}

export default async function ExhibitionsPage({ params }: Props) {
  const { locale } = await params;
  const exhibitions = await getGalleryExhibitions(locale);

  const upcomingExhibitions = exhibitions.filter(
    (ex) => ex.status === 'CURRENT' || ex.status === 'UPCOMING'
  );

  const exhibitionEventsLd = upcomingExhibitions.map((ex) => ({
    '@context': 'https://schema.org',
    '@type': 'ExhibitionEvent',
    name: ex.title,
    description: ex.description ?? undefined,
    startDate: ex.startDate ?? undefined,
    endDate: ex.endDate ?? undefined,
    location: ex.location
      ? { '@type': 'Place', name: ex.location }
      : undefined,
    image: ex.imageUrl ?? undefined,
    url: `${BASE_URL}/${locale}/exhibitions`,
    organizer: {
      '@type': 'Organization',
      name: 'ORUS Gallery',
      url: BASE_URL,
    },
  }));

  return (
    <>
      {exhibitionEventsLd.map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}
      <ExhibitionsPageClient exhibitions={exhibitions} locale={locale} />
    </>
  );
}
