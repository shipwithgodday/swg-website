import PaymentHero from '@/components/payment/Hero';
import PaymentServices from '@/components/payment/PaymentServices';

function Payment() {
  return (
    <main>
      <PaymentHero />
      <PaymentServices />
    </main>
  );
}

export default Payment;

export const metadata = {
  title: 'Payment Faciliation | Ship With Godday',
  description:
    'We offer payment faciliation services at Ship With Godday.',
  alternates: {
    canonical: '/payment',
  },
  openGraph: {
    title: 'Payment Faciliation | Ship With Godday',
    description:
      'We offer payment faciliation services at Ship With Godday.',
    images: ['/logo.png'],
  },
};
