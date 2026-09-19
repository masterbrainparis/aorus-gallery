import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { OG_LOCALE, generateAlternates } from '@/lib/seo';

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: t('aboutTitle'),
    description: t('aboutDescription'),
    alternates: generateAlternates(locale, '/about'),
    openGraph: {
      title: t('aboutTitle'),
      description: t('aboutDescription'),
      type: 'website',
      siteName: 'ORUS Gallery',
      locale: OG_LOCALE[locale],
      images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'ORUS Gallery' }],
    },
    twitter: { card: 'summary_large_image' as const },
  };
}

export default function AboutLayout({ children }: Props) {
  return children;
}
