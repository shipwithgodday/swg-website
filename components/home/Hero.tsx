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
      className="min-h-screen flex items-end lg:items-center relative">
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-black/10" />
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
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-extrabold text-3xl sm:text-4xl md:text-5xl xl:text-6xl uppercase mt-2 tracking-wide">
              ship with <span className="text-primary">godday</span>{' '}
              🇬🇭🇨🇳
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg md:text-xl lg:text-2xl md:w-5/6 text-gray-200">
              Streamline your supply chain with our comprehensive
              shipping solutions from China to Ghana. Experience
              reliable sea and air freight services tailored to your
              business needs.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col md:flex-row gap-4">
              <Button>
                <Link
                  href="/schedule"
                  className="flex items-center gap-2">
                  Schedule a Call <Icon name="ArrowRight" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="text-lg px-8 bg-transparent  border-white hover:bg-white hover:text-black">
                <Link
                  href="#services"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById('services')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center gap-2">
                  Our Services <Icon name="ArrowRight" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex items-center gap-6 pt-8">
              <div className="flex items-center gap-2">
                <Icon name="Check" className="w-5 h-5 text-primary" />
                <span>Door-to-Door Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Check" className="w-5 h-5 text-primary" />
                <span>Real-time Tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Check" className="w-5 h-5 text-primary" />
                <span>24/7 Support</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

export default Hero;
