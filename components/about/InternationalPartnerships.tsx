'use client';
import React from 'react';
import Container from '../shared/container';
import SectionHeader from '../shared/section-header';
import Image from 'next/image';
import chinaMeeting from '@/public/china-meeting.jpeg';
import { motion } from 'framer-motion';

function InternationalPartnerships() {
  return (
    <motion.section
      className="my-16 md:my-24 lg:my-32"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.6 }}>
      <Container>
        <div className="hidden md:block">
          <SectionHeader highlightedWord={'Partnerships'}>
            International Partnerships
          </SectionHeader>
        </div>
        <div className="block md:hidden">
          <SectionHeader size="md" highlightedWord={'Partnerships'}>
            International Partnerships
          </SectionHeader>
        </div>

        <p className="mt-3.5 text-lg font-light w-full lg:w-2/3 mb-12">
          Building strong relationships with factory owners and
          government representatives in China is crucial to our
          success. These partnerships enable us to provide our clients
          with the best quality products and reliable shipping
          solutions.
        </p>

        <div className="mt-12 md:mt-16">
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00254F] to-[#00365D] transform rotate-3 rounded-2xl shadow-xl"></div>
            <div className="relative z-10 overflow-hidden rounded-2xl border-4 border-white shadow-lg">
              <Image
                src={chinaMeeting}
                alt="Godday with Chinese factory owners and state representatives"
                width={800}
                height={500}
                className="w-full h-[250px] md:h-[500px] object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </Container>
    </motion.section>
  );
}

export default InternationalPartnerships;
