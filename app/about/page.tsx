import AboutHero from '@/components/about/Hero';
import Story from '@/components/about/Story';
import Achievements from '@/components/about/Achievements';
import WhyUs from '@/components/about/WhyUs';
import CEO from '@/components/about/CEO';
import GhanaTeam from '@/components/about/GhanaTeam';
import HandsOnSourcing from '@/components/about/HandsOnSourcing';

export default function About() {
  return (
    <main className="">
      {/* Hero Section */}
      <AboutHero />

      <section className="py-12 md:py-24 space-y-8 md:space-y-16">
        {/* Our Story */}
        <Story />
        {/* Achievements */}
        <Achievements />
      </section>

      {/* Why Choose Us */}
      <WhyUs />

      {/* Hands-On Sourcing */}
      <HandsOnSourcing />

      {/* Meet the Teams */}
      <CEO />

      {/* Ghana Warehouse Team */}
      <GhanaTeam />
    </main>
  );
}
export const metadata = {
  title: 'About Us | Ship With Godday',
  description:
    'Learn about Ship With Godday - bridging Ghanaian retailers with Chinese manufacturers through seamless logistics, procurement and payment solutions since 2021.',
  openGraph: {
    title: 'About Us | Ship With Godday',
    description:
      'Learn about Ship With Godday - bridging Ghanaian retailers with Chinese manufacturers through seamless logistics, procurement and payment solutions since 2021.',
    images: ['/logo.png'],
  },
};
