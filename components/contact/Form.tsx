'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formSchema, FormSchema } from './formSchema';
import FormField from './FormField';
import { Button } from '../ui/button';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';

function Form() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormSchema) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        'https://api.web3forms.com/submit',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            access_key: process.env.NEXT_PUBLIC_WEB3FORMS_KEY,
            ...data,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setIsSubmitted(true);
        reset();
        // Reset success message after 5 seconds
        setTimeout(() => setIsSubmitted(false), 5000);
      } else {
        setError(
          result.message || 'Something went wrong. Please try again.'
        );
      }
    } catch {
      setError('Failed to send message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div className="bg-gradient-to-r from-[#00254F] to-[#00365D] rounded-2xl text-white w-full p-6 sm:p-8 flex flex-col shadow-lg">
      {isSubmitted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center text-center py-12 h-full">
          <CheckCircle className="w-16 h-16 text-primary mb-4" />
          <h3 className="text-2xl font-bold mb-2">
            Message Sent Successfully!
          </h3>
          <p className="text-gray-300">
            Thank you for contacting us. We&apos;ll respond as soon as
            possible.
          </p>
        </motion.div>
      ) : (
        <>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-500 text-sm">{error}</p>
            </motion.div>
          )}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}>
              <FormField
                name="name"
                placeholder="Your name"
                register={register}
                errors={errors}
              />
            </motion.div>

            <div>
              <FormField
                name="email"
                placeholder="Email Address"
                register={register}
                errors={errors}
              />
            </div>

            <div>
              <FormField
                name="phone"
                placeholder="Phone number"
                register={register}
                errors={errors}
              />
            </div>

            <div>
              <FormField
                name="subject"
                placeholder="Subject (Optional)"
                register={register}
                errors={errors}
              />
            </div>

            <div>
              <FormField
                name="message"
                placeholder="Message"
                isTextArea
                register={register}
                errors={errors}
              />
            </div>

            <div>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-black font-medium relative overflow-hidden group"
                disabled={isSubmitting}>
                <span
                  className={`flex items-center justify-center transition-all duration-300 ${isSubmitting ? 'opacity-0' : 'opacity-100'}`}>
                  Send Message
                </span>
                {isSubmitting && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 text-black"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                )}
                <span className="absolute bottom-0 left-0 w-full h-1 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Button>
            </div>
          </form>
        </>
      )}
    </motion.div>
  );
}

export default Form;
