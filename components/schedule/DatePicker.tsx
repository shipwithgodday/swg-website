import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { addDays, format } from 'date-fns';
import { useBooking } from '@/lib/booking-context';

interface DatePickerProps {
  onDateChange?: (date: Date) => void;
  showDateErrors?: boolean;
  dateError?: string | null;
}

export default function DatePicker({
  onDateChange,
  showDateErrors = false,
  dateError = null,
}: DatePickerProps) {
  const {
    selectedDate,
    setSelectedDate,
    clearSelectedTime,
    getAvailableTimesForDate,
    prefetchDateRange,
    availabilityCache,
  } = useBooking();

  // Handle date selection
  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    if (availabilityCache[dateStr]) {
      setSelectedDate(date);
      clearSelectedTime();
      return;
    }
    setSelectedDate(date);
    clearSelectedTime();

    // Wait for prefetch FIRST
    const nextThreeDays = addDays(date, 3);
    await prefetchDateRange(date, nextThreeDays); // Await here

    // Now check availability (cache should be populated)
    await getAvailableTimesForDate(date);

    if (onDateChange) onDateChange(date);
  };

  // Disable past dates and non-working days (Mon, Wed, Fri only)
  // const isDateDisabled = (day: Date) => {
  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);

  //   if (isBefore(day, today)) {
  //     return true;
  //   }

  //   const dayOfWeek = day.getDay();
  //   // Allow only Monday (1), Wednesday (3), and Friday (5)
  //   return dayOfWeek !== 1 && dayOfWeek !== 3 && dayOfWeek !== 5;
  // };

  return (
    <div className="w-full">
      <DayPicker
        mode="single"
        selected={selectedDate || undefined}
        onSelect={(date) => date && handleDateSelect(date)}
        // disabled={isDateDisabled}
        classNames={{
          today: `border-white text-white`,
          selected: `bg-primary border-primary text-white rounded-full`,
          chevron: `fill-white cursor-pointer`,
        }}
      />

      {showDateErrors && dateError && (
        <div className="text-red-500 mt-2 text-sm">{dateError}</div>
      )}
    </div>
  );
}
