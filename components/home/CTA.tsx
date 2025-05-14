import React from 'react';
import Container from '../shared/container';
import SectionHeader from '../shared/section-header';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';

function CTA() {
  return (
    <Container className=" my-8 sm:my-12 md:my-24 lg:my-32 relative">
      <div
        className="py-12 sm:py-20 md:py-28 px-4 sm:px-8 md:px-12 relative rounded-2xl overflow-hidden"
        style={{
          backgroundImage: 'url(/port.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
        <div className="absolute inset-0 bg-black opacity-70" />
        <div className="relative z-10 w-full sm:w-[90%] md:w-4/5">
          <div className="hidden md:block text-white">
            <SectionHeader>ready to ship?</SectionHeader>
          </div>
          <div className="md:hidden text-white">
            <SectionHeader size="sm">ready to ship?</SectionHeader>
          </div>
          <p className="text-primary text-lg sm:text-xl italic mt-2 sm:mt-3">
            Let&apos;s get your goods moving—quickly, safely, and
            affordably.
          </p>

          <p className="mt-6 sm:mt-8 text-base sm:text-lg md:text-xl text-white">
            Whether you&apos;re a first-time importer or a seasoned
            business owner, we&apos;re here to make the process easy.
            From sourcing products to making supplier payments and
            handling weekly shipments, we&apos;ll walk you through it
            all. Schedule a quick call with our team and take the
            first step toward hassle-free shipping from China to
            Ghana.
          </p>

          <Button className="mt-6 sm:mt-8">
            Schedule A Call
            <Icon name="ArrowRight" className="ml-2" />
          </Button>
        </div>
      </div>
    </Container>
  );
}

export default CTA;
