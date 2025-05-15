'use client';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormValues } from './types';

export default function BookingConfirmation() {
  const { watch } = useFormContext<FormValues>();

  return (
    <div className="w-full text-center">
      <h3 className="text-xl md:text-2xl font-semibold mb-4">
        Confirm your booking
      </h3>
      <div className="bg-black bg-opacity-70 p-4 md:p-6 rounded-lg shadow-lg mb-6 text-sm md:text-base">
        <p className="mb-2">
          <span className="font-semibold">Date:</span>{' '}
          {watch('date')?.toDateString()}
        </p>
        <p className="mb-2">
          <span className="font-semibold">Time:</span> {watch('time')}
        </p>
        <p className="mb-2">
          <span className="font-semibold">Name:</span>{' '}
          {watch('fullName')}
        </p>
        <p className="mb-2">
          <span className="font-semibold">Email:</span>{' '}
          {watch('email')}
        </p>
        <p className="mb-2">
          <span className="font-semibold">Phone:</span>{' '}
          {watch('phoneNumber')}
        </p>
        <p className="mb-2">
          <span className="font-semibold">Desired Service:</span>{' '}
          {watch('desiredService')}
        </p>
        <p>
          <span className="font-semibold">Meeting Type:</span>{' '}
          {watch('meetingType')}
        </p>
      </div>
    </div>
  );
}
