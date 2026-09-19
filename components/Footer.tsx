'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function Footer() {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');
  const locale = useLocale();

  const cities = locale === 'zh' ? '巴黎 · 台北' : 'Paris · Taipei';
  const sectionLabel = locale === 'fr' ? 'Galerie' : locale === 'zh' ? '畫廊' : 'Gallery';
  const positioning =
    locale === 'fr'
      ? "Galerie d’art contemporain\nentre l’Europe et l’Asie"
      : locale === 'zh'
        ? '連結歐洲與亞洲的\n當代藝術畫廊'
        : 'Contemporary art gallery\nbetween Europe and Asia';

  return (
    <footer className="border-t border-hairline bg-blanc-muted">
      <div className="px-edge py-14 md:py-16 lg:py-[72px]">
        <div className="max-w-[1360px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-x-8 md:gap-x-10 lg:gap-x-12 gap-y-10 md:gap-y-12 lg:gap-y-0">
            <div className="sm:col-span-2 lg:col-span-5 lg:pr-10">
              <p className="font-display text-[2.75rem] md:text-[3rem] leading-none tracking-[0.045em] text-noir">
                ORUS
              </p>
              <p className="mt-5 text-[10px] md:text-[11px] tracking-[0.28em] uppercase text-noir/45">
                {cities}
              </p>
              <p className="mt-7 max-w-[280px] whitespace-pre-line text-[13px] md:text-sm leading-[1.7] text-noir/58">
                {positioning}
              </p>
            </div>

            <nav className="lg:col-span-2" aria-label={sectionLabel}>
              <p className="text-[10px] tracking-[0.22em] uppercase text-noir/38 mb-4">
                {sectionLabel}
              </p>
              <ul className="space-y-2.5 text-[13px] md:text-sm text-noir/78">
                <li>
                  <Link href="/artists" className="hover:text-jade transition-colors duration-300">
                    {nav('artists')}
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-jade transition-colors duration-300">
                    {nav('about')}
                  </Link>
                </li>
                <li>
                  <Link href="/press" className="hover:text-jade transition-colors duration-300">
                    {nav('press')}
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-jade transition-colors duration-300">
                    {nav('contact')}
                  </Link>
                </li>
              </ul>
            </nav>

            <div className="lg:col-span-3">
              <p className="text-[10px] tracking-[0.22em] uppercase text-noir/38 mb-4">
                {t('contact.title')}
              </p>
              <div className="flex flex-col items-start gap-2.5">
                <a
                  href="mailto:contact@orusgallery.com"
                  className="text-[13px] md:text-sm text-noir/85 hover:text-jade transition-colors duration-300"
                >
                  contact@orusgallery.com
                </a>
                <a
                  href="mailto:press@orusgallery.com"
                  className="text-[13px] md:text-sm text-noir/55 hover:text-jade transition-colors duration-300"
                >
                  press@orusgallery.com
                </a>
              </div>
            </div>

            <div className="lg:col-span-2">
              <a
                href="https://instagram.com/orusgallery"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase text-noir/38 hover:text-jade transition-colors duration-300"
              >
                <span>{t('social.instagram')}</span>
                <span
                  aria-hidden="true"
                  className="text-[0.95em] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                >
                  ↗
                </span>
              </a>
              <a
                href="https://instagram.com/orusgallery"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block text-[13px] md:text-sm text-noir/70 hover:text-jade transition-colors duration-300"
              >
                {t('social.handle')}
              </a>
            </div>
          </div>

          <div className="mt-12 md:mt-14 border-t border-hairline pt-5 md:pt-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:items-center">
            <span className="text-[10px] tracking-[0.22em] uppercase text-noir/35">
              {cities}
            </span>
            <span className="text-[11px] tracking-[0.04em] text-noir/35 md:text-center">
              {t('copyright')}
            </span>
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 text-[11px] tracking-[0.04em] text-noir/40 md:justify-end">
              <Link href="/privacy" className="hover:text-noir transition-colors duration-300">
                {t('privacy')}
              </Link>
              <span aria-hidden="true" className="text-noir/20">·</span>
              <Link href="/terms" className="hover:text-noir transition-colors duration-300">
                {t('terms')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
