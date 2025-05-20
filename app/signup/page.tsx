'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Define the form schema
const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phoneNumber: z
    .string()
    .min(10, 'Please enter a valid phone number'),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [status, setStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    try {
      const response = await fetch('/api/customers/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus({
          success: true,
          message:
            'Registration successful! You will now receive email updates.',
        });
        // Redirect to schedule page after 2 seconds
        setTimeout(() => {
          router.push('/schedule');
        }, 2000);
      } else {
        setStatus({
          success: false,
          message:
            result.error || 'Registration failed. Please try again.',
        });
      }
    } catch {
      setStatus({
        success: false,
        message: 'An error occurred. Please try again.',
      });
    }
  };

  return (
    <main
      style={{
        backgroundImage: "url('/booking-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      className="min-h-screen flex items-center justify-center relative">
      <div className="absolute inset-0 bg-black opacity-60" />

      <div className="w-full max-w-2xl bg-[#00365D] bg-opacity-70 shadow-lg rounded-lg mx-auto px-4 py-8 z-10">
        {status && (
          <div
            className={`p-4 mb-6 rounded-lg shadow-sm ${
              status.success
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="">
          <div className="px-6 py-2 max-w-md mx-auto space-y-6">
            <h1 className="text-xl md:text-2xl mb-2 text-white">
              Customer Sign Up
            </h1>
            <p className="text-gray-200 font-light">
              Create an account to receive email updates
            </p>
            <div className="space-y-4">
              <div>
                <Input
                  type="text"
                  {...register('fullName')}
                  placeholder="Full Name"
                />
                {errors.fullName && (
                  <div className="text-red-400 mt-1 text-xs md:text-sm">
                    {errors.fullName.message}
                  </div>
                )}
              </div>

              <div>
                <Input
                  type="email"
                  {...register('email')}
                  placeholder="Email Address"
                />
                {errors.email && (
                  <div className="text-red-400 mt-1 text-xs md:text-sm">
                    {errors.email.message}
                  </div>
                )}
              </div>

              <div>
                <Input
                  type="tel"
                  {...register('phoneNumber')}
                  placeholder="Phone Number"
                />
                {errors.phoneNumber && (
                  <div className="text-red-400 mt-1 text-xs md:text-sm">
                    {errors.phoneNumber.message}
                  </div>
                )}
              </div>
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                isSubmitting
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : ''
              }`}>
              {isSubmitting ? 'Signing up...' : 'Sign Up'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
