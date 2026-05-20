'use client';
import type { ReactNode } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

import Container from '@/components/shared/container';
import SectionHeader from '@/components/shared/section-header';
import looper from '@/public/LooperGroup.svg';

interface PageHeroProps {
  /** Heading text. */
  title: string;
  /** Word within `title` to highlight in gold. */
  highlightedWord?: string;
  /** Small pill above the title. Pass `null` to hide. */
  tag?: string | null;
  /** Italic supporting line. */
  subtitle?: ReactNode;
  /** Optional action node rendered below the subtitle (e.g. breadcrumb or a button). */
  children?: ReactNode;
}

/**
 * The customer-facing page hero: navy gradient band, gold `#shipwithgodday`
 * pill, `SectionHeader` with a highlighted word, italic supporting copy and
 * the LooperGroup decoration on the right — matching `AboutHero` and
 * `ContactHero`.
 *
 * Uses negative top margin to bleed under the shop layout's navbar-clearance
 * padding so the navy band reaches edge-to-edge under the floating nav; the
 * inner `mt-20 md:pt-40` then pushes content below the nav, exactly like the
 * marketing heroes.
 */
export function PageHero({
  title,
  highlightedWord,
  tag = '#shipwithgodday',
  subtitle,
  children,
}: PageHeroProps) {
  return (
    <section className="relative -mt-24 overflow-hidden bg-gradient-to-r from-[#00254F] to-[#00365D] py-8 text-white md:-mt-32 md:py-16">
      <Container className="relative z-10 mt-20 md:pt-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-20">
          <div className="w-full md:w-4/5">
            {tag && (
              <motion.span
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-block rounded-l-full bg-primary px-3 py-1.5 text-xs uppercase text-black md:px-5 md:py-2 md:text-sm">
                {tag}
              </motion.span>
            )}
            <div className="mt-3 w-full md:mt-4 xl:w-4/5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="hidden md:block">
                <SectionHeader highlightedWord={highlightedWord}>
                  {title}
                </SectionHeader>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="block md:hidden">
                <SectionHeader size="md" highlightedWord={highlightedWord}>
                  {title}
                </SectionHeader>
              </motion.div>
              {subtitle && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="mt-3 text-base italic text-white/90 md:text-lg">
                  {subtitle}
                </motion.p>
              )}
              {children && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="mt-6">
                  {children}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </Container>

      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 bottom-0 h-full w-full">
        <div className="relative h-full w-full">
          <Image
            src={looper}
            alt=""
            className="h-full w-full object-cover object-right opacity-70 transition-all duration-300 lg:object-contain lg:opacity-100"
            priority
          />
        </div>
      </div>
    </section>
  );
}
