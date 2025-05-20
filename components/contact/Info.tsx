'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, Clock, Globe } from 'lucide-react';

function Info() {
  const contactItems = [
    {
      icon: <Phone className="w-5 h-5" />,
      title: 'Tel:',
      lines: ['+233 (0) 544 074 578'],
    },
    {
      icon: <Mail className="w-5 h-5" />,
      title: 'Email:',
      lines: ['ShipWithGodday@gmail.com'],
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: 'Business Hours:',
      lines: [
        'Monday - Friday: 8:00 AM - 5:00 PM',
        'Weekends: Closed',
      ],
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: 'We Operate:',
      lines: ['Worldwide with virtual offices'],
    },
  ];

  return (
    <motion.div className="bg-secondary rounded-2xl w-full p-6 sm:p-8 flex flex-col shadow-lg">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl sm:text-4xl lg:text-[2.5rem] leading-tight mb-4 sm:mb-6">
        Contact Info
      </motion.h2>

      <div className="space-y-6 sm:space-y-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-5">
          {contactItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
              className="flex items-start gap-3 group">
              <div className="p-2 rounded-full bg-primary/10 text-primary flex items-center justify-center mt-1 group-hover:bg-primary/20 transition-colors">
                {item.icon}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg">
                  {item.title}
                </span>
                <div className="flex flex-col">
                  {item.lines.map((line, i) => (
                    <span
                      key={i}
                      className="font-light hover:text-primary transition-colors">
                      {line}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Info;
