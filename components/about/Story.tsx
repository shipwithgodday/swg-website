'use client';
import React from 'react';
import Container from '../shared/container';
import SectionHeader from '../shared/section-header';
import { motion } from 'framer-motion';

function Story() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}>
      <Container>
        <div className="hidden md:block">
          <SectionHeader highlightedWord={'Story'}>
            Our Story
          </SectionHeader>
        </div>
        <div className="block md:hidden">
          <SectionHeader size="md" highlightedWord={'Story'}>
            Our Story
          </SectionHeader>
        </div>
        <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100 mt-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4 text-gray-600">
              <p>
                Founded in 2023, our company was created to bridge the
                gap between Ghanaian retailers and Chinese
                manufacturers. With firsthand insight into the
                challenges of sourcing quality products from abroad,
                we built a business that removes the guesswork from
                procurement, logistics, and payments.
              </p>
              <div className="bg-blue-50 p-6 rounded-xl">
                <h3 className="text-xl font-bold text-[#00254F] mb-2">
                  Our Mission
                </h3>
                <p>
                  Make international trade accessible and transparent
                  for Ghanaian entrepreneurs.
                </p>
              </div>
            </div>
            <div className="space-y-4 text-gray-600">
              <div className="bg-primary/10 p-6 rounded-xl">
                <h3 className="text-xl font-bold text-[#00254F] mb-2">
                  Our Vision
                </h3>
                <p>
                  Empower every local shop owner with the tools to
                  compete globally.
                </p>
              </div>
              <p>
                From Makola through Kantamanto to Abossey Okai,
                we&apos;re powering local commerce through global
                logistics. Our cross-border operations with teams in
                both China and Ghana ensure seamless end-to-end
                service.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </motion.div>
  );
}

export default Story;
