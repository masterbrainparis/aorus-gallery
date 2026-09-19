import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { BASE_URL, OG_LOCALE, generateAlternates } from '@/lib/seo';

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: t('contactTitle'),
    description: t('contactDescription'),
    alternates: generateAlternates(locale, '/contact'),
    openGraph: {
      title: t('contactTitle'),
      description: t('contactDescription'),
      type: 'website',
      siteName: 'ORUS Gallery',
      locale: OG_LOCALE[locale],
      images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'ORUS Gallery' }],
    },
    twitter: { card: 'summary_large_image' as const },
  };
}

const localBusinessLd = {
  '@context': 'https://schema.org',
  '@type': ['LocalBusiness', 'ArtGallery'],
  '@id': `${BASE_URL}#organization`,
  name: 'ORUS Gallery',
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  image: `${BASE_URL}/opengraph-image.png`,
  email: 'info@orusgallery.com',
  priceRange: '$$$$',
  description: 'Contemporary art gallery bridging Taipei and Paris. Origin + Us.',
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    description: 'By appointment only',
  },
  address: [
    { '@type': 'PostalAddress', addressLocality: 'Paris', addressCountry: 'FR' },
    { '@type': 'PostalAddress', addressLocality: 'Taipei', addressCountry: 'TW' },
  ],
};

export default function ContactLayout({ children }: Props) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd) }}
      />
      {children}
    </>
  );
}
