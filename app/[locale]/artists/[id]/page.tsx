import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getArtistBySlugForFrontend } from '@/lib/queries/artists';
import { ArtistDetailClient } from './client';
import type { Locale } from '@/i18n/routing';
import { BASE_URL, OG_LOCALE, generateAlternates } from '@/lib/seo';
import { stripHtml } from '@/lib/strip-html';

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;
  const artist = await getArtistBySlugForFrontend(id, locale as Locale);
  if (!artist) notFound();
  const description = artist.bio ? stripHtml(artist.bio).slice(0, 160) : `${artist.name} at ORUS Gallery`;
  return {
    title: `${artist.name} | ORUS Gallery`,
    description,
    alternates: generateAlternates(locale, `/artists/${id}`),
    openGraph: {
      title: `${artist.name} | ORUS Gallery`,
      description,
      type: 'website',
      siteName: 'ORUS Gallery',
      locale: OG_LOCALE[locale],
      images: artist.image
        ? [{ url: artist.image, alt: artist.name }]
        : [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'ORUS Gallery' }],
    },
    twitter: { card: 'summary_large_image' as const },
  };
}

export default async function ArtistPage({ params }: Props) {
  const { id, locale } = await params;
  const artist = await getArtistBySlugForFrontend(id, locale as Locale);
  const t = await getTranslations({ locale, namespace: 'nav' });

  if (!artist) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: artist.name,
    nationality: artist.nationality,
    description: artist.bio ? stripHtml(artist.bio) : undefined,
    image: artist.image,
    url: `${BASE_URL}/${locale}/artists/${id}`,
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/${locale}` },
      { '@type': 'ListItem', position: 2, name: t('artists'), item: `${BASE_URL}/${locale}/artists` },
      { '@type': 'ListItem', position: 3, name: artist.name },
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
      <ArtistDetailClient artist={artist} />
    </>
  );
}
