'use client';
import { motion } from 'framer-motion';
import Container from '../shared/container';
import { Icon } from '../ui/icon';

export default function WeeklyContainerBanner() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-r from-[#00254F] to-[#00365D] text-white py-8 md:py-12 relative overflow-hidden">
      <Container>
        <div className="flex items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Icon
                name="Ship"
                className="w-8 h-8 text-primary hidden md:block"
              />
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                Weekly Containers From China to Ghana
              </h2>
              <Icon
                name="Ship"
                className="w-8 h-8 text-primary hidden md:block"
              />
            </div>
            <p className="text-lg md:text-xl font-semibold text-primary">
              We load containers{' '}
              <span className="text-white">EVERY WEEK</span> from our
              China warehouse
            </p>
          </motion.div>
        </div>
      </Container>
    </motion.section>
  );
}
