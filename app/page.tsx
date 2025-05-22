import InternationalPartnerships from '@/components/about/InternationalPartnerships';
import AboutBanner from '@/components/home/AboutBanner';
import CTA from '@/components/home/CTA';
import Hero from '@/components/home/Hero';
import Services from '@/components/home/services';
import SocialProof from '@/components/home/SocialProof';
import WhyUs from '@/components/home/WhyUs';

export default function Home() {
  return (
    <main>
      <Hero />
      <Services id="services" />
      <AboutBanner />
      <WhyUs />
      <InternationalPartnerships />
      <SocialProof />
      <CTA />
    </main>
  );
}
