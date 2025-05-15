import ContactSection from '@/components/contact/ContactSection';
import ContactHero from '@/components/contact/ContactHero';

export const metadata = {
  title: 'Contact Us | Godday',
  description:
    'Get in touch with Godday for any inquiries or assistance.',
};

function Contact() {
  return (
    <main>
      <ContactHero />
      <div id="contact-form">
        <ContactSection />
      </div>
      {/* <ContactFAQ /> */}
    </main>
  );
}

export default Contact;
