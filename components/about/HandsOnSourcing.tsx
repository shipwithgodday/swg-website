'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';
import SectionHeader from '../shared/section-header';
import img1 from '@/public/sourcing/1.jpeg';
import img2 from '@/public/sourcing/2.jpeg';
import Container from '../shared/container';

export default function HandsOnSourcing() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="my-12 md:my-20 bg-white">
      <Container>
        <div className="container mx-auto px-4">
          <SectionHeader highlightedWord="Hands-On approach">
            Our Hands-On Approach to Sourcing
          </SectionHeader>
          <p className="mt-3.5 text-lg font-light w-full lg:w-2/3 mb-12">
            We personally visit and verify each manufacturer to ensure
            the highest quality standards and build lasting
            relationships with our partners.
          </p>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* First Image */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#00254F] to-[#00365D] transform rotate-3 rounded-2xl shadow-xl"></div>
              <div className="relative z-10 overflow-hidden rounded-2xl border-4 border-white shadow-lg">
                <Image
                  src={img1}
                  alt="Godday inspecting products at a Chinese supplier"
                  width={600}
                  height={400}
                  className="w-full h-[250px] md:h-[400px] object-cover object-top"
                  priority
                />
              </div>
            </div>

            {/* Second Image */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#00254F] to-[#00365D] transform rotate-3 rounded-2xl shadow-xl"></div>
              <div className="relative z-10 overflow-hidden rounded-2xl border-4 border-white shadow-lg">
                <Image
                  src={img2}
                  alt="Quality control process at our partner factory"
                  width={600}
                  height={400}
                  className="w-full h-[250px] md:h-[400px] object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </motion.section>
  );
}
