import InternationalPartnerships from '@/components/about/InternationalPartnerships';
import AboutBanner from '@/components/home/AboutBanner';
import CTA from '@/components/home/CTA';
import Hero from '@/components/home/Hero';
import Services from '@/components/home/services';
import SocialProof from '@/components/home/SocialProof';
import WhyUs from '@/components/home/WhyUs';
import WeeklyContainerBanner from '@/components/home/WeeklyContainerBanner';
import SignUp from '@/components/home/SignUp';

export const metadata = {
  title: 'Ship With Godday | Your Trusted Shipping Partner',
  description:
    'Your trusted partner for seamless shipping solutions between China and Ghana. Experience reliable logistics, procurement, and payment services tailored to your business needs.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Ship With Godday | Your Trusted Shipping Partner',
    description:
      'Your trusted partner for seamless shipping solutions between China and Ghana. Experience reliable logistics, procurement, and payment services tailored to your business needs.',
    images: ['/logo.png'],
  },
};

export default function Home() {
  return (
    <main>
      <Hero />
      <Services id="services" />
      <AboutBanner />
      <WhyUs />
      <WeeklyContainerBanner />
      <InternationalPartnerships />
      <SignUp />
      <SocialProof />
      <CTA />
    </main>
  );
}
