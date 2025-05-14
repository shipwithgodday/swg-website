import React from 'react';
import Container from '../shared/container';
import SectionHeader from '../shared/section-header';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';

function CTA() {
  return (
    <Container className="rounded-2xl my-16 md:my-24 lg:my-32 overflow-hidden relative">
      <div
        className="py-28 px-12 relative"
        style={{
          backgroundImage: 'url(/port.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
        <div className="absolute inset-0 bg-black opacity-70" />
        <div className="relative z-10 w-4/5">
          <SectionHeader className="text-white">
            ready to ship?
          </SectionHeader>
          <p className="text-primary text-xl italic mt-3">
            Let&apos;s get your goods moving—quickly, safely, and
            affordably.
          </p>

          <p className="mt-8 text-xl text-white">
            Whether you&apos;re a first-time importer or a seasoned
            business owner, we&apos;re here to make the process easy.
            From sourcing products to making supplier payments and
            handling weekly shipments, we&apos;ll walk you through it
            all. Schedule a quick call with our team and take the
            first step toward hassle-free shipping from China to
            Ghana.
          </p>

          <Button className="mt-8">
            Schedule A Call
            <Icon name="ArrowRight" />
          </Button>
        </div>
      </div>
    </Container>
  );
}

export default CTA;
