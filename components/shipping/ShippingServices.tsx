import Container from '../shared/container';
import { ServiceSection } from '../shared/ServiceSection';
import { CarouselSection } from '../shared/CarouselSection';
import { LastServiceSection } from '../shared/LastServiceSection';

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

function ShippingServices() {
  const serviceData: ServiceData = {
    remote: {
      title: 'CBM Shipping Expertise',
      highlightedWord: 'Expertise',
      subtitle:
        'We offer the following services to make your shipping process easier and more efficient.',
      items: [
        'Cubic meter (CBM) measurement-based shipping',
        'Optimized container loading for maximum efficiency',
        'Volume-based pricing that saves you money',
        'Ideal for bulk and regular shipments',
      ],
    },
    onsite: {
      title: 'Shipping Options:',
      highlightedWord: 'Shipping',
      subtitle:
        'We offer the following services to make your stay easier, and your procurement process more seamless.',
      items: [
        'Sea freight (FCL and LCL options)',
        'Air freight for time-sensitive cargo',
        'Express courier services',
        'Combined shipping methods for cost optimization',
      ],
    },
    why: {
      title: 'Additional Services',
      highlightedWord: 'Services',
      subtitle:
        'We offer the following services to make your stay easier, and your procurement process more seamless.',
      items: [
        'Custom packaging solutions',
        'Cargo insurance',
        'Real-time shipment tracking',
        'Customs documentation preparation',
        'Delivery scheduling and coordination',
      ],
    },
  };

  // Carousel images
  const carouselImages = [
    '/shipping/4.jpg',
    '/shipping/5.jpg',
    '/shipping/3.jpg',
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
      />
    </Container>
  );
}

export default ShippingServices;
