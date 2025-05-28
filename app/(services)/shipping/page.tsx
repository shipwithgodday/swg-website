import ShippingHero from '@/components/shipping/Hero';
import ShippingServices from '@/components/shipping/ShippingServices';

function Shipping() {
  return (
    <main>
      <ShippingHero />
      <ShippingServices />
    </main>
  );
}

export default Shipping;

export const metadata = {
  title: 'Shipping | Ship With Godday',
  description:
    'We offer shipping services from China to Ghana at Ship With Godday.',
  alternates: {
    canonical: '/shipping',
  },
  openGraph: {
    title: 'Shipping | Ship With Godday',
    description:
      'We offer shipping services from China to Ghana at Ship With Godday.',
    images: ['/logo.png'],
  },
};
