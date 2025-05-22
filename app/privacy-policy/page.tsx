'use client';
import Image from 'next/image';
import img from '@/public/LooperGroup.svg';
import SectionHeader from '@/components/shared/section-header';
import Container from '@/components/shared/container';
import { motion } from 'framer-motion';

function PrivacyPolicy() {
  return (
    <main>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#00254F] to-[#00365D] text-white py-8 md:py-16 relative overflow-hidden">
        <Container className="mx-auto px-4 md:px-6 mt-20 md:pt-40">
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
                className="px-3 py-1.5 md:px-5 md:py-2 rounded-l-full text-black bg-primary uppercase text-xs md:text-sm">
                #shipwithgodday
              </motion.span>

              <div className="mt-3 md:mt-4 w-full xl:w-4/5">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="hidden md:block">
                  <SectionHeader>Privacy Policy</SectionHeader>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="block md:hidden">
                  <SectionHeader size="md">
                    Privacy Policy
                  </SectionHeader>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-primary text-base md:text-lg italic mt-3">
                  Your privacy is our priority
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
      </section>

      {/* Content Section */}
      <section className="py-12 md:py-24">
        <Container>
          <div className="bg-white shadow-xl rounded-2xl p-8 md:p-12 border border-gray-100">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-3xl font-bold">Introduction</h2>
              <p className="mt-5">
                At Lucky Godday Business Services (&quot;we&quot;,
                &quot;our&quot;, or &quot;us&quot;), we take your
                privacy seriously. This Privacy Policy explains how we
                collect and use the limited information you provide
                when using our website.
              </p>

              <h2 className="text-3xl font-bold mt-5">
                Information We Collect
              </h2>
              <p className="my-1">
                We only collect information that you voluntarily
                provide to us in two specific cases:
              </p>
              <ul className="list-disc list-inside mt-2">
                <li>
                  <strong>Schedule Page Information:</strong>
                  <ul className="list-disc list-inside mt-2">
                    <li>Name</li>
                    <li>Email address</li>
                    <li>Phone number</li>
                    <li>
                      Any additional information you choose to provide
                      in your message
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Email Signup Information:</strong>
                  <ul className="list-disc list-inside mt-2">
                    <li>Full name</li>
                    <li>Email address</li>
                    <li>Phone number</li>
                  </ul>
                </li>
              </ul>

              <h2 className="text-3xl font-bold mt-5">
                How We Use Your Information
              </h2>
              <p className="my-1">
                We use your information solely for the following
                purposes:
              </p>
              <ul className="list-disc list-inside mt-2">
                <li>
                  To respond to your schedule requests and inquiries
                </li>
                <li>
                  To send you email updates and communications that
                  you have signed up to receive
                </li>
                <li>To provide customer support when needed</li>
              </ul>

              <h2 className="text-3xl font-bold mt-5">
                Information Sharing
              </h2>
              <p className="my-1">
                We do not share your personal information with any
                third parties except when required by law or to
                protect our rights.
              </p>

              <h2 className="text-3xl font-bold mt-5">
                Data Security
              </h2>
              <p className="my-1">
                We implement appropriate security measures to protect
                your information:
              </p>
              <ul className="list-disc list-inside mt-2">
                <li>Secure storage of your information</li>
                <li>Limited access to your data</li>
                <li>Regular security assessments</li>
              </ul>

              <h2 className="text-3xl font-bold mt-5">Your Rights</h2>
              <p className="my-1">
                You have the following rights regarding your personal
                information:
              </p>
              <ul className="list-disc list-inside mt-2">
                <li>Access your personal data</li>
                <li>Request deletion of your data</li>
                <li>Opt out of email communications at any time</li>
              </ul>

              <h2 className="text-3xl font-bold mt-5">
                Changes to This Policy
              </h2>
              <p className="my-1">
                We may update this Privacy Policy from time to time.
                We will notify you of any changes by posting the new
                policy on this page and updating the &quot;Last
                Updated&quot; date.
              </p>

              <h2 className="text-3xl font-bold mt-5">Contact Us</h2>
              <p className="my-1">
                If you have any questions about this Privacy Policy or
                our data practices, please contact us at:
              </p>
              <ul className="list-disc list-inside mt-2">
                <li>Email: shipwithgodday@gmail.com</li>
              </ul>

              <p className="text-sm text-gray-500 mt-8">
                Last Updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

export default PrivacyPolicy;
