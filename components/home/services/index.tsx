'use client';
import Container from '@/components/shared/container';
import SectionHeader from '@/components/shared/section-header';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import React, { useRef, ReactNode } from 'react';

interface AnimatedSectionProps {
  children: ReactNode;
  ref: React.RefObject<HTMLDivElement | null>;
  inView: boolean;
  delay?: number;
}

const AnimatedSection = ({
  children,
  ref,
  inView,
  delay = 0,
}: AnimatedSectionProps) => (
  <motion.div
    ref={ref}
    initial={{ opacity: 0, y: 20 }}
    animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
    transition={{ duration: 0.6, delay }}>
    {children}
  </motion.div>
);

interface ServiceCardProps {
  image: string;
  title: string;
  delay: number;
  className?: string;
  url: string;
}

const ServiceCard = ({
  image,
  title,
  delay,
  className = '',
  url,
}: ServiceCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <Link href={url}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6, delay }}
        style={{
          backgroundImage: `url(${image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        className={`h-64 sm:h-72 md:h-80 lg:h-96 rounded-2xl flex items-end pb-4 sm:pb-5 lg:pb-6 px-4 sm:px-6 lg:px-8 cursor-pointer hover:scale-105 transition-all duration-300 w-full ${className}`}>
        <span className="text-white text-2xl sm:text-3xl lg:text-4xl uppercase font-medium">
          {title}
        </span>
      </motion.div>
    </Link>
  );
};

function Services({ id }: { id: string }) {
  const headerRef = useRef<HTMLDivElement>(null);
  const isHeaderInView = useInView(headerRef, {
    once: true,
    amount: 0.3,
  });

  const descriptionRef = useRef<HTMLDivElement>(null);
  const isDescriptionInView = useInView(descriptionRef, {
    once: true,
    amount: 0.3,
  });

  return (
    <section id={id} className="py-16 md:py-24 lg:py-32">
      <Container>
        <AnimatedSection ref={headerRef} inView={isHeaderInView}>
          <SectionHeader highlightedWord={'Services'}>
            Our Services
          </SectionHeader>
        </AnimatedSection>

        <AnimatedSection
          ref={descriptionRef}
          inView={isDescriptionInView}>
          <p className="mt-3.5 text-lg font-light w-full lg:w-2/3 mb-12">
            We always put our customers first, ensuring your needs are
            met from the very beginning of our process till you have
            your desired goods in hand.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <ServiceCard
            image="/procurement.jpg"
            title="Procurement services"
            delay={0.1}
            url="/procurement"
          />
          <div className="md:col-span-2">
            <ServiceCard
              image="/shipping.png"
              title="Shipping solutions"
              delay={0.2}
              className="md:col-span-2"
              url="/shipping"
            />
          </div>
          <div className="md:col-span-3">
            <ServiceCard
              image="/alipay.jpg"
              title="payment facilitation"
              delay={0.3}
              url="/payment"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}

export default Services;
