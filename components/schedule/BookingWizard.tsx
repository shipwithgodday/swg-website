/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createBooking } from '@/app/actions/createBooking';
import { getClientCalendarLinks } from '@/lib/ClientCalendarUtils';
import { useBooking } from '@/lib/booking-context';
import DatePicker from './DatePicker';
import TimeSlotSelector from './TimeSlotSelector';
import UserDetailsForm from './UserDetails';
import BookingConfirmation from './BookingConfirmation';
import { formSchema, FormValues } from './types';
import { Button } from '../ui/button';

const initialValues: FormValues = {
  date: new Date(),
  time: '',
  fullName: '',
  phoneNumber: '',
  email: '',
  desiredService: '',
  meetingType: '',
};

type BookingStep = 'dateTime' | 'userDetails' | 'confirmation';

export default function BookingForm() {
  const {
    selectedDate,
    selectedTime,
    setSelectedDate,
    setSelectedTime,
    invalidateCache,
  } = useBooking();
  const [submitStatus, setSubmitStatus] = useState<
    'success' | 'error' | null
  >(null);
  const [currentStep, setCurrentStep] =
    useState<BookingStep>('dateTime');
  const [showErrors, setShowErrors] = useState<boolean>(false);

  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
    mode: 'onSubmit',
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    trigger,
    reset,
  } = methods;

  // Sync form with context
  useEffect(() => {
    if (selectedDate) {
      setValue('date', selectedDate);
    }
  }, [selectedDate, setValue]);

  useEffect(() => {
    if (selectedTime) {
      setValue('time', selectedTime);
    }
  }, [selectedTime, setValue]);

  // Handle date change
  const handleDateChange = (date: Date) => {
    setValue('date', date);
    setValue('time', ''); // Clear time when date changes
  };

  // Handle time selection
  const handleTimeSelect = (time: string) => {
    setValue('time', time);
  };

  // Clear status message after 2 seconds
  useEffect(() => {
    if (submitStatus) {
      const timer = setTimeout(() => {
        setSubmitStatus(null);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [submitStatus]);

  // Form submission
  const onSubmit = async (values: FormValues) => {
    try {
      const dateOnly = values.date.toISOString().split('T')[0];
      const formattedDateTime = `${dateOnly}T${values.time}:00`;

      const clientCalendarLinks = getClientCalendarLinks({
        ...values,
        formattedDateTime,
      });

      // Submit booking to your API
      const result = await createBooking({
        date: dateOnly,
        time: values.time,
        fullName: values.fullName,
        phoneNumber: values.phoneNumber,
        email: values.email,
        organization: values.organization,
        desiredService: values.desiredService,
        meetingType: values.meetingType,
      });

      if (!result.success) throw new Error(result.error);

      // Send confirmation email to the client
      const clientEmailResponse = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: values.email,
          firstName: values.fullName.split(' ')[0],
          bookingDetails: {
            date: dateOnly,
            time: values.time,
            fullName: values.fullName,
            phoneNumber: values.phoneNumber,
            meetingType: values.meetingType,
          },
          clientCalendarLinks,
        }),
      });

      const clientEmailResult = await clientEmailResponse.json();

      if (!clientEmailResponse.ok) {
        throw new Error(
          `Failed to send confirmation email: ${
            clientEmailResult.error || 'Unknown error'
          }`
        );
      }

      // Send notification email to the site owner
      const ownerEmailResponse = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'info@shipwithgodday.com',
          firstName: 'Admin',
          bookingDetails: {
            date: dateOnly,
            time: values.time,
            fullName: values.fullName,
            phoneNumber: values.phoneNumber,
            whatsappNumber: values.whatsappNumber,
            email: values.email,
            organization: values.organization,
            desiredService: values.desiredService,
            meetingType: values.meetingType,
          },
          clientCalendarLinks: getClientCalendarLinks(
            {
              ...values,
              formattedDateTime,
            },
            true
          ),
          isOwnerNotification: true,
        }),
      });

      const ownerEmailResult = await ownerEmailResponse.json();

      if (!ownerEmailResponse.ok) {
        throw new Error(
          `Failed to send owner notification email: ${
            ownerEmailResult.error || 'Unknown error'
          }`
        );
      }

      setSubmitStatus('success');
      reset();
      setCurrentStep('dateTime');
      setSelectedDate(new Date());
      setSelectedTime(null);
      setShowErrors(false);

      // Force refresh of availabilityCache for the booked date
      // This ensures the booked time will not show up when user returns
      await invalidateCache(values.date);
    } catch (error) {
      console.error(
        'Submission error:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      setSubmitStatus('error');

      // Attempt to rollback the booking if it was created
      if (
        error instanceof Error &&
        error.message.includes('Failed to send confirmation email')
      ) {
        try {
          await fetch(`/api/bookings/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date: values.date.toISOString().split('T')[0],
              time: values.time,
            }),
          });
          console.log('Booking rolled back successfully');
        } catch (rollbackError) {
          console.error('Failed to rollback booking:', rollbackError);
        }
      }
    }
  };

  // Navigation between steps
  const goToNext = async (fieldsToValidate: string[]) => {
    const result = await trigger(fieldsToValidate as any);
    if (result) {
      if (currentStep === 'dateTime') setCurrentStep('userDetails');
      else if (currentStep === 'userDetails')
        setCurrentStep('confirmation');
      setShowErrors(false);
    } else {
      setShowErrors(true);
    }
  };

  const goToPrevious = () => {
    if (currentStep === 'confirmation') setCurrentStep('userDetails');
    else if (currentStep === 'userDetails')
      setCurrentStep('dateTime');
    setShowErrors(false);
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col items-center justify-center bg-[#00365D] bg-opacity-70 shadow-lg rounded-lg p-4 sm:p-6 md:p-8 text-white">
        <div className="w-full max-w-2xl">
          {currentStep === 'dateTime' && (
            <div className="flex flex-col md:flex-row justify-between w-full gap-4 md:gap-8 mb-6">
              <div className="w-full md:w-1/2">
                <DatePicker
                  onDateChange={handleDateChange}
                  showDateErrors={showErrors}
                  dateError={errors.date?.message}
                />
              </div>
              <div className="w-full md:w-1/2 mt-4 md:mt-0">
                <TimeSlotSelector
                  onTimeSelect={handleTimeSelect}
                  showTimeErrors={showErrors}
                  timeError={errors.time?.message}
                />
              </div>
            </div>
          )}

          {currentStep === 'userDetails' && (
            <UserDetailsForm showErrors={showErrors} />
          )}

          {currentStep === 'confirmation' && <BookingConfirmation />}

          <div
            className={`flex ${
              currentStep === 'dateTime'
                ? 'justify-end'
                : 'justify-between'
            } mt-6`}>
            {currentStep !== 'dateTime' && (
              <Button
                type="button"
                onClick={goToPrevious}
                className="px-3 py-1.5 md:px-6 bg-muted-foreground text-white hover:bg-gray-700 transition duration-300 text-sm md:text-base">
                Back
              </Button>
            )}
            {currentStep === 'dateTime' && (
              <Button
                type="button"
                onClick={() => goToNext(['date', 'time'])}
                className="text-sm md:text-base">
                Next
              </Button>
            )}
            {currentStep === 'userDetails' && (
              <Button
                type="button"
                onClick={() =>
                  goToNext([
                    'fullName',
                    'phoneNumber',
                    'email',
                    'projectType',
                    'briefingMeetingPreference',
                  ])
                }
                className="text-sm md:text-base">
                Review Booking
              </Button>
            )}
            {currentStep === 'confirmation' && (
              <Button
                type="submit"
                disabled={isSubmitting}
                // className="px-4 py-1.5 md:px-6 md:py-2 bg-white text-black rounded-md hover:bg-[#dddddd] transition duration-300 disabled:opacity-50 text-sm md:text-base"
              >
                {isSubmitting ? 'Confirming...' : 'Confirm Booking'}
              </Button>
            )}
          </div>
        </div>

        {submitStatus && (
          <Alert
            className={`mt-4 ${
              submitStatus === 'success'
                ? 'bg-green-100 border-green-400 text-green-700'
                : 'bg-red-100 border-red-400 text-red-700'
            }`}>
            <AlertDescription>
              {submitStatus === 'success'
                ? 'Your booking has been created successfully!'
                : 'An error occurred. Please try again later.'}
            </AlertDescription>
          </Alert>
        )}
      </form>
    </FormProvider>
  );
}
