'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSignUp } from '@clerk/nextjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { splitFullName } from '@/lib/shop/name';
import { completeSignup } from '@/app/actions/auth/complete-signup';

const detailsSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  email: z.string().trim().email('Enter a valid email'),
  phone: z.string().trim().min(1, 'Phone number is required'),
  company: z.string().trim().optional(),
  password: z.string().min(8, 'At least 8 characters'),
});
type Details = z.infer<typeof detailsSchema>;

const inputClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none';

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function clerkError(err: unknown): string {
  const e = err as { errors?: { message?: string; longMessage?: string }[] };
  return (
    e?.errors?.[0]?.longMessage ??
    e?.errors?.[0]?.message ??
    'Something went wrong. Please try again.'
  );
}

function SignUpInner() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const params = useSearchParams();
  const redirectUrl = params.get('redirect_url') ?? '/account';

  const [step, setStep] = useState<'details' | 'verify'>('details');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [details, setDetails] = useState<Details | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Details>({ resolver: zodResolver(detailsSchema) });

  async function onDetails(values: Details) {
    if (!isLoaded) return;
    setPending(true);
    setFormError(null);
    try {
      const { firstName, lastName } = splitFullName(values.fullName);
      await signUp.create({
        emailAddress: values.email,
        password: values.password,
        firstName,
        lastName,
        unsafeMetadata: {
          phone: values.phone,
          company: values.company ?? '',
          fullName: values.fullName,
        },
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setDetails(values);
      setStep('verify');
    } catch (err: unknown) {
      setFormError(clerkError(err));
    } finally {
      setPending(false);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !details) return;
    setPending(true);
    setFormError(null);
    try {
      const res = await signUp.attemptEmailAddressVerification({ code });
      if (res.status !== 'complete') {
        setFormError('Verification incomplete. Check the code and try again.');
        return;
      }
      await setActive({ session: res.createdSessionId });
      await completeSignup({
        fullName: details.fullName,
        phone: details.phone,
        company: details.company,
      });
      router.push(redirectUrl);
    } catch (err: unknown) {
      setFormError(clerkError(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Get your shipping mark and track every order.
      </p>

      {formError && (
        <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {formError}
        </p>
      )}

      {step === 'details' ? (
        <form onSubmit={handleSubmit(onDetails)} className="mt-6 space-y-4">
          <Field label="Full name" error={errors.fullName?.message}>
            <input className={inputClass} {...register('fullName')} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <input type="email" className={inputClass} {...register('email')} />
          </Field>
          <Field label="Phone number" error={errors.phone?.message}>
            <input className={inputClass} {...register('phone')} />
          </Field>
          <Field label="Company (optional)" error={errors.company?.message}>
            <input className={inputClass} {...register('company')} />
          </Field>
          <Field label="Password" error={errors.password?.message}>
            <input
              type="password"
              className={inputClass}
              {...register('password')}
            />
          </Field>
          {/* Clerk Smart CAPTCHA mount point */}
          <div id="clerk-captcha" />
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Creating…' : 'Create account'}
          </Button>
        </form>
      ) : (
        <form onSubmit={onVerify} className="mt-6 space-y-4">
          <p className="text-sm">
            We emailed a verification code to{' '}
            <span className="font-semibold">{details?.email}</span>.
          </p>
          <Field label="Verification code">
            <input
              className={inputClass}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
            />
          </Field>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Verifying…' : 'Verify & continue'}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpInner />
    </Suspense>
  );
}
