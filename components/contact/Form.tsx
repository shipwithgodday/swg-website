'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formSchema, FormSchema } from './formSchema';
import FormField from './FormField';
import { Button } from '../ui/button';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

function Form() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      reset();
      // Reset success message after 5 seconds
      setTimeout(() => setIsSubmitted(false), 5000);
    }, 1500);
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}>
              <FormField
                name="email"
                placeholder="Email Address"
                register={register}
                errors={errors}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}>
              <FormField
                name="phone"
                placeholder="Phone number"
                register={register}
                errors={errors}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}>
              <FormField
                name="subject"
                placeholder="Subject (Optional)"
                register={register}
                errors={errors}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}>
              <FormField
                name="message"
                placeholder="Message"
                isTextArea
                register={register}
                errors={errors}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}>
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
            </motion.div>
          </form>
        </>
      )}
    </motion.div>
  );
}

export default Form;
