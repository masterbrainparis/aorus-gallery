'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { PageHero } from '@/components/PageHero';
import { AnimatedSection } from '@/components/AnimatedSection';

interface PressArticle {
  id: string;
  slug: string;
  title: string;
  publication: string;
  publishedAt: Date;
  url: string | null;
  imageUrl: string | null;
  excerpt: string | null;
}

const LOCALE_DATE_MAP: Record<string, string> = {
  fr: 'fr-FR',
  en: 'en-GB',
  zh: 'zh-TW',
};

export function PressPageClient({ articles }: { articles: PressArticle[] }) {
  const t = useTranslations('press');
  const locale = useLocale();
  const dateLocale = LOCALE_DATE_MAP[locale] ?? 'en-GB';

  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const formatDate = useCallback(
    (d: Date) => new Date(d).toLocaleDateString(dateLocale, { year: 'numeric', month: 'long' }),
    [dateLocale],
  );

  const updateScrollState = useCallback(() => {
    const c = containerRef.current;
    if (!c) return;
    const firstCard = c.children[0] as HTMLElement | undefined;
    const cardWidth = firstCard?.offsetWidth ?? 0;
    const gap = 32;
    const step = cardWidth + gap;
    const idx = step > 0 ? Math.round(c.scrollLeft / step) : 0;
    setActiveIndex(Math.min(Math.max(idx, 0), articles.length - 1));
    setCanPrev(c.scrollLeft > 8);
    setCanNext(c.scrollLeft + c.clientWidth < c.scrollWidth - 8);
  }, [articles.length]);

  const scrollToIndex = useCallback((index: number) => {
    const c = containerRef.current;
    if (!c) return;
    const target = c.children[index] as HTMLElement | undefined;
    if (!target) return;
    const offset = target.offsetLeft - c.offsetLeft;
    c.scrollTo({ left: offset, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    updateScrollState();
    c.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      c.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollToIndex(Math.min(activeIndex + 1, articles.length - 1));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollToIndex(Math.max(activeIndex - 1, 0));
    } else if (e.key === 'Home') {
      e.preventDefault();
      scrollToIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      scrollToIndex(articles.length - 1);
    }
  };

  const yearLabel = useMemo(() => {
    if (articles.length === 0) return null;
    const date = articles[activeIndex]?.publishedAt;
    if (!date) return null;
    return new Date(date).getFullYear();
  }, [articles, activeIndex]);

  return (
    <div className="flex flex-col">
      <PageHero
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
        className="!pt-20 md:!pt-24 lg:!pt-24 !pb-6 md:!pb-8 lg:!pb-8"
        dividerClassName="mt-6 md:mt-7"
      />

      {articles.length > 0 ? (
        <section
          className="bg-blanc relative pt-4 md:pt-6 lg:pt-8 pb-14 md:pb-16 lg:pb-20 px-4 md:px-8 lg:px-12"
          aria-label={t('hero.title')}
        >
          {/* Edge gradients */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 md:w-24 lg:w-32 bg-gradient-to-r from-blanc to-transparent z-20" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 md:w-24 lg:w-32 bg-gradient-to-l from-blanc to-transparent z-20" />

          {/* Year marker — shifts elegantly with active card */}
          {yearLabel && (
            <div className="container-wide flex items-baseline gap-6 mb-6 md:mb-8 px-6 md:px-12">
              <p className="text-[0.7rem] tracking-[0.3em] uppercase text-noir/50 font-medium">
                {t('coverage.eyebrow')}
              </p>
              <div className="flex-1 h-px bg-noir/10" />
              <motion.p
                key={yearLabel}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="font-display text-3xl md:text-4xl text-or tracking-wide tabular-nums"
                aria-live="polite"
              >
                {yearLabel}
              </motion.p>
            </div>
          )}

          <div
            ref={containerRef}
            role="region"
            aria-roledescription="carousel"
            aria-label={t('coverage.title')}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            className="flex gap-6 md:gap-8 overflow-x-auto overflow-y-hidden scrollbar-hide snap-x snap-mandatory scroll-smooth px-6 md:px-12 lg:px-24 pb-2 cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-or/40 focus-visible:ring-offset-4 focus-visible:ring-offset-blanc"
          >
            {articles.map((article, index) => {
              const titleNode = (
                <h3 className="font-display text-2xl md:text-3xl text-noir leading-[1.18] tracking-wide">
                  {article.title}
                </h3>
              );
              return (
                <motion.article
                  key={article.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.7, delay: 0.05 * Math.min(index, 6) }}
                  className="snap-start shrink-0 w-[85vw] sm:w-[420px] lg:w-[460px] xl:w-[500px] flex flex-col"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} / ${articles.length}`}
                >
                  {article.imageUrl ? (
                    <div className="aspect-[16/10] relative overflow-hidden bg-blanc-muted">
                      <Image
                        src={article.imageUrl}
                        alt={article.title}
                        fill
                        sizes="(max-width: 640px) 85vw, 500px"
                        className="object-cover transition-opacity duration-700 hover:opacity-90"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/10] relative bg-blanc-muted flex items-center justify-center">
                      <span
                        className="font-display italic text-noir/30 text-2xl tracking-wide"
                        style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
                      >
                        {article.publication}
                      </span>
                    </div>
                  )}

                  <div className="mt-5 md:mt-6 flex-1 flex flex-col">
                    <p className="text-[0.7rem] tracking-[0.25em] uppercase text-noir/55">
                      <span className="text-noir font-medium">{article.publication}</span>
                      <span className="text-noir/30 mx-3">/</span>
                      <span className="text-noir/65">{formatDate(article.publishedAt)}</span>
                    </p>

                    <div className="mt-3.5 md:mt-4">
                      {article.url ? (
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block group"
                        >
                          <span className="block transition-opacity duration-300 group-hover:opacity-70">
                            {titleNode}
                          </span>
                        </a>
                      ) : (
                        titleNode
                      )}
                    </div>

                    {article.excerpt && (
                      <div
                        className="text-noir/65 text-sm md:text-base leading-relaxed font-body mt-4 line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: article.excerpt }}
                      />
                    )}

                    {article.url && (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group mt-auto pt-6 inline-flex self-start items-center gap-2 border-b border-noir/40 pb-1.5 text-[0.7rem] tracking-[0.25em] uppercase text-noir hover:border-or hover:text-or transition-colors duration-300"
                      >
                        {t('readArticle')}
                        <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                      </a>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </div>

          {/* Timeline + arrows */}
          <div className="container-wide mt-8 md:mt-10 px-6 md:px-12 flex items-center gap-6 md:gap-10">
            <button
              type="button"
              onClick={() => scrollToIndex(Math.max(activeIndex - 1, 0))}
              disabled={!canPrev}
              aria-label={t('carousel.previous')}
              className="hidden sm:inline-flex items-center justify-center h-10 w-10 border border-noir/20 text-noir hover:border-or hover:text-or disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Progress ruler — gold tick on active, hairline elsewhere */}
            <div className="flex-1 relative h-px bg-noir/10" role="presentation">
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 h-px bg-or"
                initial={false}
                animate={{
                  width: `${((activeIndex + 1) / articles.length) * 100}%`,
                }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
              <div className="absolute -top-2 left-0 right-0 flex items-center justify-between">
                {articles.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => scrollToIndex(i)}
                    aria-label={t('carousel.goToSlide', { n: i + 1 })}
                    aria-current={i === activeIndex}
                    className="group p-2 -my-2"
                  >
                    <span
                      className={`block h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                        i === activeIndex
                          ? 'bg-or scale-110'
                          : 'bg-noir/20 group-hover:bg-noir/40'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[0.7rem] tracking-[0.25em] uppercase text-noir/55 tabular-nums hidden md:block">
              <span className="text-noir">{String(activeIndex + 1).padStart(2, '0')}</span>
              <span className="text-noir/30 mx-2">/</span>
              {String(articles.length).padStart(2, '0')}
            </p>

            <button
              type="button"
              onClick={() => scrollToIndex(Math.min(activeIndex + 1, articles.length - 1))}
              disabled={!canNext}
              aria-label={t('carousel.next')}
              className="hidden sm:inline-flex items-center justify-center h-10 w-10 border border-noir/20 text-noir hover:border-or hover:text-or disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </section>
      ) : (
        <AnimatedSection
          bg="blanc"
          padding="lg"
          container="narrow"
          initial={{ opacity: 0, y: 40 }}
          transition={{ duration: 1 }}
          viewportMargin="-100px"
        >
          <div className="text-center py-24">
            <p className="text-noir/50 text-sm tracking-[0.1em] uppercase">
              {t('coverage.placeholder')}
            </p>
          </div>
        </AnimatedSection>
      )}

      <AnimatedSection
        bg="blanc-muted"
        padding="lg"
        container="narrow"
        containerClassName="text-center"
        initial={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        animateOnMount
      >
        <p className="text-noir/55 text-[0.7rem] tracking-[0.25em] uppercase mb-6">
          {t('contact.title')}
        </p>
        <p className="font-display text-noir text-2xl md:text-3xl tracking-wide leading-tight max-w-2xl mx-auto">
          {t('contact.instruction')}
        </p>
        <a
          href={`mailto:${t('contact.email')}`}
          className="mt-10 inline-block border-b border-noir/40 pb-1.5 text-sm tracking-[0.2em] uppercase text-noir hover:border-noir transition-colors duration-300"
        >
          {t('contact.email')}
        </a>
        <p className="text-noir/55 text-sm leading-relaxed max-w-xl mx-auto mt-12">
          {t('contact.text')}
        </p>
      </AnimatedSection>
    </div>
  );
}
