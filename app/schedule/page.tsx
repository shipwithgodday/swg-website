import BookingForm from '@/components/schedule/BookingWizard';
import { BookingProvider } from '@/lib/booking-context';

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
      <div className="w-full max-w-4xl mx-auto p-4 font-body z-10">
        <BookingProvider>
          <BookingForm />
        </BookingProvider>
      </div>
    </main>
  );
}
