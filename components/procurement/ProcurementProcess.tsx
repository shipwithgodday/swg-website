'use client';
import Container from '../shared/container';
import SectionHeader from '../shared/section-header';
import Image from 'next/image';
import ProcurementStepCard from './ProcurementStepCard';
import img1 from '@/public/sourcing/1.jpeg';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

function ProcurementProcess() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const WHATSAPP_NUMBER = '0544074578';
  const steps = [
    {
      icon: (
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
          />
        </svg>
      ),
      title: 'Find Your Product',
      text: 'Get a picture from the internet of the item/product you want to purchase.',
      color: 'bg-gradient-to-r from-[#00254F] to-[#00365D]',
    },
    {
      icon: (
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
          />
        </svg>
      ),
      title: 'Send via WhatsApp',
      text: (
        <span>
          Send that picture/screenshot to us on our WhatsApp number
          <span className="font-bold text-emerald-400 ml-1 block sm:inline">
            {WHATSAPP_NUMBER}
          </span>
        </span>
      ),
      color: 'bg-gradient-to-r from-[#00254F] to-[#00365D]',
      hasButton: true,
    },
    {
      icon: (
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      ),
      title: 'We Source It',
      text: `We'll source it out for you and handle all the procurement details.`,
      color: 'bg-gradient-to-r from-[#00254F] to-[#00365D]',
    },
  ];

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={
        isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }
      }
      transition={{ duration: 0.6, ease: 'easeOut' }}>
      <Container>
        <div>
          <div className="hidden md:block">
            <SectionHeader size="md" highlightedWord="Process">
              Our Procurement Process
            </SectionHeader>
          </div>
          <div className="block md:hidden">
            <SectionHeader size="sm" highlightedWord="Process">
              Our Procurement Process
            </SectionHeader>
          </div>
          <p className="text-gray-600 text-lg w-1/2">
            Getting the products you need has never been easier.
            Follow our streamlined 3-step process.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 mt-12">
          {/* Steps Card */}
          <div className="w-full lg:w-3/5">
            <div className="backdrop-blur-xl rounded-3xl ">
              <ol className="space-y-8">
                {steps.map((step, idx) => (
                  <ProcurementStepCard
                    key={idx}
                    icon={step.icon}
                    title={step.title}
                    text={step.text}
                    color={step.color}
                    hasButton={step.hasButton}
                    idx={idx}
                    isLast={idx === steps.length - 1}
                  />
                ))}
              </ol>
            </div>
          </div>

          {/* Image Section */}
          <div className="w-full lg:w-2/5">
            <div className="rounded-2xl overflow-hidden">
              <Image
                src={img1}
                alt="Sample product procurement showcase"
                width={500}
                height={500}
                className="object-cover w-full h-full"
                priority
              />
            </div>
          </div>
        </div>
      </Container>
    </motion.section>
  );
}

export default ProcurementProcess;
