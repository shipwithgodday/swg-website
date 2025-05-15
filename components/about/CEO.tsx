import React from 'react';
import Container from '../shared/container';
import SectionHeader from '../shared/section-header';
import Image from 'next/image';
import CEOImage from '@/public/procurement/2.jpg'; // Using an executive-looking image from the procurement folder
import { Button } from '../ui/button';
import Link from 'next/link';
import { Icon } from '../ui/icon';

function CEO() {
  return (
    <section className="py-12 md:py-20">
      <Container>
        <div className="hidden md:block">
          <SectionHeader highlightedWord={'CEO'}>
            Meet Our CEO
          </SectionHeader>
        </div>
        <div className="block md:hidden">
          <SectionHeader size="md" highlightedWord={'CEO'}>
            Meet Our CEO
          </SectionHeader>
        </div>

        <div className="mt-12 md:mt-16 flex flex-col md:flex-row items-center gap-12 md:gap-16">
          {/* CEO Image with stylish frame */}
          <div className="w-full md:w-2/5 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00254F] to-[#00365D] transform rotate-3 rounded-2xl shadow-xl"></div>
            <div className="relative z-10 overflow-hidden rounded-2xl border-4 border-white shadow-lg">
              <Image
                src={CEOImage}
                alt="Company CEO"
                className="w-full h-[400px] md:h-[500px] object-cover"
                priority
              />
            </div>
            <div className="hidden md:block absolute -bottom-6 -right-6 w-24 h-24 bg-primary rounded-full z-0"></div>
          </div>

          {/* CEO Information */}
          <div className="w-full md:w-3/5 space-y-6">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold ">
                Gideon Obeng-Darko Debrah{' '}
                <span className="text-primary">(Godday)</span>
              </h3>
              <p className="text-xl text-gray-500 font-medium mt-2">
                Founder & Chief Executive Officer
              </p>
            </div>
            <div className="w-20 h-1.5 bg-primary rounded-full"></div>
            <p className="text-gray-700 leading-relaxed">
              With over 4 years of experience in international
              logistics and supply chain management, Godday has
              revolutionized how businesses approach global
              procurement and shipping. His innovative vision has
              established our company as a leader in the industry.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Godday oversees both our China and Ghana operations,
              ensuring seamless coordination between procurement,
              quality control, customs clearance, and client services.
              His commitment to excellence drives our company&apos;s
              success.
            </p>
            <div className="mt-4">
              <Button>
                <Link
                  href="https://wa.me/233544074578"
                  className="inline-flex items-center font-medium">
                  <span>Connect with Godday</span>
                  <Icon name="ArrowRight" className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default CEO;
