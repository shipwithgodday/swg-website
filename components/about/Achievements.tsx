import React from 'react';
import Container from '../shared/container';
import { Globe, Package, Users, ShieldCheck } from 'lucide-react';

function Achievements() {
  return (
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
          <div
            key={i}
            className="bg-gradient-to-r from-[#00254F] to-[#00365D] p-6 rounded-xl shadow-lg border">
            <item.icon className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white">
              {item.title}
            </h3>
            <p className="text-gray-400">{item.desc}</p>
          </div>
        ))}
      </div>
    </Container>
  );
}

export default Achievements;
