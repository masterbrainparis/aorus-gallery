'use client';

import { Link } from '@/i18n/navigation';
import { AnimatedSection } from './AnimatedSection';

interface CTAStripProps {
  title?: string;
  text?: string;
  primaryLink: { href: string; label: string };
  secondaryLink?: { href: string; label: string };
  locationTag?: string;
  sectionClassName?: string;
}

export function CTAStrip({
  title,
  text,
  primaryLink,
  secondaryLink,
  locationTag,
  sectionClassName,
}: CTAStripProps) {
  return (
    <AnimatedSection
      bg="blanc-muted"
      container="narrow"
      className={sectionClassName}
      containerClassName="text-center"
    >
      {title && (
        <h2 className="font-display text-2xl md:text-3xl text-noir mb-6">{title}</h2>
      )}
      {text && (
        <p className="text-noir/60 text-lg mb-12 max-w-2xl mx-auto leading-relaxed">{text}</p>
      )}
      <div className="flex flex-col sm:flex-row gap-5 justify-center">
        <Link href={primaryLink.href} className="btn-primary">
          {primaryLink.label}
        </Link>
        {secondaryLink && (
          <Link href={secondaryLink.href} className="btn-secondary-dark">
            {secondaryLink.label}
          </Link>
        )}
      </div>
      {locationTag && (
        <p className="text-noir/50 text-sm tracking-[0.15em] uppercase mt-16">{locationTag}</p>
      )}
    </AnimatedSection>
  );
}
