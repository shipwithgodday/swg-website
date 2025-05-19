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
