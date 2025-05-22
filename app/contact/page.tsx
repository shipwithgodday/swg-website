import ContactSection from '@/components/contact/ContactSection';
import ContactHero from '@/components/contact/ContactHero';

function Contact() {
  return (
    <main>
      <ContactHero />
      <div id="contact-form">
        <ContactSection />
      </div>
    </main>
  );
}

export default Contact;

export const metadata = {
  title: 'Contact Us | Ship With Godday',
  description:
    'Get in touch with Godday for any inquiries or assistance.',
  openGraph: {
    title: 'Contact Us | Ship With Godday',
    description:
      'Get in touch with Godday for any inquiries or assistance.',
    images: ['/logo.png'],
  },
};
