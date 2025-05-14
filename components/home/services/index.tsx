import Container from '@/components/shared/container';
import SectionHeader from '@/components/shared/section-header';
import React from 'react';

function Services() {
  return (
    <section className="my-16 md:my-24 lg:my-32">
      <Container>
        <div>
          <SectionHeader highlightedWord={'Services'}>
            Our Services
          </SectionHeader>
        </div>
        {/* <div className="lg:hidden">
          <SectionHeader size="md" highlightedWord={'Services'}>
            Our Services
          </SectionHeader>
        </div> */}

        <p className="mt-3.5 text-lg font-light w-full lg:w-2/3 mb-12">
          We always put our customers first, ensuring your needs are
          met from the very beginning of our process till you have
          your desired goods in hand.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div
            style={{
              backgroundImage: 'url(/procurement.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'right',
            }}
            className="h-64 sm:h-72 md:h-80 lg:h-96 rounded-2xl flex items-end pb-4 sm:pb-5 lg:pb-6 px-4 sm:px-6 lg:px-8 cursor-pointer hover:scale-105 transition-all duration-300">
            <span className="text-white text-2xl sm:text-3xl lg:text-4xl uppercase font-medium">
              Procurement services
            </span>
          </div>

          <div
            style={{
              backgroundImage: 'url(/shipping.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            className="h-64 sm:h-72 md:h-80 lg:h-96 rounded-2xl flex items-end pb-4 sm:pb-5 lg:pb-6 px-4 sm:px-6 lg:px-8 cursor-pointer hover:scale-105 transition-all duration-300 col-span-1 md:col-span-2">
            <span className="text-white text-2xl sm:text-3xl lg:text-4xl uppercase font-medium">
              Shipping solutions
            </span>
          </div>

          <div
            style={{
              backgroundImage: 'url(/alipay.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'bottom',
            }}
            className="h-64 sm:h-72 md:h-80 lg:h-96 rounded-2xl flex items-end pb-4 sm:pb-5 lg:pb-6 px-4 sm:px-6 lg:px-8 cursor-pointer hover:scale-105 transition-all duration-300 col-span-1 md:col-span-3">
            <span className="text-white text-2xl sm:text-3xl lg:text-4xl uppercase font-medium">
              payment facilitation
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default Services;
