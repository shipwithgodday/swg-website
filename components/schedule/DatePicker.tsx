import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { addDays, format, isBefore } from 'date-fns';
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
  const isDateDisabled = (day: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Disable past dates
    if (isBefore(day, today)) {
      return true;
    }

    const dayOfWeek = day.getDay();

    // Disable Thursdays (4), Saturdays (6) and Sundays (0)
    if (dayOfWeek === 4 || dayOfWeek === 6 || dayOfWeek === 0) {
      return true;
    }

    return false;
  };

  return (
    <div className="w-full">
      <DayPicker
        mode="single"
        selected={selectedDate || undefined}
        onSelect={(date) => date && handleDateSelect(date)}
        disabled={isDateDisabled}
        classNames={{
          today: `border-primary text-primary`,
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
