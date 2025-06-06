'use client';
import Container from '../shared/container';
import SectionHeader from '../shared/section-header';
import Image from 'next/image';
import CMOImage from '@/public/yeboah.jpeg';
import { motion } from 'framer-motion';

function CMO() {
  return (
    <motion.section
      className="py-12 md:py-20"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.4 }}>
      <Container>
        <div className="hidden md:block">
          <SectionHeader highlightedWord={'CMO'}>
            Meet Our CMO
          </SectionHeader>
        </div>
        <div className="block md:hidden">
          <SectionHeader size="md" highlightedWord={'CMO'}>
            Meet Our CMO
          </SectionHeader>
        </div>

        <div className="mt-12 md:mt-16 flex flex-col md:flex-row items-center gap-12 md:gap-16">
          {/* CMO Image with stylish frame */}
          <div className="w-full md:w-2/5 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00254F] to-[#00365D] transform rotate-3 rounded-2xl shadow-xl"></div>
            <div className="relative z-10 overflow-hidden rounded-2xl border-4 border-white shadow-lg">
              <Image
                src={CMOImage}
                alt="Chief Marketing Officer"
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
                YEBOAH AMIN MOHAMMED
              </h3>
              <p className="text-xl text-gray-500 font-medium mt-2">
                Chief Marketing Officer
              </p>
            </div>
            <div className="w-20 h-1.5 bg-primary rounded-full"></div>
            <p className="text-gray-700 leading-relaxed">
              As Chief Marketing Officer, Yeboah Amin Mohammed leads
              our marketing strategy and brand vision. His expertise
              in digital marketing and customer engagement has been
              instrumental in expanding our reach and building strong
              relationships with our clients.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Yeboah is passionate about connecting businesses with
              innovative solutions and driving growth through creative
              campaigns and strategic partnerships. His leadership
              ensures our message resonates across all channels and
              markets.
            </p>
          </div>
        </div>
      </Container>
    </motion.section>
  );
}

export default CMO;
