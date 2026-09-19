import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getPressArticles } from '@/lib/queries/press';
import { PressPageClient } from './client';
import { PageHero } from '@/components/PageHero';
import type { Locale } from '@/i18n/routing';
import { BASE_URL, OG_LOCALE, generateAlternates } from '@/lib/seo';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: t('pressTitle'),
    description: t('pressDescription'),
    alternates: generateAlternates(locale, '/press'),
    openGraph: {
      title: t('pressTitle'),
      description: t('pressDescription'),
      type: 'website',
      siteName: 'ORUS Gallery',
      locale: OG_LOCALE[locale],
      images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'ORUS Gallery' }],
    },
    twitter: { card: 'summary_large_image' as const },
  };
}

export default async function PressPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const articles = await getPressArticles(locale as Locale);

  if (articles.length === 0) {
    const t = await getTranslations({ locale, namespace: 'press.empty' });
    return (
      <div className="flex flex-col">
        <PageHero title={t('title')} />
        <section className="section-padding">
          <div className="container-narrow">
            <div className="max-w-2xl mx-auto space-y-6 text-noir/75">
              <p className="text-base leading-relaxed">{t('intro')}</p>
              <p>
                <a
                  href="mailto:press@orusgallery.com"
                  className="text-base text-noir underline decoration-or/40 underline-offset-4 hover:decoration-or transition-colors"
                >
                  press@orusgallery.com
                </a>
              </p>
              <p className="text-sm text-noir/55 pt-4">{t('footer')}</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'ORUS Gallery Press',
    url: `${BASE_URL}/${locale}/press`,
    description: 'Press coverage and media mentions of ORUS Gallery',
    publisher: {
      '@type': 'ArtGallery',
      name: 'ORUS Gallery',
      url: BASE_URL,
    },
    mainEntity: articles.map((a) => ({
      '@type': 'NewsArticle',
      headline: a.title,
      url: a.url ?? undefined,
      datePublished: a.publishedAt,
      publisher: {
        '@type': 'Organization',
        name: a.publication,
      },
      image: a.imageUrl ?? undefined,
      description: a.excerpt ?? undefined,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PressPageClient articles={articles} />
    </>
  );
}
