'use client';
import Image from 'next/image';
import img from '@/public/LooperGroup.svg';
import SectionHeader from '@/components/shared/section-header';
import Container from '@/components/shared/container';
import { motion } from 'framer-motion';

function TermsAndConditions() {
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
                  <SectionHeader>Terms & Conditions</SectionHeader>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="block md:hidden">
                  <SectionHeader size="md">
                    Terms & Conditions
                  </SectionHeader>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-primary text-base md:text-lg italic mt-3">
                  Please read our terms and conditions carefully
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
              <h2 className="text-3xl font-bold">
                Acceptance of Terms
              </h2>
              <p className="mt-5">
                By using Lucky Godday Business service procurement and
                shipping services, you agree to comply with these
                Terms and Conditions (T&Cs). If you disagree, kindly
                refrain from using our services.
              </p>

              <h2 className="text-3xl font-bold mt-5">
                Services Offered
              </h2>
              <p className="my-1 text-lg italic">We specialize in:</p>
              <ul className="list-disc list-inside">
                <li>
                  Pre-order procurement - sourcing goods from China
                  per customer request
                </li>
                <li>
                  Shipping & logistics - Maersk Line and PIL vessels
                  from China to Ghana
                </li>
                <li>
                  Warehouse storage - Ghana before final delivery
                </li>
              </ul>
              <p>We do not engage in direct retail sales</p>

              <h2 className="text-3xl font-bold mt-5">
                Order & Payment Terms
              </h2>
              <h3 className="text-lg my-1 italic">
                Payment Methods Accepted
              </h3>
              <ul className="list-disc list-inside mt-2">
                <li>Bank transfers</li>
                <li>Cash payments (in designated locations)</li>
                <li>Mobile money (MTN, Telecel, AirtelTigo, etc.)</li>
              </ul>

              <p className="mt-5">
                <strong>Order Confirmation:</strong> Payment confirms
                procurement request.
              </p>

              <h3 className="text-lg mt-5 italic">
                Currency & Pricing:
              </h3>
              <p className="my-1">
                Prices are subject to change due to fluctuations in
                Chinese Yuan (CNY), Ghana Cedi (GHS), and US Dollar
                (USD). Final costs will be communicated before
                procurements.
              </p>

              <h2 className="text-3xl font-bold mt-5">
                Shipping & Delivery
              </h2>
              <ul className="list-disc list-inside mt-2">
                <li>
                  <strong>Shipping Partners:</strong> Maersk Line &
                  PIL vessels
                </li>
                <li>
                  <strong>Shipping Fees:</strong> Paid after goods
                  arrive at our Ghana warehouse unless agreed
                  otherwise
                </li>
                <li>
                  <strong>Delivery Timeline:</strong> Estimated based
                  on vessel schedules; delays due to customs, weather,
                  or port congestion are not our liability
                </li>
                <li>
                  <strong>Customs & Duties:</strong> Buyer is
                  responsible for any Ghanaian import duties/taxes
                </li>
              </ul>

              <h2 className="text-3xl font-bold mt-5">
                Returns & Refunds
              </h2>
              <h3 className="text-lg my-1 italic">
                Procured Items (Sourced by Us):
              </h3>
              <ul className="list-disc list-inside mt-2">
                <li>72-hour return window after receipt</li>
                <li>Items must be unused, in original packaging</li>
                <li>
                  Refunds processed within 7–14 business days minus
                  shipping/fees
                </li>
              </ul>

              <h3 className="text-lg mt-5 italic">
                Self-Purchased Goods (Bought by Customer):
              </h3>
              <ul className="list-disc list-inside mt-2">
                <li>Non-returnable</li>
                <li>No returns for perishable/custom-made items</li>
                <li>
                  No returns for incorrect orders due to
                  buyer-provided specifications
                </li>
              </ul>

              <h2 className="text-3xl font-bold mt-5">
                Liability & Disclaimers
              </h2>
              <p className="my-1">We are not liable for:</p>
              <ul className="list-disc list-inside mt-2">
                <li>
                  Shipping delays (port strikes, customs holdups)
                </li>
                <li>Damages from improper packaging by suppliers</li>
                <li>Currency exchange losses</li>
                <li>
                  Goods are shipped &quot;as-is&quot; - inspect upon
                  delivery.
                </li>
              </ul>

              <h2 className="text-3xl font-bold mt-5">
                Force Majeure
              </h2>
              <p className="my-1">
                We are not responsible for disruptions caused by:
              </p>
              <ul className="list-disc list-inside mt-2">
                <li>Wars, natural disasters, pandemics</li>
                <li>Government import/export restrictions</li>
              </ul>

              <h2 className="text-3xl font-bold mt-5">
                Governing Law & Disputes
              </h2>
              <ul className="list-disc list-inside mt-2">
                <li>Governed by Ghanaian law</li>
                <li>
                  Disputes resolved via negotiation, or Accra courts
                </li>
              </ul>

              <h2 className="text-3xl font-bold mt-5">
                Changes to Terms
              </h2>
              <p className="my-1">
                We may update these T&Cs; changes take effect upon
                posting on our website.
              </p>

              <h2 className="text-3xl font-bold mt-5">
                Data Privacy
              </h2>
              <h3 className="text-lg my-1 italic">
                Information Collected:
              </h3>
              <ul className="list-disc list-inside mt-2">
                <li>
                  Personal data (name, contact, email, address,
                  payment details)
                </li>
                <li>
                  Order history, transaction records, and shipping
                  details
                </li>
              </ul>

              <h3 className="text-lg mt-2 italic">How We Use Data</h3>
              <ul className="list-disc list-inside mt-2">
                <li>
                  To process orders, arrange shipping, and manage
                  returns
                </li>
                <li>For customer support and fraud prevention</li>
                <li>To comply with legal/regulatory requirements</li>
              </ul>

              <h3 className="text-lg mt-2 italic">
                Data Protection:
              </h3>
              <ul className="list-disc list-inside mt-2">
                <li>
                  We implement security measures (encryption, secure
                  servers)
                </li>
                <li>No sale of data to third parties</li>
                <li>
                  Data shared only with &quot;necessary parties&quot;
                  (shipping carriers, payment processors)
                </li>
              </ul>

              <h3 className="text-lg mt-2 italic">
                Customer Rights:
              </h3>
              <ul className="list-disc list-inside mt-2">
                <li>
                  Request access, correction, or deletion of your data
                </li>
                <li>Opt out of marketing communications</li>
                <li>
                  Contact us at shipwithgodday@gmail.com for privacy
                  requests
                </li>
              </ul>

              <h2 className="text-3xl font-bold mt-5">
                Key Notes for Customers:
              </h2>
              <ul className="list-disc list-inside mt-2">
                <li>
                  Payment = Order confirmation: ensure accuracy before
                  paying
                </li>
                <li>
                  Shipping fees paid after Ghana arrival (no upfront
                  charges)
                </li>
                <li>72-hour return window for procured items only</li>
                <li>Self-bought goods cannot be returned</li>
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

export default TermsAndConditions;
