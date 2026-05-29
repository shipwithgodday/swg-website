'use client';
import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Ship, Warehouse, Loader2, Plus, X } from 'lucide-react';
import { PageHero } from '@/components/shared/PageHero';
import Container from '@/components/shared/container';
import { MotionReveal } from '@/components/shared/MotionReveal';

const MAX_INVOICES = 5;

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

type ResultEntry = {
  invoice: string;
  status: 'loading' | 'found' | 'not-found' | 'error';
  data?: Extract<TrackResult, { found: true }>;
};

type NotifyStep = 'idle' | 'confirming' | 'submitting' | 'done';
type NotifyAllStep = 'idle' | 'confirming' | 'submitting' | 'done';

function formatEta(iso: string | null): string {
  if (!iso) return 'To be confirmed';
  return format(new Date(iso), 'EEEE, d MMMM yyyy');
}

interface ResultCardProps {
  entry: ResultEntry;
  notifyStep: NotifyStep;
  emailInput: string;
  onEmailChange: (v: string) => void;
  onNotifyStart: () => void;
  onNotifySubmit: () => void;
  onNotifyCancel: () => void;
}

function ResultCard({
  entry,
  notifyStep,
  emailInput,
  onEmailChange,
  onNotifyStart,
  onNotifySubmit,
  onNotifyCancel,
}: ResultCardProps) {
  if (entry.status === 'loading') {
    return (
      <div className="animate-pulse space-y-3 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <div className="h-4 w-1/3 rounded bg-zinc-100" />
        <div className="h-4 w-2/3 rounded bg-zinc-100" />
        <div className="h-4 w-1/2 rounded bg-zinc-100" />
      </div>
    );
  }

  if (entry.status !== 'found' || !entry.data) {
    return (
      <div className="rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm">
        <p className="font-mono text-xs font-semibold tracking-widest text-zinc-500 uppercase">
          {entry.invoice}
        </p>
        <p className="mt-2 text-sm text-zinc-700">
          {entry.status === 'error'
            ? 'Something went wrong looking up this invoice.'
            : 'No shipment found for this invoice number.'}
        </p>
      </div>
    );
  }

  const result = entry.data;
  const needsEmailInput = !result.customer?.hasEmail;
  const isSubmitting = notifyStep === 'submitting';

  return (
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
              {result.arrivedAtWarehouse
                ? 'Arrived — Ghana Warehouse'
                : 'ETA — Ghana Warehouse'}
            </p>
            {result.arrivedAtWarehouse ? (
              <p className="text-sm font-semibold text-green-700">
                ✓ Arrived{' '}
                {format(new Date(result.arrivedAtWarehouse), 'd MMMM yyyy')}
              </p>
            ) : (
              <p className="text-sm font-semibold text-zinc-900">
                {formatEta(result.etaWarehouse)}
              </p>
            )}
          </div>
        </div>
      </div>

      {notifyStep === 'idle' && (
        <button
          type="button"
          onClick={onNotifyStart}
          className="mt-5 w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50">
          Notify Me of Updates
        </button>
      )}

      {(notifyStep === 'confirming' || notifyStep === 'submitting') && (
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
                We don&apos;t have an email on file for you. Please enter one to
                receive notifications.
              </p>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="your@email.com"
                disabled={isSubmitting}
                className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onNotifySubmit}
              disabled={isSubmitting || (needsEmailInput && !emailInput.trim())}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90 disabled:opacity-50">
              {isSubmitting ? 'Subscribing…' : 'Confirm'}
            </button>
            <button
              type="button"
              onClick={onNotifyCancel}
              disabled={isSubmitting}
              className="text-sm text-zinc-500 underline disabled:opacity-50">
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
  );
}

export default function TrackPage() {
  const [invoices, setInvoices] = useState<string[]>(['']);
  const [isTracking, setIsTracking] = useState(false);
  const [entries, setEntries] = useState<ResultEntry[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [notifySteps, setNotifySteps] = useState<NotifyStep[]>([]);
  const [emailInputs, setEmailInputs] = useState<string[]>([]);
  const [notifyAllStep, setNotifyAllStep] = useState<NotifyAllStep>('idle');
  const [notifyAllEmail, setNotifyAllEmail] = useState('');

  const unsubscribedFoundIndices = entries.reduce<number[]>((acc, e, i) => {
    if (e.status === 'found' && notifySteps[i] !== 'done') acc.push(i);
    return acc;
  }, []);
  const showNotifyAll =
    unsubscribedFoundIndices.length >= 2 && notifyAllStep !== 'done';
  const anyFoundNeedsEmail = unsubscribedFoundIndices.some(
    (i) => !entries[i]?.data?.customer?.hasEmail
  );

  function addInvoice() {
    if (invoices.length >= MAX_INVOICES) return;
    setInvoices((prev) => [...prev, '']);
  }

  function removeInvoice(idx: number) {
    setInvoices((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateInvoice(idx: number, val: string) {
    setInvoices((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  }

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = invoices
      .map((inv) => inv.trim().toUpperCase())
      .filter(Boolean);
    if (!trimmed.length) return;

    setIsTracking(true);
    setShowResults(true);
    setNotifyAllStep('idle');
    setNotifyAllEmail('');
    setEntries(trimmed.map((invoice) => ({ invoice, status: 'loading' })));
    setNotifySteps(trimmed.map(() => 'idle'));
    setEmailInputs(trimmed.map(() => ''));

    const results = await Promise.allSettled(
      trimmed.map((inv) =>
        fetch(`/api/track?invoice=${encodeURIComponent(inv)}`).then(
          (r) => r.json() as Promise<TrackResult>
        )
      )
    );

    setEntries(
      results.map((r, i) => {
        if (r.status === 'rejected')
          return { invoice: trimmed[i], status: 'error' };
        const data = r.value;
        if (data.found) return { invoice: trimmed[i], status: 'found', data };
        return { invoice: trimmed[i], status: 'not-found' };
      })
    );
    setIsTracking(false);
  }

  async function handleSubscribe(idx: number) {
    const entry = entries[idx];
    if (entry.status !== 'found' || !entry.data) return;

    const setStep = (s: NotifyStep) =>
      setNotifySteps((prev) => {
        const next = [...prev];
        next[idx] = s;
        return next;
      });

    setStep('submitting');
    const body: { invoiceNumber: string; emailOverride?: string } = {
      invoiceNumber: entry.data.invoiceNumber,
    };
    if (!entry.data.customer?.hasEmail)
      body.emailOverride = emailInputs[idx].trim();

    try {
      const res = await fetch('/api/track/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? 'Could not subscribe. Please try again.');
        setStep('confirming');
        return;
      }
      setStep('done');
      toast.success("You're all set! We'll email you with updates.");
    } catch {
      toast.error('Something went wrong. Please try again.');
      setStep('confirming');
    }
  }

  async function handleNotifyAll() {
    setNotifyAllStep('submitting');

    const targets = unsubscribedFoundIndices.map((i) => ({
      idx: i,
      entry: entries[i],
    }));

    const results = await Promise.allSettled(
      targets.map(async ({ idx, entry }) => {
        const body: { invoiceNumber: string; emailOverride?: string } = {
          invoiceNumber: entry.data!.invoiceNumber,
        };
        if (!entry.data!.customer?.hasEmail)
          body.emailOverride = notifyAllEmail.trim();
        const res = await fetch('/api/track/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? 'Failed');
        }
        return idx;
      })
    );

    const successIndices = results
      .map((r, j) => (r.status === 'fulfilled' ? targets[j].idx : -1))
      .filter((i) => i !== -1);

    setNotifySteps((prev) => {
      const next = [...prev];
      successIndices.forEach((i) => {
        next[i] = 'done';
      });
      return next;
    });

    const failCount = results.filter((r) => r.status === 'rejected').length;
    if (failCount === 0) {
      setNotifyAllStep('done');
      toast.success("You're subscribed to all shipments!");
    } else if (successIndices.length > 0) {
      setNotifyAllStep('done');
      toast.warning(
        `Subscribed to ${successIndices.length} of ${targets.length} shipments.`
      );
    } else {
      toast.error('Could not subscribe. Please try again.');
      setNotifyAllStep('confirming');
    }
  }

  const canSubmit = invoices.some((inv) => inv.trim());

  return (
    <>
      <PageHero
        title="Track Your Shipments"
        highlightedWord="Shipments"
        subtitle="Enter your invoice numbers to see your containers' estimated arrival dates."
      />

      <Container className="py-12 md:py-20">
        <MotionReveal className="mx-auto max-w-md">
          <form onSubmit={handleTrack} className="space-y-3">
            {invoices.map((inv, idx) => (
              <div key={idx} className="flex items-end gap-2">
                <div className="flex-1">
                  {idx === 0 && (
                    <label
                      htmlFor="invoice-0"
                      className="mb-1 block text-sm font-medium text-zinc-700">
                      Invoice Number{invoices.length > 1 ? 's' : ''}
                    </label>
                  )}
                  <input
                    id={idx === 0 ? 'invoice-0' : undefined}
                    type="text"
                    value={inv}
                    onChange={(e) => updateInvoice(idx, e.target.value)}
                    placeholder="e.g. C5GD01"
                    disabled={isTracking}
                    className="block w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                  />
                </div>
                {invoices.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInvoice(idx)}
                    disabled={isTracking}
                    aria-label="Remove"
                    className="rounded-lg p-2.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-50">
                    <X className="size-4" />
                  </button>
                )}
              </div>
            ))}

            <div className="flex flex-col gap-3 pt-1">
              {invoices.length < MAX_INVOICES && (
                <button
                  type="button"
                  onClick={addInvoice}
                  disabled={isTracking}
                  className="flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-700 disabled:opacity-50">
                  <Plus className="size-4" />
                  Add another
                </button>
              )}
              <button
                type="submit"
                disabled={!canSubmit || isTracking}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-zinc-950 shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50">
                {isTracking ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Tracking…
                  </>
                ) : (
                  'Track'
                )}
              </button>
            </div>
          </form>
        </MotionReveal>

        {showResults && (
          <MotionReveal className="mx-auto mt-10 max-w-lg space-y-4">
            {entries.map((entry, idx) => (
              <ResultCard
                key={`${entry.invoice}-${idx}`}
                entry={entry}
                notifyStep={notifySteps[idx] ?? 'idle'}
                emailInput={emailInputs[idx] ?? ''}
                onEmailChange={(val) =>
                  setEmailInputs((prev) => {
                    const next = [...prev];
                    next[idx] = val;
                    return next;
                  })
                }
                onNotifyStart={() =>
                  setNotifySteps((prev) => {
                    const next = [...prev];
                    next[idx] = 'confirming';
                    return next;
                  })
                }
                onNotifySubmit={() => handleSubscribe(idx)}
                onNotifyCancel={() =>
                  setNotifySteps((prev) => {
                    const next = [...prev];
                    next[idx] = 'idle';
                    return next;
                  })
                }
              />
            ))}

            {showNotifyAll && (
              <div className="rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm">
                {notifyAllStep === 'idle' && (
                  <button
                    type="button"
                    onClick={() => setNotifyAllStep('confirming')}
                    className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50">
                    Notify Me for All Shipments
                  </button>
                )}

                {(notifyAllStep === 'confirming' ||
                  notifyAllStep === 'submitting') && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-zinc-700">
                      Subscribe to updates for{' '}
                      {unsubscribedFoundIndices.length} shipments
                    </p>
                    {anyFoundNeedsEmail && (
                      <div>
                        <p className="mb-1.5 text-sm text-zinc-600">
                          One or more shipments don&apos;t have an email on
                          file. Enter one for those:
                        </p>
                        <input
                          type="email"
                          value={notifyAllEmail}
                          onChange={(e) => setNotifyAllEmail(e.target.value)}
                          placeholder="your@email.com"
                          disabled={notifyAllStep === 'submitting'}
                          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleNotifyAll}
                        disabled={
                          notifyAllStep === 'submitting' ||
                          (anyFoundNeedsEmail && !notifyAllEmail.trim())
                        }
                        className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90 disabled:opacity-50">
                        {notifyAllStep === 'submitting'
                          ? 'Subscribing…'
                          : 'Confirm All'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotifyAllStep('idle')}
                        disabled={notifyAllStep === 'submitting'}
                        className="text-sm text-zinc-500 underline disabled:opacity-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {notifyAllStep === 'done' && (
                  <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
                    You&apos;re subscribed to all shipments!
                  </p>
                )}
              </div>
            )}
          </MotionReveal>
        )}
      </Container>
    </>
  );
}
