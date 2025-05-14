import React from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import Image from 'next/image';
import img from '@/public/LooperGroup.svg';
import Link from 'next/link';
import SectionHeader from '../shared/section-header';
import Container from '../shared/container';

function AboutBanner() {
  return (
    <section className="bg-gradient-to-r from-[#00254F] to-[#00365D] text-white py-8 md:py-16 relative overflow-hidden ">
      <Container className="mx-auto px-4 md:px-6 py-8 md:py-16">
        {/* Desktop version - original layout */}
        <div className="hidden md:block relative z-20">
          <div className="w-4/5">
            <span className="uppercase font-semibold">about us</span>

            <div className="mt-3">
              <SectionHeader>who are we?</SectionHeader>
              <p className="mt-6">
                We always put our customers first, ensuring your needs
                are met from the very beginning of our process till
                you have your desired goods in hand. We always put our
                customers first, ensuring your needs are met from the
                very beginning of our process till you have your
                desired goods in hand. We always put our customers
                first, ensuring your needs are met from the very
                beginning of our process till you have your desired
                goods in hand.
              </p>
            </div>
          </div>
          <Link
            href={'/about'}
            className="inline-flex hover:scale-105 transition-all duration-300">
            <Button className="flex items-center mt-6 text-white">
              Read More
              <Icon name="ArrowRight" />
            </Button>
          </Link>
        </div>

        {/* Mobile version - optimized layout */}
        <div className="md:hidden relative z-20">
          <div className="w-4/5 sm:w-3/4">
            <span className="uppercase font-semibold">about us</span>

            <div className="mt-4">
              <h2 className="text-3xl sm:text-4xl font-bold">
                Welcome To Alabaster Car Rentals and Tours Ltd.
              </h2>
              <p className="mt-3 text-sm">
                We always put our customers first, ensuring your needs
                are met from the very beginning of our process till
                you have your desired goods in hand. We always put our
                customers first, ensuring your needs are met from the
                very beginning of our process till you have your
                desired goods in hand. We always put our customers
                first, ensuring your needs are met from the very
                beginning of our process till you have your desired
                goods in hand.
              </p>
            </div>
          </div>
          <Link
            href={'/about'}
            className="inline-flex hover:scale-105 transition-all duration-300">
            <Button className="flex items-center gap-2 mt-6 w-auto">
              Read More
              <Icon name="ArrowRight" />
            </Button>
          </Link>
        </div>
      </Container>

      {/* Image - absolute positioned for both mobile and desktop */}
      <div className="absolute top-0 bottom-0 right-0 h-full w-full ">
        <div className="relative h-full w-full">
          <Image
            src={img}
            alt="svg"
            className="h-full w-full object-cover lg:object-contain object-right opacity-70 lg:opacity-100 transition-all duration-300"
            priority
          />
        </div>
      </div>
    </section>
  );
}

export default AboutBanner;
