'use client';
import Container from '../shared/container';
import SectionHeader from '../shared/section-header';
import Image from 'next/image';
import img1 from '@/public/ghana-team1.jpeg';
import img2 from '@/public/ghana-team2.jpeg';
import { motion } from 'framer-motion';

function GhanaTeam() {
  return (
    <motion.section
      className="py-12 md:py-20"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.5 }}>
      <Container>
        <div className="hidden md:block">
          <SectionHeader highlightedWord={'Team'}>
            Godday with his Ghana warehouse Team
          </SectionHeader>
        </div>
        <div className="block md:hidden">
          <SectionHeader size="md" highlightedWord={'Team'}>
            Godday with his Ghana warehouse Team
          </SectionHeader>
        </div>

        <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* First Image */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00254F] to-[#00365D] transform rotate-3 rounded-2xl shadow-xl"></div>
            <div className="relative z-10 overflow-hidden rounded-2xl border-4 border-white shadow-lg">
              <Image
                src={img1}
                alt="Godday with Ghana warehouse team"
                width={600}
                height={400}
                className="w-full h-[250px] md:h-[400px] object-cover"
                priority
              />
            </div>
          </div>

          {/* Second Image */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00254F] to-[#00365D] transform -rotate-3 rounded-2xl shadow-xl"></div>
            <div className="relative z-10 overflow-hidden rounded-2xl border-4 border-white shadow-lg">
              <Image
                src={img2}
                alt="Godday with Ghana warehouse team"
                width={600}
                height={400}
                className="w-full h-[250px] md:h-[400px] object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </Container>
    </motion.section>
  );
}

export default GhanaTeam;
