'use client';
import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { FormValues } from './types';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface UserDetailsFormProps {
  showErrors: boolean;
}

export default function UserDetailsForm({
  showErrors,
}: UserDetailsFormProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<FormValues>();

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-xl md:text-2xl mb-4">Your Details</h2>

      <div className="mb-4">
        <Input
          type="text"
          {...register('fullName')}
          placeholder="Full Name"
        />
        {showErrors && errors.fullName && (
          <div className="text-red-500 mt-1 text-xs md:text-sm">
            {errors.fullName.message}
          </div>
        )}
      </div>

      <div className="mb-4">
        <Input
          type="email"
          {...register('email')}
          placeholder="Email Address"
        />
        {showErrors && errors.email && (
          <div className="text-red-500 mt-1 text-sm">
            {errors.email.message}
          </div>
        )}
      </div>

      <div className="mb-4">
        <Input
          type="tel"
          {...register('phoneNumber')}
          placeholder="Phone Number"
        />
        {showErrors && errors.phoneNumber && (
          <div className="text-red-500 mt-1 text-sm">
            {errors.phoneNumber.message}
          </div>
        )}
      </div>

      <div className="mb-4">
        <Controller
          name="desiredService"
          control={control}
          render={({ field }) => (
            <Select
              onValueChange={field.onChange}
              value={field.value}
              defaultValue={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Select Desired Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Procurement Services">
                  Procurement Services
                </SelectItem>
                <SelectItem value="Shipping Solutions">
                  Shipping Solutions
                </SelectItem>
                <SelectItem value="Payment Facilitation">
                  Payment Facilitation
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {showErrors && errors.desiredService && (
          <div className="text-red-500 mt-1 text-sm">
            {errors.desiredService.message}
          </div>
        )}
      </div>

      <div className="mb-4">
        <Controller
          name="meetingType"
          control={control}
          render={({ field }) => (
            <Select
              onValueChange={field.onChange}
              value={field.value}
              defaultValue={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Select Meeting Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="In-person">In-person</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {showErrors && errors.meetingType && (
          <div className="text-red-500 mt-1 text-sm">
            {errors.meetingType.message}
          </div>
        )}
      </div>
    </div>
  );
}
