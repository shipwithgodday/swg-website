'use client';
import React from 'react';
import Container from '@/components/shared/container';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import Link from 'next/link';
import { motion } from 'framer-motion';

function Hero() {
  return (
    <section
      style={{
        backgroundImage: 'url(/hero.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      className="h-screen flex items-end lg:items-center relative">
      <div className="absolute inset-0 bg-black opacity-40 md:hidden" />
      <Container className="mt-56 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-20">
          <div className="w-full md:w-4/5 lg:w-3/5 space-y-3 md:space-y-6 text-white pb-24 md:pb-48">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="font-extrabold text-3xl sm:text-4xl md:text-5xl xl:text-6xl uppercase mt-2 tracking-wide">
              ship with <span className="text-primary">godday</span>{' '}
              🇬🇭🇨🇳
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="md:text-2xl md:w-5/6">
              Facilitating seamless sea shipping from China to Ghana.
              Our mission is to create a seamless supply chain from
              china to ghana either via air or sea.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}>
              <Button>
                <Link
                  href="/schedule"
                  className="flex items-center gap-2">
                  Schedule a Call <Icon name="ArrowRight" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

export default Hero;
