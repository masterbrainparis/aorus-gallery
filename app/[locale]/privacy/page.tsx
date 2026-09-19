import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHero } from '@/components/PageHero';
import { OG_LOCALE, generateAlternates } from '@/lib/seo';

interface Props {
  params: Promise<{ locale: string }>;
}

const SECTION_KEYS = [
  'section1',
  'section2',
  'section3',
  'section4',
  'section5',
  'section6',
  'section7',
  'section8',
  'section9',
  'section10',
  'section11',
  'section12',
] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal.privacy' });
  return {
    title: `${t('title')} | ORUS Gallery`,
    description: t('intro1'),
    alternates: generateAlternates(locale, '/privacy'),
    openGraph: {
      title: `${t('title')} | ORUS Gallery`,
      description: t('intro1'),
      type: 'website',
      siteName: 'ORUS Gallery',
      locale: OG_LOCALE[locale],
      images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'ORUS Gallery' }],
    },
    twitter: { card: 'summary_large_image' as const },
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'legal' });

  return (
    <div className="flex flex-col">
      <PageHero title={t('privacy.title')} />
      <section className="section-padding">
        <div className="container-narrow">
          <div className="prose prose-lg text-noir/70 max-w-none space-y-10">
            <p className="text-base leading-relaxed">{t('privacy.intro1')}</p>
            <p className="text-base leading-relaxed">{t('privacy.intro2')}</p>
            {SECTION_KEYS.map((key) => (
              <section key={key} className="space-y-4">
                <h2 className="font-display text-2xl text-noir tracking-wide">
                  {t(`privacy.${key}.title`)}
                </h2>
                <p className="whitespace-pre-line text-base leading-relaxed">
                  {t(`privacy.${key}.body`)}
                </p>
              </section>
            ))}
            <p className="text-sm text-noir/40 pt-8 border-t border-hairline mt-12">
              {t('lastUpdated')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
