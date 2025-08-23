'use client';
import Container from '../shared/container';
import SectionHeader from '../shared/section-header';
import Image from 'next/image';
import HIRImage from '@/public/hir.jpeg';
import { motion } from 'framer-motion';

function HIR() {
  return (
    <motion.section
      className="py-12 md:py-20"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.4 }}>
      <Container>
        <div className="hidden md:block">
          <SectionHeader highlightedWord={'HIR'}>
            Meet Our Head of International Relations
          </SectionHeader>
        </div>
        <div className="block md:hidden">
          <SectionHeader size="md" highlightedWord={'HIR'}>
            Meet Our Head of International Relations
          </SectionHeader>
        </div>

        <div className="mt-12 md:mt-16 flex flex-col md:flex-row items-center gap-12 md:gap-16">
          {/* CMO Image with stylish frame */}
          <div className="w-full md:w-2/5 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00254F] to-[#00365D] transform rotate-3 rounded-2xl shadow-xl"></div>
            <div className="relative z-10 overflow-hidden rounded-2xl border-4 border-white shadow-lg">
              <Image
                src={HIRImage}
                alt="Head of International Relations"
                className="w-full h-[400px] md:h-[500px] object-cover object-top"
                priority
              />
            </div>
            <div className="hidden md:block absolute -bottom-6 -right-6 w-24 h-24 bg-primary rounded-full z-0"></div>
          </div>

          {/* CMO Information */}
          <div className="w-full md:w-3/5 space-y-6">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold ">
                Ewedanu Grace Selase Abra
              </h3>
              <p className="text-xl text-gray-500 font-medium mt-2">
                Head of International Relations
              </p>
            </div>
            <div className="w-20 h-1.5 bg-primary rounded-full"></div>
            <p className="text-gray-700 leading-relaxed">
              As Head of International Relations, Ewedanu Grace Selase
              Abra builds and sustains high-trust partnerships between
              us and our Chinese partners. She aligns suppliers,
              logistics providers, and financial institutions to
              deliver reliable, compliant, and cost-effective trade
              outcomes for our customers.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Miss Grace is fluent in both Mandarin Chinese and
              English, and this positions her as the strategic force
              behind Ship with Godday&apos;s global footprint. As the
              Head of International Relations, Grace charts the course
              for our international strategy, ensuring smooth passage
              for every container and parcel we ship.
            </p>
          </div>
        </div>
      </Container>
    </motion.section>
  );
}

export default HIR;
