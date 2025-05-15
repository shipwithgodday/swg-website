'use client';
import React, { useRef } from 'react';
import Container from '../shared/container';
import SectionHeader from '../shared/section-header';
import Image from 'next/image';
import img from '@/public/woman-wrehse.jpg';
import { motion, useInView } from 'framer-motion';

function SocialProof() {
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, {
    once: true,
    amount: 0.3,
  });

  const statsRef = useRef(null);
  const isStatsInView = useInView(statsRef, {
    once: true,
    amount: 0.3,
  });

  const imageRef = useRef(null);
  const isImageInView = useInView(imageRef, {
    once: true,
    amount: 0.3,
  });

  return (
    <section>
      <Container className="flex flex-col md:flex-row items-stretch justify-between gap-8 md:gap-12">
        <div className="w-full md:w-1/2">
          <motion.div
            ref={headerRef}
            initial={{ opacity: 0 }}
            animate={
              isHeaderInView
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 20 }
            }
            transition={{ duration: 0.6 }}>
            <SectionHeader highlightedWord="business!">
              we mean business!
            </SectionHeader>
          </motion.div>

          <motion.div
            ref={statsRef}
            initial={{ opacity: 0 }}
            animate={isStatsInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-8 md:mt-12 bg-secondary p-5 md:p-7 rounded-2xl">
            <p className="text-lg md:text-xl">
              We have been in business for two years, and we have the
              stats to prove it!
            </p>

            <div className="mt-8 md:mt-16 grid grid-cols-2 gap-4 md:gap-9">
              <motion.div
                initial={{ opacity: 0 }}
                animate={
                  isStatsInView ? { opacity: 1 } : { opacity: 0 }
                }
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white p-4 md:p-5 lg:p-6 rounded-xl h-full">
                <p className="text-sm md:text-base font-semibold mb-4 md:mb-6 lg:mb-10 xl:mb-24 uppercase max-w-[200px]">
                  clients served
                </p>
                <p className="text-3xl md:text-4xl xl:text-6xl font-extralight">
                  400+
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={
                  isStatsInView ? { opacity: 1 } : { opacity: 0 }
                }
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-white p-4 md:p-5 lg:p-6 rounded-xl h-full">
                <p className="text-sm md:text-base font-semibold mb-4 md:mb-6 lg:mb-10 xl:mb-24 uppercase max-w-[200px]">
                  years in business
                </p>
                <p className="text-3xl md:text-4xl xl:text-6xl font-extralight">
                  2+
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
        <motion.div
          ref={imageRef}
          initial={{ opacity: 0 }}
          animate={isImageInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full md:w-1/2 relative min-h-[300px] md:min-h-0">
          <Image
            src={img}
            alt="Woman in a warehouse"
            fill
            className="object-cover rounded-2xl"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </motion.div>
      </Container>
    </section>
  );
}

export default SocialProof;
