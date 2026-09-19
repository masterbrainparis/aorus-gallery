import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { getLocale } from 'next-intl/server';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';

// GA Measurement ID — set via Vercel env. If absent, the GoogleAnalytics
// component is not rendered (no script load, no PII leakage).
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Force light mode partout (UA controls + mobile browser chrome status bar).
// Le site est designed light-only ; sans ces déclarations Safari iOS / Chrome
// Android tintent automatiquement la status bar et les inputs selon les
// prefs OS dark. Feedback Victor 2026-05-19.
export const viewport: Viewport = {
  themeColor: '#FAFAFA',
  colorScheme: 'light',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.orusgallery.com'),
  title: 'ORUS Gallery | Contemporary Art | Taiwan',
  description:
    'ORUS Gallery represents international contemporary artists for Asian and global collectors. Origin + Us: where art meets identity. Based in Taiwan with connections to Paris.',
  keywords: [
    'art gallery',
    'contemporary art',
    'Taiwan',
    'Paris',
    'luxury gallery',
    'art collection',
    'international artists',
    'Asian collectors',
    'memory',
    'identity',
  ],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-icon.png', type: 'image/png', sizes: '180x180' }],
  },
  openGraph: {
    title: 'ORUS Gallery',
    description: 'Contemporary Art | Taiwan — Paris | Origin + Us',
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['fr_FR', 'zh_TW'],
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'ORUS Gallery' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@orusgallery',
  },
  robots: {
    index: true,
    follow: true,
  },
  // Google Search Console domain ownership verification (URL-prefix property
  // method — alternative à la validation DNS). Permet à Victor de valider la
  // propriété du site sans toucher aux DNS du registrar.
  // Token configurable via env pour pouvoir le rotater sans toucher au code.
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION }
    : undefined,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html suppressHydrationWarning lang={locale}>
      <body>{children}</body>

      {/* === GA4 Consent Mode v2 ===
          RGPD-friendly default : tous les consents commencent à 'denied'.
          Le CookieBanner ci-dessous appelle gtag('consent', 'update', ...)
          quand l'utilisateur accepte. wait_for_update: 500ms = GA4 attend la
          décision avant de fire les premiers events (sinon il fire en mode
          consent-denied et on perd la session du visiteur qui accepte). */}
      {GA_ID && (
        <Script id="gtag-consent-default" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              analytics_storage: 'denied',
              wait_for_update: 500
            });
            gtag('set', 'ads_data_redaction', true);
          `}
        </Script>
      )}
      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      {/* CookieBanner is mounted in app/[locale]/layout.tsx (inside
          NextIntlClientProvider) because it calls useTranslations(). Mounting
          here, above the provider, throws "context not found" → 500. */}
    </html>
  );
}
