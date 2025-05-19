'use client';
import { motion } from 'framer-motion';
import React from 'react';
import BookingForm from './BookingWizard';
import { BookingProvider } from '@/lib/booking-context';

function SchedulePage() {
  return (
    <motion.div
      className="w-full max-w-4xl mx-auto p-4 font-body z-10"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}>
      <BookingProvider>
        <BookingForm />
      </BookingProvider>
    </motion.div>
  );
}

export default SchedulePage;
