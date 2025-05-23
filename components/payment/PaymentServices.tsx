import { CarouselSection } from '../shared/CarouselSection';
import Container from '../shared/container';
import { ServiceSection } from '../shared/ServiceSection';
import { LastServiceSection } from '../shared/LastServiceSection';
import img from '@/public/payment/gh-china.webp';

interface ServiceCategory {
  title: string;
  highlightedWord: string;
  subtitle: string;
  items: string[];
}

interface ServiceData {
  remote: ServiceCategory;
  onsite: ServiceCategory;
  why: ServiceCategory;
}

export default function PaymentServices() {
  // Service data
  const serviceData: ServiceData = {
    remote: {
      title: 'Our Payment Services',
      highlightedWord: 'Payment Services',
      subtitle:
        'Experience seamless financial transactions with our comprehensive suite of payment solutions designed to streamline your international trade.',
      items: [
        'Secure transactions between buyers and Chinese suppliers',
        'Multiple currency support',
        'Chinese Yuan (RMB) to Ghana Cedi (GHS) currency exchange services',
        'Escrow services to protect both parties',
        'Verification of payment terms and conditions',
        'Documentation of all transactions',
      ],
    },
    onsite: {
      title: 'Benefits of Our Payment Services',
      highlightedWord: 'Benefits',
      subtitle:
        'Experience the advantages of our payment services, designed to simplify and secure your international trade.',
      items: [
        'Reduced financial risk',
        'Lower transaction fees compared to traditional banking',
        'Faster processing times',
        'Protection against fraud',
        'Compliance with international trade regulations',
      ],
    },
    why: {
      title: 'Payment Methods Supported:',
      highlightedWord: 'Payment Methods',
      subtitle:
        'Explore the various payment methods we support to ensure a smooth and secure transaction process.',
      items: [
        'Wire transfers',
        'Letters of credit',
        'Digital payment platforms',
        'Currency exchange services',
        'Installment payment arrangements',
      ],
    },
  };

  // Carousel images
  const carouselImages = [
    '/payment/3.webp',
    '/payment/1.jpg',
    '/payment/2.png',
  ];

  return (
    <Container className="my-16 md:my-24 lg:my-32">
      <ServiceSection
        title={serviceData.remote.title}
        highlightedWord={serviceData.remote.highlightedWord}
        subtitle={serviceData.remote.subtitle}
        items={serviceData.remote.items}
      />

      <ServiceSection
        title={serviceData.onsite.title}
        highlightedWord={serviceData.onsite.highlightedWord}
        subtitle={serviceData.onsite.subtitle}
        items={serviceData.onsite.items}
      />

      <CarouselSection images={carouselImages} />

      <LastServiceSection
        title={serviceData.why.title}
        highlightedWord={serviceData.why.highlightedWord}
        subtitle={serviceData.why.subtitle}
        items={serviceData.why.items}
        imgUrl={img}
      />
    </Container>
  );
}
