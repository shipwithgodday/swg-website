'use client';
import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Standard scroll-triggered fade-up used across the storefront. Mirrors the
 * Hero / Services / WhyUs pattern but accepts a stagger index so grids can
 * cascade their children without each callsite re-declaring variants.
 *
 * Respects `prefers-reduced-motion` — when set, content renders statically
 * with no animation.
 */
export function MotionReveal({
  children,
  delay = 0,
  className,
  as = 'div',
}: {
  children: ReactNode;
  /** Seconds. Use `index * 0.05` for staggered grid children. */
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article';
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  if (reduce) {
    const Plain = as as keyof React.JSX.IntrinsicElements;
    return <Plain className={className}>{children}</Plain>;
  }
  return (
    <Tag
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, delay, ease: 'easeOut' }}
      className={className}>
      {children}
    </Tag>
  );
}
