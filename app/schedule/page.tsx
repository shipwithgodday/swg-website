import SchedulePage from '@/components/schedule';

export default function BookingPage() {
  return (
    <main
      style={{
        backgroundImage: "url('/booking-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      className="min-h-screen flex items-center justify-center relative">
      <div className="absolute inset-0 bg-black opacity-60 " />
      <SchedulePage />
    </main>
  );
}

export const metadata = {
  title: 'Schedule a Call | Ship With Godday',
  description:
    'Schedule a call with Godday for any inquiries or assistance.',
  openGraph: {
    title: 'Schedule a Call | Ship With Godday',
    description:
      'Schedule a call with Godday for any inquiries or assistance.',
    images: ['/logo.png'],
  },
};
