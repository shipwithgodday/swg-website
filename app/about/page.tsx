'use client';
import AboutHero from '@/components/about/Hero';
import Story from '@/components/about/Story';
import Achievements from '@/components/about/Achievements';
import WhyUs from '@/components/about/WhyUs';
import CEO from '@/components/about/CEO';
import { motion } from 'framer-motion';

export default function About() {
  return (
    <main className="">
      {/* Hero Section */}
      <AboutHero />

      <section className="py-12 md:py-24 space-y-8 md:space-y-16">
        {/* Our Story */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}>
          <Story />
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}>
          <Achievements />
        </motion.div>
      </section>

      {/* Why Choose Us */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}>
        <WhyUs />
      </motion.div>

      {/* Meet the Teams */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}>
        <CEO />
      </motion.div>
    </main>
  );
}
