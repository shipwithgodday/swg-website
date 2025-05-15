'use client';
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useBooking } from '@/lib/booking-context';

interface TimeSlotSelectorProps {
  onTimeSelect?: (time: string) => void;
  showTimeErrors?: boolean;
  timeError?: string | null;
}

export default function TimeSlotSelector({
  onTimeSelect,
  showTimeErrors = false,
  timeError = null,
}: TimeSlotSelectorProps) {
  const {
    selectedDate,
    selectedTime,
    setSelectedTime,
    getAvailableTimesForDate,
    availabilityCache,
    isLoading,
  } = useBooking();

  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  // Update available times when selected date changes
  useEffect(() => {
    const fetchTimes = async () => {
      if (!selectedDate) {
        setAvailableTimes([]);
        return;
      }

      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      // Check if we already have this date in cache
      if (availabilityCache[dateStr]) {
        setAvailableTimes(
          availabilityCache[dateStr].data.availableTimes
        );
      } else {
        // Fetch if not in cache
        const times = await getAvailableTimesForDate(selectedDate);
        setAvailableTimes(times);
      }
    };

    fetchTimes();
  }, [selectedDate, availabilityCache, getAvailableTimesForDate]);

  // Handle time selection
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);

    if (onTimeSelect) {
      onTimeSelect(time);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-lg md:text-xl mb-2 md:mb-4 text-[#ffffff]">
        Available Times
      </h2>
      <div className="bg-[#4b82a994] bg-opacity-30 p-2 sm:p-3 md:p-4 rounded-lg shadow-lg h-[15rem] md:h-[20rem] overflow-y-auto relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full w-full absolute top-0 left-0">
            <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-[#64534B]" />
          </div>
        ) : !selectedDate ? (
          <p className="text-gray-400 text-sm md:text-base">
            Please select a date to view available times.
          </p>
        ) : availableTimes.length > 0 ? (
          <div className="w-full grid gap-2">
            {availableTimes.map((time, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleTimeSelect(time)}
                className={`text-left px-2 md:px-4 py-2 rounded text-sm md:text-base ${
                  selectedTime === time
                    ? 'bg-primary text-white'
                    : 'bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-colors'
                }`}>
                {time}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm md:text-base">
            No available times for the selected date.
          </p>
        )}
      </div>

      {showTimeErrors && timeError && (
        <div className="text-red-500 mt-2 text-sm">{timeError}</div>
      )}
    </div>
  );
}
