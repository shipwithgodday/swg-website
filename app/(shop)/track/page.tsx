'use client';
import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Ship, Warehouse, Loader2 } from 'lucide-react';
import { PageHero } from '@/components/shared/PageHero';
import Container from '@/components/shared/container';
import { MotionReveal } from '@/components/shared/MotionReveal';

type TrackResult =
  | {
      found: true;
      invoiceNumber: string;
      containerNumber: string;
      customer: {
        name: string | null;
        hasEmail: boolean;
        maskedEmail: string | null;
      } | null;
      etaPort: string | null;
      etaWarehouse: string | null;
      arrivedAtPort: string | null;
      arrivedAtWarehouse: string | null;
    }
  | { found: false };

type Step = 'input' | 'loading' | 'result' | 'not-found';
type NotifyStep = 'idle' | 'confirming' | 'submitting' | 'done';

function formatEta(iso: string | null): string {
  if (!iso) return 'To be confirmed';
  return format(new Date(iso), 'EEEE, d MMMM yyyy');
}

export default function TrackPage() {
  const [invoice, setInvoice] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [result, setResult] = useState<Extract<TrackResult, { found: true }> | null>(null);
  const [notifyStep, setNotifyStep] = useState<NotifyStep>('idle');
  const [emailInput, setEmailInput] = useState('');

  const needsEmailInput = result && !result.customer?.hasEmail;
  const isSubmitting = notifyStep === 'submitting';

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = invoice.trim().toUpperCase();
    if (!trimmed) return;
    setInvoice(trimmed);
    setStep('loading');
    setNotifyStep('idle');
    setEmailInput('');

    try {
      const res = await fetch(
        `/api/track?invoice=${encodeURIComponent(trimmed)}`
      );
      const data: TrackResult = await res.json();
      if (data.found) {
        setResult(data);
        setStep('result');
      } else {
        setResult(null);
        setStep('not-found');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
      setStep('input');
    }
  }

  async function handleSubscribe() {
    if (!result?.found) return;
    setNotifyStep('submitting');

    const body: { invoiceNumber: string; emailOverride?: string } = {
      invoiceNumber: result.invoiceNumber,
    };
    if (needsEmailInput) body.emailOverride = emailInput.trim();

    try {
      const res = await fetch('/api/track/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? 'Could not subscribe. Please try again.');
        setNotifyStep('confirming');
        return;
      }
      setNotifyStep('done');
      toast.success("You're all set! We'll email you with updates.");
    } catch {
      toast.error('Something went wrong. Please try again.');
      setNotifyStep('confirming');
    }
  }

  return (
    <>
      <PageHero
        title="Track Your Shipment"
        highlightedWord="Shipment"
        subtitle="Enter your invoice number to see your container's estimated arrival dates."
      />

      <Container className="py-12 md:py-20">
        {/* Step 1: Input (also shown during loading) */}
        {(step === 'input' || step === 'loading') && (
          <MotionReveal className="mx-auto max-w-md">
            <form onSubmit={handleTrack} className="space-y-4">
              <div>
                <label
                  htmlFor="invoice"
                  className="block text-sm font-medium text-zinc-700">
                  Invoice Number
                </label>
                <input
                  id="invoice"
                  type="text"
                  value={invoice}
                  onChange={(e) => setInvoice(e.target.value)}
                  placeholder="e.g. C5GD01"
                  disabled={step === 'loading'}
                  className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={step === 'loading' || !invoice.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-zinc-950 shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50">
                {step === 'loading' ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Tracking…
                  </>
                ) : (
                  'Track'
                )}
              </button>
            </form>
          </MotionReveal>
        )}

        {/* Loading skeleton */}
        {step === 'loading' && (
          <MotionReveal className="mx-auto mt-8 max-w-md">
            <div className="animate-pulse space-y-3 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
              <div className="h-4 w-1/3 rounded bg-zinc-100" />
              <div className="h-4 w-2/3 rounded bg-zinc-100" />
              <div className="h-4 w-1/2 rounded bg-zinc-100" />
            </div>
          </MotionReveal>
        )}

        {/* Step 3a: Result found */}
        {step === 'result' && result && (
          <MotionReveal className="mx-auto max-w-lg space-y-6">
            <div className="rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <span className="font-mono text-xs font-semibold tracking-widest text-zinc-500 uppercase">
                    Invoice
                  </span>
                  <p className="mt-1 font-mono text-lg font-bold text-zinc-900">
                    {result.invoiceNumber}
                  </p>
                </div>
                {result.customer?.name && (
                  <div className="text-right">
                    <span className="text-xs text-zinc-400">Customer</span>
                    <p className="text-sm font-medium text-zinc-900">
                      {result.customer.name}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t border-zinc-100 pt-4">
                <div className="flex items-center gap-3">
                  <Ship className="size-5 shrink-0 text-[#00254F]" />
                  <div>
                    <p className="text-xs font-medium text-zinc-500">
                      {result.arrivedAtPort ? 'Arrived — Tema Port' : 'ETA — Tema Port'}
                    </p>
                    {result.arrivedAtPort ? (
                      <p className="text-sm font-semibold text-green-700">
                        ✓ Arrived {format(new Date(result.arrivedAtPort), 'd MMMM yyyy')}
                      </p>
                    ) : (
                      <p className="text-sm font-semibold text-zinc-900">
                        {formatEta(result.etaPort)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Warehouse className="size-5 shrink-0 text-[#00254F]" />
                  <div>
                    <p className="text-xs font-medium text-zinc-500">
                      {result.arrivedAtWarehouse ? 'Arrived — Ghana Warehouse' : 'ETA — Ghana Warehouse'}
                    </p>
                    {result.arrivedAtWarehouse ? (
                      <p className="text-sm font-semibold text-green-700">
                        ✓ Arrived {format(new Date(result.arrivedAtWarehouse), 'd MMMM yyyy')}
                      </p>
                    ) : (
                      <p className="text-sm font-semibold text-zinc-900">
                        {formatEta(result.etaWarehouse)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notify Me flow */}
              {notifyStep === 'idle' && (
                <button
                  type="button"
                  onClick={() => setNotifyStep('confirming')}
                  className="mt-5 w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50">
                  Notify Me of Updates
                </button>
              )}

              {notifyStep === 'confirming' && (
                <div className="mt-5 space-y-3 rounded-lg bg-zinc-50 p-4">
                  {result.customer?.hasEmail && result.customer.maskedEmail && (
                    <p className="text-sm text-zinc-600">
                      We&apos;ll send updates to{' '}
                      <strong>{result.customer.maskedEmail}</strong>
                    </p>
                  )}
                  {needsEmailInput && (
                    <div>
                      <p className="mb-1.5 text-sm text-zinc-600">
                        We don&apos;t have an email on file for you. Please enter
                        one to receive notifications.
                      </p>
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="your@email.com"
                        className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSubscribe}
                      disabled={
                        isSubmitting ||
                        (!!needsEmailInput && !emailInput.trim())
                      }
                      className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90 disabled:opacity-50">
                      {isSubmitting ? 'Subscribing…' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotifyStep('idle')}
                      className="text-sm text-zinc-500 underline">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {notifyStep === 'done' && (
                <p className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
                  You&apos;re subscribed! We&apos;ll email you when ETAs are updated.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setStep('input');
                setInvoice('');
                setResult(null);
                setNotifyStep('idle');
                setEmailInput('');
              }}
              className="block w-full text-center text-sm text-zinc-500 underline">
              Track a different invoice
            </button>
          </MotionReveal>
        )}

        {/* Step 3b: Not found */}
        {step === 'not-found' && (
          <MotionReveal className="mx-auto max-w-md text-center">
            <div className="rounded-2xl border border-zinc-200/70 bg-white p-8 shadow-sm">
              <p className="text-zinc-700">
                We couldn&apos;t find a shipment for that invoice number. Please
                double-check and try again.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStep('input');
                  setInvoice('');
                }}
                className="mt-4 text-sm font-medium text-primary underline">
                Try Again
              </button>
            </div>
          </MotionReveal>
        )}
      </Container>
    </>
  );
}
