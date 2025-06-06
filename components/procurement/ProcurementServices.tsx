import { CarouselSection } from '../shared/CarouselSection';
import Container from '../shared/container';
import { ServiceSection } from '../shared/ServiceSection';
import { LastServiceSection } from '../shared/LastServiceSection';
import img from '@/public/shipping/port.jpg';

import ProcurementProcess from './ProcurementProcess';

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

export default function ProcurementServices() {
  // Service data
  const serviceData: ServiceData = {
    remote: {
      title: "For Customers Who Can't Visit China",
      highlightedWord: "Can't Visit",
      subtitle:
        'We offer the following services to make your procurement process easier and more efficient.',
      items: [
        'Comprehensive sourcing services to find the exact products you need',
        'Supplier verification and quality control',
        'Price negotiation and order management',
        'Product inspection for special goods before shipping',
        'Regular updates throughout the procurement process',
      ],
    },
    onsite: {
      title: 'For Customers Who Visit China',
      highlightedWord: 'Visit',
      subtitle:
        'We offer the following services to make your stay easier, and your procurement process more seamless.',
      items: [
        'Local support and guidance',
        'Supplier introduction and meeting coordination',
        'Translation services during supplier meetings',
        'Assistance with sample collection and evaluation',
        'Documentation and contract support',
      ],
    },
    why: {
      title: 'Why Choose Our Procurement Services?',
      highlightedWord: 'Procurement Services',
      subtitle:
        'We offer the following services to make your stay easier, and your procurement process more seamless.',
      items: [
        'Extensive network of verified Chinese manufacturers',
        'Years of experience navigating Chinese business practices',
        'Eliminate language barriers and cultural misunderstandings',
        'Save time and reduce procurement risks',
        'Competitive rates and transparent pricing',
      ],
    },
  };

  // Carousel images
  const carouselImages = [
    '/procurement/1.jpeg',
    '/procurement/2.jpg',
    '/procurement/3.jpg',
  ];

  return (
    <Container className="my-16 md:my-24 lg:my-32">
      {/* <ProcurementProcess /> */}
      <ProcurementProcess />
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
