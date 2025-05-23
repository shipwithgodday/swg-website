'use client';

import React from 'react';
import Container from '../shared/container';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';
import Image from 'next/image';
import img from '@/public/LooperGroup.svg';
import Link from 'next/link';
import { motion } from 'framer-motion';

function SignUp() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-white my-16 md:my-24 lg:my-32 px-8 xl:px-0">
      <Container className="bg-gradient-to-r from-[#00254F] to-[#00365D] rounded-3xl py-8 md:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-black md:hidden opacity-50" />
        <div className="max-w-5xl mx-auto flex flex-col items-center justify-center relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold text-center tracking-tight capitalize">
            Don&apos;t miss out on our{' '}
            <span className="text-primary">weekly</span> container
            deals!
          </h1>
          <p className="text-center text-lg md:text-xl font-light mt-4 text-white md:text-primary italic">
            Subscribe to our newsletter to get the latest updates on
            our weekly container deals.
          </p>

          <Button className="mt-8">
            <Link href="/signup" className="flex items-center gap-2">
              Subscribe
              <Icon name="ArrowRight" />
            </Link>
          </Button>
        </div>

        <div className="absolute top-0 bottom-0 right-0 h-full w-full">
          <div className="relative h-full w-full">
            <Image
              src={img}
              alt="svg"
              className="h-full w-full object-cover lg:object-contain object-right opacity-70 lg:opacity-100 transition-all duration-300"
              priority
            />
          </div>
        </div>
      </Container>
    </motion.section>
  );
}

export default SignUp;
