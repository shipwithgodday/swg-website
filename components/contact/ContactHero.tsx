'use client';
import Image from 'next/image';
import Container from '../shared/container';
import SectionHeader from '../shared/section-header';
import { motion } from 'framer-motion';
import img from '@/public/LooperGroup.svg';
function ContactHero() {
  return (
    <section className="bg-gradient-to-r from-[#00254F] to-[#00365D] text-white py-8 md:py-16 relative overflow-hidden">
      <Container className="mx-auto px-4 md:px-6 mt-20 md:pt-40 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-20">
          <div className="w-full md:w-4/5">
            <motion.span
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="px-3 py-1.5 md:px-5 md:py-2 rounded-l-full text-black bg-primary uppercase text-xs md:text-sm inline-block">
              #shipwithgodday
            </motion.span>

            <div className="mt-3 md:mt-4 w-full xl:w-4/5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="hidden md:block">
                <SectionHeader>
                  Get in Touch With Our Team
                </SectionHeader>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="block md:hidden">
                <SectionHeader size="md">
                  Get in Touch With Our Team
                </SectionHeader>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-primary text-base md:text-lg italic mt-3">
                We&apos;re here to answer your questions and provide
                the assistance you need
              </motion.p>
            </div>
          </div>
        </motion.div>
      </Container>

      <div className="absolute top-0 bottom-0 right-0 h-full w-full">
        <div className="relative h-full w-full">
          <Image
            src={img}
            alt="svg"
            className="h-full w-full object-cover lg:object-contain object-right opacity-70 lg:opacity-100 transition-all duration-300"
            priority
          />
        </div>
      </div>

      {/* Animated dots grid */}
      {/* <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute inset-0 grid grid-cols-12 gap-4">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="relative">
              <div
                className="w-1 h-1 bg-white rounded-full absolute"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animation: `pulse ${2 + Math.random() * 3}s infinite ${Math.random() * 2}s`,
                }}></div>
            </div>
          ))}
        </div>
      </div> */}

      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(2);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 0.3;
          }
        }
      `}</style>
    </section>
  );
}

export default ContactHero;
