import Container from '@/components/shared/container';
import SectionHeader from '@/components/shared/section-header';
import React from 'react';

function Services() {
  return (
    <section className="my-16 md:my-24 lg:my-32">
      <Container>
        <SectionHeader highlightedWord="Services">
          Our Services
        </SectionHeader>

        <p className="mt-3.5 text-lg font-light w-2/3 mb-12">
          We always put our customers first, ensuring your needs are
          met from the very beginning of our process till you have
          your desired goods in hand.
        </p>

        <div className="grid grid-cols-3 gap-8">
          <div
            style={{
              backgroundImage: 'url(/procurement.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'right',
            }}
            className="h-96 rounded-2xl flex items-end pb-6 px-8 cursor-pointer hover:scale-105 transition-all duration-300">
            <span className="text-white text-4xl uppercase font-medium">
              Procurement services
            </span>
          </div>

          <div
            style={{
              backgroundImage: 'url(/shipping.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            className="col-span-2 h-96 rounded-2xl flex items-end pb-6 px-8 cursor-pointer hover:scale-105 transition-all duration-300">
            <span className="text-white text-4xl uppercase font-medium">
              Shipping solutions
            </span>
          </div>

          <div
            style={{
              backgroundImage: 'url(/alipay.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'bottom',
            }}
            className="h-96 rounded-2xl flex items-end pb-6 px-8 col-span-3 cursor-pointer hover:scale-105 transition-all duration-300">
            <span className="text-white text-4xl uppercase font-medium">
              payment facilitation
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default Services;
