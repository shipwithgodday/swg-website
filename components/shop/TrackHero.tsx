'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Ship, Warehouse, MoveRight } from 'lucide-react';

import Container from '@/components/shared/container';
import SectionHeader from '@/components/shared/section-header';
import trackBg from '@/public/track-bg.jpeg';

/**
 * Immersive hero for the shipment-tracking page. Replaces the flat navy
 * `PageHero` band with a full-bleed cargo photo (`track-bg.jpeg`) under a
 * brand navy gradient so the gold `#shipwithgodday` pill and heading stay
 * legible. The page floats its lookup form over the lower edge of this hero
 * (negative top margin) for a layered, "dispatch board" feel.
 */
export function TrackHero() {
  return (
    <section className="relative -mt-24 overflow-hidden bg-[#00254F] text-white md:-mt-32">
      {/* Cargo photograph */}
      <Image
        src={trackBg}
        alt=""
        fill
        priority
        placeholder="blur"
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Brand navy wash — readability + cohesion. Heavier on the left where
          the copy sits, opening up to reveal the photo on the right. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-[#00254F]/95 via-[#00254F]/80 to-[#00365D]/55"
      />
      {/* Vertical fade so the floating form card blends out of the navy. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-[#00254F] via-[#00254F]/35 to-transparent"
      />
      {/* Soft gold glow for a touch of warmth against the steel-blue photo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
      />

      <Container className="relative z-10 pt-40 pb-36 md:pt-48 md:pb-44">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full md:w-4/5">
          <motion.span
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="inline-block rounded-l-full bg-primary px-3 py-1.5 text-xs uppercase tracking-wide text-black md:px-5 md:py-2 md:text-sm">
            #shipwithgodday
          </motion.span>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-3 hidden md:mt-4 md:block">
            <SectionHeader highlightedWord="Shipments">
              Track Your Shipments
            </SectionHeader>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-3 block md:hidden">
            <SectionHeader size="md" highlightedWord="Shipments">
              Track Your Shipments
            </SectionHeader>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-3 max-w-lg text-base italic text-white/90 md:text-lg">
            Enter your invoice numbers to see your containers&apos; estimated
            arrival dates.
          </motion.p>

          {/* Route marker — the two milestones every shipment passes through. */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium uppercase tracking-widest text-white/70">
            <span className="flex items-center gap-2">
              <Ship className="size-4 text-primary" />
              Tema Port
            </span>
            <MoveRight className="size-4 text-white/40" />
            <span className="flex items-center gap-2">
              <Warehouse className="size-4 text-primary" />
              Ghana Warehouse
            </span>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
