import { z } from 'zod';

// Form schema with validation
export const formSchema = z.object({
  date: z.date({
    required_error: 'Please select a date',
  }),
  time: z.string({
    required_error: 'Please select a time',
  }),
  fullName: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name must be less than 100 characters' }),
  phoneNumber: z
    .string()
    .min(7, { message: 'Please enter a valid phone number' })
    .max(20, { message: 'Phone number is too long' }),
  whatsappNumber: z
    .string()
    .min(7, { message: 'Please enter a valid WhatsApp number' })
    .max(20, { message: 'WhatsApp number is too long' })
    .optional(),
  email: z
    .string()
    .email({ message: 'Please enter a valid email address' }),
  organization: z
    .string()
    .max(100, {
      message: 'Organization name must be less than 100 characters',
    })
    .optional(),
  desiredService: z.string({
    required_error: 'Please select a desired service',
  }),
  meetingType: z.string({
    required_error: 'Please select a meeting type',
  }),
});

// Form values type
export type FormValues = z.infer<typeof formSchema>;

// Type for booking submission
export interface BookingSubmission {
  date: string;
  time: string;
  fullName: string;
  phoneNumber: string;
  whatsappNumber?: string;
  email: string;
  organization?: string;
  projectType: string;
  briefingMeetingPreference: string;
}

// Response type for booking API
export interface BookingResponse {
  success: boolean;
  error?: string;
}
