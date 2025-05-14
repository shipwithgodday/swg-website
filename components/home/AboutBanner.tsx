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
    <section className="bg-gradient-to-r from-[#00254F] to-[#00365D] text-white py-8 md:py-16 relative overflow-hidden">
      {/* Dark overlay for mobile only */}
      <div className="absolute inset-0 bg-black opacity-60 md:hidden" />

      <Container className="mx-auto px-4 md:px-6 py-8 md:py-16">
        <div className="relative z-20">
          <div className="w-full md:w-4/5">
            <span className="px-3 py-1.5 md:px-5 md:py-2 rounded-l-full text-black bg-primary uppercase text-xs md:text-sm">
              #shipwithgodday
            </span>

            <div className="mt-3 md:mt-4">
              <div className="hidden md:block">
                <SectionHeader>who are we?</SectionHeader>
              </div>
              <div className="md:hidden">
                <SectionHeader size="sm">who are we?</SectionHeader>
              </div>
              <p className="mt-3 md:mt-6 text-sm md:text-base">
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
            <Button className="flex items-center gap-2 mt-6">
              Read More
              <Icon name="ArrowRight" />
            </Button>
          </Link>
        </div>
      </Container>

      {/* Image - absolute positioned for both mobile and desktop */}
      <div className="absolute top-0 bottom-0 right-0 h-full w-full">
        <div className="relative h-full w-full">
          <Image
            src={img}
            alt="svg"
            className="h-full w-full object-cover lg:object-contain object-right opacity-40 lg:opacity-100 transition-all duration-300"
            priority
          />
        </div>
      </div>
    </section>
  );
}

export default AboutBanner;
