'use client';
import Container from '../shared/container';
import SectionHeader from '../shared/section-header';
import Form from './Form';
import Info from './Info';
import { motion } from 'framer-motion';
function ContactSection() {
  return (
    <section className="my-20 relative">
      {/* Background decorative element */}
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 max-w-2xl">
          <SectionHeader size="base" highlightedWord="Help You">
            How Can We Help You?
          </SectionHeader>
          <p className="text-gray-600">
            We&apos;d love to hear from you. Please fill out the form
            below or use our contact information to get in touch.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col lg:flex-row items-stretch gap-8 lg:gap-12 xl:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:w-1/2">
            <Form />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:w-1/2">
            <Info />
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

export default ContactSection;
