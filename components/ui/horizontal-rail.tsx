'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HorizontalRailProps {
  children: React.ReactNode;
  className?: string;
  buttonClassName?: string;
  label: string;
  previousLabel: string;
  nextLabel: string;
  testId?: string;
}

interface RailState {
  canScrollPrevious: boolean;
  canScrollNext: boolean;
  hasOverflow: boolean;
}

const INITIAL_STATE: RailState = {
  canScrollPrevious: false,
  canScrollNext: false,
  hasOverflow: false,
};

export function HorizontalRail({
  children,
  className,
  buttonClassName,
  label,
  previousLabel,
  nextLabel,
  testId,
}: HorizontalRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const railId = useId();
  const [state, setState] = useState<RailState>(INITIAL_STATE);

  const updateState = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const railBounds = rail.getBoundingClientRect();
    const firstBounds = rail.firstElementChild?.getBoundingClientRect();
    const lastBounds = rail.lastElementChild?.getBoundingClientRect();
    const nextState = {
      canScrollPrevious: Boolean(firstBounds && firstBounds.left < railBounds.left - 2),
      canScrollNext: Boolean(lastBounds && lastBounds.right > railBounds.right + 2),
      hasOverflow: maxScroll > 2,
    };
    setState((current) => (
      current.canScrollPrevious === nextState.canScrollPrevious
      && current.canScrollNext === nextState.canScrollNext
      && current.hasOverflow === nextState.hasOverflow
        ? current
        : nextState
    ));
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const resizeObserver = new ResizeObserver(updateState);
    resizeObserver.observe(rail);
    [...rail.children].forEach((child) => resizeObserver.observe(child));
    rail.addEventListener('scroll', updateState, { passive: true });
    window.addEventListener('load', updateState, { once: true });
    updateState();

    return () => {
      resizeObserver.disconnect();
      rail.removeEventListener('scroll', updateState);
      window.removeEventListener('load', updateState);
    };
  }, [updateState]);

  const scroll = useCallback((direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    rail.scrollBy({
      left: direction * Math.max(240, rail.clientWidth * 0.78),
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, []);

  const buttonBase = cn(
    'absolute top-1/2 z-20 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full',
    'border border-noir/10 bg-blanc/90 text-noir/70 shadow-sm backdrop-blur-sm transition-opacity',
    'hover:text-noir focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade focus-visible:ring-offset-2',
    'disabled:cursor-default disabled:opacity-20',
    !state.hasOverflow && 'pointer-events-none opacity-0',
    buttonClassName,
  );

  return (
    <div className="relative">
      <button
        type="button"
        className={cn(buttonBase, 'left-3 md:left-5')}
        onClick={() => scroll(-1)}
        disabled={!state.canScrollPrevious}
        aria-label={previousLabel}
        aria-controls={railId}
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <div
        ref={railRef}
        id={railId}
        role="region"
        aria-label={label}
        tabIndex={0}
        data-testid={testId}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            scroll(-1);
          }
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            scroll(1);
          }
        }}
        className={cn(
          'overflow-x-auto focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-jade/50',
          className,
        )}
      >
        {children}
      </div>
      <button
        type="button"
        className={cn(buttonBase, 'right-3 md:right-5')}
        onClick={() => scroll(1)}
        disabled={!state.canScrollNext}
        aria-label={nextLabel}
        aria-controls={railId}
      >
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
