'use client';
import React, { useState } from 'react';
import Container from '../shared/container';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className="border-b border-gray-200 last:border-b-0"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="py-5 w-full flex justify-between items-center text-left focus:outline-none group">
        <h3 className="text-xl font-medium group-hover:text-primary transition-colors">
          {question}
        </h3>
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 group-hover:bg-primary/10 transition-colors">
          {isOpen ? (
            <Minus className="w-4 h-4 text-primary" />
          ) : (
            <Plus className="w-4 h-4 text-primary" />
          )}
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden">
            <p className="pb-5 text-gray-600">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const faqData: FAQItemProps[] = [
  {
    question: 'What services does Godday offer?',
    answer:
      'Godday provides comprehensive shipping and logistics solutions including freight forwarding, customs clearance, warehousing, and specialized industry solutions tailored to various sectors.',
  },
  {
    question: 'How can I track my shipment?',
    answer:
      'You can track your shipment by using our online tracking portal or by contacting our customer service team with your tracking number for real-time updates on your cargo.',
  },
  {
    question: 'Do you handle international shipping?',
    answer:
      'Yes, we handle international shipping to and from various destinations worldwide. Our global network allows us to provide reliable and efficient shipping services across continents.',
  },
  {
    question: 'What are your business hours?',
    answer:
      'Our main office is open Monday through Friday from 8:00 AM to 5:00 PM. We also offer 24/7 customer support for urgent shipping needs and emergencies.',
  },
  {
    question: 'How do I request a shipping quote?',
    answer:
      'You can request a shipping quote by filling out our contact form, calling our office directly, or emailing our sales team. Please provide details about your shipment for an accurate quote.',
  },
];

function ContactFAQ() {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <Container>
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about our services,
            shipping processes, and more.
          </p>
        </motion.div>

        <motion.div
          className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-6 md:p-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}>
          {faqData.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
            />
          ))}
        </motion.div>

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}>
          <p className="text-gray-600">
            Still have questions?{' '}
            <a
              href="#contact-form"
              className="text-primary font-medium hover:underline">
              Contact us directly
            </a>
          </p>
        </motion.div>
      </Container>
    </section>
  );
}

export default ContactFAQ;
