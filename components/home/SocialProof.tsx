import React from 'react';
import Container from '../shared/container';
import SectionHeader from '../shared/section-header';
import Image from 'next/image';
import img from '@/public/woman-wrehse.jpg';

function SocialProof() {
  return (
    <section>
      <Container className="flex flex-col md:flex-row items-stretch justify-between gap-8 md:gap-12">
        <div className="w-full md:w-1/2">
          <SectionHeader highlightedWord="business!">
            we mean business!
          </SectionHeader>

          <div className="mt-8 md:mt-12 bg-secondary p-5 md:p-7 rounded-2xl">
            <p className="text-lg md:text-xl">
              We have been in business for two years, and we have the
              stats to prove it!
            </p>

            <div className="mt-8 md:mt-16 grid grid-cols-2 gap-4 md:gap-9">
              <div className="bg-white p-4 md:p-5 lg:p-6 rounded-xl h-full">
                <p className="text-sm md:text-base font-semibold mb-4 md:mb-6 lg:mb-10 xl:mb-24 uppercase max-w-[200px]">
                  clients served
                </p>
                <p className="text-3xl md:text-4xl xl:text-6xl font-extralight">
                  400+
                </p>
              </div>
              <div className="bg-white p-4 md:p-5 lg:p-6 rounded-xl h-full">
                <p className="text-sm md:text-base font-semibold mb-4 md:mb-6 lg:mb-10 xl:mb-24 uppercase max-w-[200px]">
                  years in business
                </p>
                <p className="text-3xl md:text-4xl xl:text-6xl font-extralight">
                  2+
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/2 relative min-h-[300px] md:min-h-0">
          <Image
            src={img}
            alt="Woman in a warehouse"
            fill
            className="object-cover rounded-2xl"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </Container>
    </section>
  );
}

export default SocialProof;
