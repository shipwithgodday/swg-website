import React from 'react';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { FormSchema } from './formSchema';

interface FormFieldProps {
  name: keyof FormSchema;
  placeholder: string;
  register: UseFormRegister<FormSchema>;
  errors: FieldErrors<FormSchema>;
  isTextArea?: boolean;
}

function FormField({
  name,
  placeholder,
  register,
  errors,
  isTextArea = false,
}: FormFieldProps) {
  const errorMessage = errors[name]?.message;

  return (
    <div className="space-y-2">
      {isTextArea ? (
        <textarea
          {...register(name)}
          placeholder={placeholder}
          className={cn(
            'w-full min-h-[120px] bg-transparent border-0 border-b border-white focus:ring-0 focus:border-slate-300 hover:border-slate-300 focus:outline-none p-2 md:p-2.5 text-sm resize-none text-white rounded-none',
            errorMessage && 'border-red-500'
          )}
        />
      ) : (
        <Input
          {...register(name)}
          placeholder={placeholder}
          className={cn(
            errorMessage && 'border-red-500',
            'border-gray-200'
          )}
        />
      )}
      {errorMessage && (
        <p className="text-xs text-red-500">
          {errorMessage as string}
        </p>
      )}
    </div>
  );
}

export default FormField;
