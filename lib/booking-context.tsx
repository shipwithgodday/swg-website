'use client';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { format, addDays } from 'date-fns';
import { getDateRangeAvailability } from '@/app/actions/getAvailableTimes';

// Define the ALL_TIME_SLOTS array locally since it's not exported from getAvailableTimes
const ALL_TIME_SLOTS = [
  '12:00',
  '12:45',
  '13:00',
  '13:45',
  '14:00',
  '14:45',
  '15:00',
  '15:45',
  '16:00',
  '16:45',
  '17:00',
  '17:45',
];

// Define types
export type TimeSlot = string;

export interface DateAvailability {
  availableTimes: TimeSlot[];
  totalSlots: number;
  bookedSlotsCount: number;
}

export interface BookingContextType {
  selectedDate: Date | null;
  selectedTime: TimeSlot | null;
  availabilityCache: Record<
    string,
    { data: DateAvailability; timestamp: number }
  >;
  isLoading: boolean;
  setSelectedDate: (date: Date | null) => void;
  setSelectedTime: (time: TimeSlot | null) => void;
  getAvailableTimesForDate: (date: Date) => Promise<TimeSlot[]>;
  prefetchDateRange: (
    startDate: Date,
    endDate: Date
  ) => Promise<void>;
  clearSelectedTime: () => void;
}

// Create context with default values
const BookingContext = createContext<BookingContextType>({
  selectedDate: null,
  selectedTime: null,
  availabilityCache: {},
  isLoading: false,
  setSelectedDate: () => {},
  setSelectedTime: () => {},
  getAvailableTimesForDate: async () => [],
  prefetchDateRange: async () => {},
  clearSelectedTime: () => {},
});

export const useBooking = () => useContext(BookingContext);

export const BookingProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(
    null
  );
  const [availabilityCache, setAvailabilityCache] = useState<
    Record<string, { data: DateAvailability; timestamp: number }>
  >({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch available times for a specific date, using cache if available
  const getAvailableTimesForDate = useCallback(
    async (date: Date): Promise<TimeSlot[]> => {
      const dateStr = format(date, 'yyyy-MM-dd');
      console.log(
        'Checking cache for:',
        dateStr,
        availabilityCache[dateStr] ? 'HIT' : 'MISS'
      );
      // Return from cache if available
      if (availabilityCache[dateStr]) {
        // Check if cache is fresh (1 hour)
        if (
          Date.now() - availabilityCache[dateStr].timestamp <
          3600000
        ) {
          return availabilityCache[dateStr].data.availableTimes;
        }
      }

      setIsLoading(true);
      try {
        // Get availability just for this date
        const startDate = format(date, 'yyyy-MM-dd');
        const endDate = format(date, 'yyyy-MM-dd');
        const availabilityMap = await getDateRangeAvailability(
          startDate,
          endDate
        );

        // Update cache with the new data
        setAvailabilityCache((prevCache) => ({
          ...prevCache,
          [dateStr]: {
            data: {
              availableTimes:
                availabilityMap[dateStr]?.availableTimes || [],
              totalSlots: ALL_TIME_SLOTS.length,
              bookedSlotsCount:
                availabilityMap[dateStr]?.bookedSlotsCount || 0,
            },
            timestamp: Date.now(),
          },
        }));

        return availabilityMap[dateStr]?.availableTimes || [];
      } catch (error) {
        console.error('Failed to fetch available times:', error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [availabilityCache]
  );

  // Prefetch date range (for nearby dates)
  const prefetchDateRange = useCallback(
    async (startDate: Date, endDate: Date): Promise<void> => {
      const start = format(startDate, 'yyyy-MM-dd');
      const end = format(endDate, 'yyyy-MM-dd');

      setIsLoading(true);
      try {
        const availabilityMap = await getDateRangeAvailability(
          start,
          end
        );

        // Update cache with new data
        setAvailabilityCache((prevCache) => {
          const newCache = { ...prevCache };

          // Process each date in the availability map
          Object.entries(availabilityMap).forEach(
            ([dateKey, dateAvailability]) => {
              newCache[dateKey] = {
                data: dateAvailability,
                timestamp: Date.now(),
              };
            }
          );

          return newCache;
        });
      } catch (error) {
        console.error('Failed to prefetch date range:', error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Clear selected time (used when date changes)
  const clearSelectedTime = useCallback(() => {
    setSelectedTime(null);
  }, []);

  // Prefetch next 14 days when component mounts
  useEffect(() => {
    const today = new Date();
    const twoWeeksLater = addDays(today, 14);
    prefetchDateRange(today, twoWeeksLater);
  }, [prefetchDateRange]);

  return (
    <BookingContext.Provider
      value={{
        selectedDate,
        selectedTime,
        availabilityCache,
        isLoading,
        setSelectedDate,
        setSelectedTime,
        getAvailableTimesForDate,
        prefetchDateRange,
        clearSelectedTime,
      }}>
      {children}
    </BookingContext.Provider>
  );
};
