import React from 'react';
import Container from '../shared/container';
import SectionHeader from '../shared/section-header';
import { DollarCircle, Ship } from 'iconsax-reactjs';
import Users from '@/public/users';

function WhyUs() {
  return (
    <section className="my-16 md:my-24 lg:my-32">
      <Container>
        <SectionHeader highlightedWord="Work">
          Why Work with us?
        </SectionHeader>

        <p className="mt-3.5 text-lg font-light w-full lg:w-2/3 mb-12">
          We always put our customers first, ensuring your needs are
          met from the very beginning of our process till you have
          your desired goods in hand.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          <div
            style={{
              backgroundImage: 'url(/customer-centric.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'top',
            }}
            className="h-72 md:h-80 lg:h-96 rounded-2xl flex pb-6 p-6 md:p-8 cursor-pointer hover:scale-105 transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-50" />
            <div className="z-20 flex flex-col justify-between w-full">
              <Users />

              <div className="border-t border-white pt-4 md:pt-6">
                <span className="text-2xl md:text-3xl lg:text-4xl text-white uppercase leading-tight">
                  Customer
                  <br />
                  Centric
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundImage: 'url(/pricing.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'top',
            }}
            className="h-72 md:h-80 lg:h-96 rounded-2xl flex pb-6 p-6 md:p-8 cursor-pointer hover:scale-105 transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-50" />
            <div className="z-20 flex flex-col justify-between w-full">
              <DollarCircle
                size="36"
                color="#FFFFFF"
                variant="Bold"
              />

              <div className="border-t border-white pt-4 md:pt-6">
                <span className="text-2xl md:text-3xl lg:text-4xl text-white uppercase leading-tight">
                  competitive
                  <br />
                  pricing
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundImage: 'url(/fast-shipping.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'top',
            }}
            className="h-72 md:h-80 lg:h-96 rounded-2xl flex pb-6 p-6 md:p-8 cursor-pointer hover:scale-105 transition-all duration-300 relative overflow-hidden md:col-span-2 lg:col-span-1">
            <div className="absolute inset-0 bg-black opacity-50" />
            <div className="z-20 flex flex-col justify-between w-full">
              <Ship size="36" color="#FFFFFF" variant="Bold" />

              <div className="border-t border-white pt-4 md:pt-6">
                <span className="text-2xl md:text-3xl lg:text-4xl text-white uppercase leading-tight">
                  fast
                  <br />
                  shipping
                </span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default WhyUs;
