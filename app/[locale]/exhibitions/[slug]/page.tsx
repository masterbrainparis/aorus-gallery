import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getExhibitionBySlugForFrontend } from '@/lib/queries/exhibitions';
import { ExhibitionDetailClient } from './client';
import type { Locale } from '@/i18n/routing';
import { BASE_URL, OG_LOCALE, generateAlternates } from '@/lib/seo';
import { stripHtml } from '@/lib/strip-html';

interface Props {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const exhibition = await getExhibitionBySlugForFrontend(slug, locale as Locale);
  if (!exhibition) notFound();

  const description = exhibition.description
    ? stripHtml(exhibition.description).slice(0, 160)
    : `${exhibition.title} at ORUS Gallery — ${exhibition.location ?? 'Taipei — Paris'}`;

  return {
    title: `${exhibition.title} | ORUS Gallery`,
    description,
    alternates: generateAlternates(locale, `/exhibitions/${slug}`),
    openGraph: {
      title: `${exhibition.title} | ORUS Gallery`,
      description,
      type: 'website',
      siteName: 'ORUS Gallery',
      locale: OG_LOCALE[locale],
      images: exhibition.imageUrl
        ? [{ url: exhibition.imageUrl, alt: exhibition.title }]
        : [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'ORUS Gallery' }],
    },
    twitter: { card: 'summary_large_image' as const },
  };
}

export default async function ExhibitionDetailPage({ params }: Props) {
  const { slug, locale } = await params;
  const exhibition = await getExhibitionBySlugForFrontend(slug, locale as Locale);
  const t = await getTranslations({ locale, namespace: 'nav' });

  if (!exhibition) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ExhibitionEvent',
    name: exhibition.title,
    description: exhibition.description ? stripHtml(exhibition.description) : undefined,
    startDate: exhibition.startDate ?? undefined,
    endDate: exhibition.endDate ?? undefined,
    location: {
      '@type': 'Place',
      name: exhibition.location ?? 'ORUS Gallery',
      address: exhibition.location ?? 'Taipei — Paris',
    },
    image: exhibition.imageUrl ?? undefined,
    url: `${BASE_URL}/${locale}/exhibitions/${slug}`,
    organizer: {
      '@type': 'ArtGallery',
      name: 'ORUS Gallery',
      url: BASE_URL,
    },
    performer: exhibition.artists.map((a) => ({
      '@type': 'Person',
      name: a.name,
      url: `${BASE_URL}/${locale}/artists/${a.slug}`,
    })),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/${locale}` },
      { '@type': 'ListItem', position: 2, name: t('exhibitions'), item: `${BASE_URL}/${locale}/exhibitions` },
      { '@type': 'ListItem', position: 3, name: exhibition.title },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <ExhibitionDetailClient exhibition={exhibition} />
    </>
  );
}
