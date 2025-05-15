import AboutHero from '@/components/about/Hero';
import Story from '@/components/about/Story';
import Achievements from '@/components/about/Achievements';
import WhyUs from '@/components/about/WhyUs';
import CEO from '@/components/about/CEO';
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

      {/* Meet the Teams */}
      <CEO />

      {/* Contact Section */}
      {/* <section className="bg-[#00254F] text-white py-16">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">
              Ready to Start Shipping?
            </h2>
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {[
                { icon: Phone, text: '+233 XXX XXX XXX' },
                { icon: Mail, text: 'info@yourcompany.com' },
                {
                  icon: MapPin,
                  text: 'Accra, Ghana | Guangzhou, China',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center gap-4">
                  <item.icon className="w-6 h-6 text-primary" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
            <button className="bg-primary text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-600 transition">
              Schedule Free Consultation
            </button>
          </div>
        </Container>
      </section> */}
    </main>
  );
}
