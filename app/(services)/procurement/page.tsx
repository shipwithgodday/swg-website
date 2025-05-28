import ProcurementHero from '@/components/procurement/Hero';
import ProcurementServices from '@/components/procurement/ProcurementServices';

function Procurement() {
  return (
    <main>
      <ProcurementHero />
      <ProcurementServices />
    </main>
  );
}

export default Procurement;

export const metadata = {
  title: 'Procurement | Ship With Godday',
  description:
    'We source and procure the best materials from China for your business at Ship With Godday.',
  alternates: {
    canonical: '/procurement',
  },
  openGraph: {
    title: 'Procurement | Ship With Godday',
    description:
      'We source and procure the best materials from China for your business at Ship With Godday.',
    images: ['/logo.png'],
  },
};
