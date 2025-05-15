'use client';
import Container from '@/components/shared/container';
import SectionHeader from '@/components/shared/section-header';
import { motion, useInView } from 'framer-motion';
import React, { useRef } from 'react';

function Services() {
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, {
    once: true,
    amount: 0.3,
  });

  const descriptionRef = useRef(null);
  const isDescriptionInView = useInView(descriptionRef, {
    once: true,
    amount: 0.3,
  });

  const servicesRef = useRef(null);
  const isServicesInView = useInView(servicesRef, {
    once: true,
    amount: 0.1,
  });

  return (
    <section className="my-16 md:my-24 lg:my-32">
      <Container>
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={
            isHeaderInView
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 20 }
          }
          transition={{ duration: 0.6 }}>
          <SectionHeader highlightedWord={'Services'}>
            Our Services
          </SectionHeader>
        </motion.div>

        <motion.p
          ref={descriptionRef}
          initial={{ opacity: 0, y: 20 }}
          animate={
            isDescriptionInView
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 20 }
          }
          transition={{ duration: 0.6 }}
          className="mt-3.5 text-lg font-light w-full lg:w-2/3 mb-12">
          We always put our customers first, ensuring your needs are
          met from the very beginning of our process till you have
          your desired goods in hand.
        </motion.p>

        <motion.div
          ref={servicesRef}
          initial={{ opacity: 0 }}
          animate={isServicesInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, staggerChildren: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={
              isServicesInView ? { opacity: 1 } : { opacity: 0 }
            }
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{
              backgroundImage: 'url(/procurement.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'right',
            }}
            className="h-64 sm:h-72 md:h-80 lg:h-96 rounded-2xl flex items-end pb-4 sm:pb-5 lg:pb-6 px-4 sm:px-6 lg:px-8 cursor-pointer hover:scale-105 transition-all duration-300">
            <span className="text-white text-2xl sm:text-3xl lg:text-4xl uppercase font-medium">
              Procurement services
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={
              isServicesInView ? { opacity: 1 } : { opacity: 0 }
            }
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              backgroundImage: 'url(/shipping.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            className="h-64 sm:h-72 md:h-80 lg:h-96 rounded-2xl flex items-end pb-4 sm:pb-5 lg:pb-6 px-4 sm:px-6 lg:px-8 cursor-pointer hover:scale-105 transition-all duration-300 col-span-1 md:col-span-2">
            <span className="text-white text-2xl sm:text-3xl lg:text-4xl uppercase font-medium">
              Shipping solutions
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={
              isServicesInView
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 30 }
            }
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{
              backgroundImage: 'url(/alipay.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'bottom',
            }}
            className="h-64 sm:h-72 md:h-80 lg:h-96 rounded-2xl flex items-end pb-4 sm:pb-5 lg:pb-6 px-4 sm:px-6 lg:px-8 cursor-pointer hover:scale-105 transition-all duration-300 col-span-1 md:col-span-3">
            <span className="text-white text-2xl sm:text-3xl lg:text-4xl uppercase font-medium">
              payment facilitation
            </span>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

export default Services;
