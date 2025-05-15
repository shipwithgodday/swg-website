import React from 'react';
import Container from '../shared/container';
import SectionHeader from '../shared/section-header';
function WhyUs() {
  return (
    <section className="bg-gray-50 py-8 md:py-16">
      <Container>
        <div className="hidden md:block">
          <SectionHeader highlightedWord={'Us'}>Why Us</SectionHeader>
        </div>
        <div className="block md:hidden">
          <SectionHeader size="md" highlightedWord={'Us'}>
            Why Us
          </SectionHeader>
        </div>
        <div className="grid md:grid-cols-2 gap-8 mt-8 md:mt-12">
          {[
            {
              title: 'Local Insight, Global Reach',
              description:
                'We combine deep understanding of Ghanaian retail needs with expertise in Chinese manufacturing. Our bilingual teams ensure seamless communication across borders.',
            },
            {
              title: 'End-to-End Services',
              description:
                'Full service from product sourcing to last-mile delivery with transparent CBM-based pricing and no hidden fees.',
            },
            {
              title: 'Quality Assurance',
              description:
                'Rigorous supplier verification and product inspection process before shipping.',
            },
            {
              title: 'Growth Focused',
              description:
                'Client-centric approach where your business growth equals our success.',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white p-8 rounded-2xl shadow-sm">
              <h3 className="text-2xl font-bold text-[#00254F] mb-4">
                {item.title}
              </h3>
              <p className="text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

export default WhyUs;
