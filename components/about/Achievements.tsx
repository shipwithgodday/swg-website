'use client';
import Container from '../shared/container';
import { Globe, Package, Users, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

function Achievements() {
  return (
    <motion.section
      aria-label="Company Achievements"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2 }}>
      <Container>
        <div className="grid md:grid-cols-4 gap-6 text-center">
          {[
            {
              icon: Users,
              title: '400+ Customers',
              desc: 'Served and growing',
            },
            {
              icon: Package,
              title: 'Weekly Shipments',
              desc: 'From China warehouse',
            },
            {
              icon: Globe,
              title: '2 Countries',
              desc: 'Cross-border operations',
            },
            {
              icon: ShieldCheck,
              title: 'Trusted',
              desc: 'By Kantamanto, Makola & Abossey Okai',
            },
          ].map((item, i) => (
            <article
              key={i}
              className="bg-gradient-to-r from-[#00254F] to-[#00365D] p-6 rounded-xl shadow-lg border">
              <item.icon
                className="w-12 h-12 text-primary mx-auto mb-4"
                aria-hidden="true"
              />
              <h3 className="text-2xl font-bold text-white">
                {item.title}
              </h3>
              <p className="text-gray-400">{item.desc}</p>
            </article>
          ))}
        </div>
      </Container>
    </motion.section>
  );
}

export default Achievements;
