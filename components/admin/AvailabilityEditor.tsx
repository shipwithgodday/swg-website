'use client';

import { useState, useTransition } from 'react';
import {
  saveWeekdayHours,
  addBlackoutDate,
  removeBlackoutDate,
} from '@/app/actions/bookingAvailability';

const WEEKDAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export interface WeekdayRow {
  weekday: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  slotMinutes: number;
}

export interface BlackoutRow {
  id: string;
  date: string;
  reason: string | null;
}

export function AvailabilityEditor({
  initialHours,
  initialBlackouts,
}: {
  initialHours: WeekdayRow[];
  initialBlackouts: BlackoutRow[];
}) {
  // Ensure rows are ordered Sun→Sat for a stable display.
  const [rows, setRows] = useState<WeekdayRow[]>(
    [...initialHours].sort((a, b) => a.weekday - b.weekday)
  );
  const [blackouts, setBlackouts] = useState<BlackoutRow[]>(initialBlackouts);
  const [newDate, setNewDate] = useState('');
  const [newReason, setNewReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateRow(weekday: number, patch: Partial<WeekdayRow>) {
    setRows((prev) =>
      prev.map((r) => (r.weekday === weekday ? { ...r, ...patch } : r))
    );
  }

  function onSaveHours() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await saveWeekdayHours(rows);
      if (res.ok) setMessage('Availability saved.');
      else setError(res.error);
    });
  }

  function onAddBlackout() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await addBlackoutDate({
        date: newDate,
        reason: newReason || undefined,
      });
      if (res.ok) {
        // Optimistic local add; server revalidation will reconcile.
        setBlackouts((prev) =>
          [
            ...prev,
            { id: `tmp-${newDate}`, date: newDate, reason: newReason || null },
          ].sort((a, b) => a.date.localeCompare(b.date))
        );
        setNewDate('');
        setNewReason('');
        setMessage('Blackout date added.');
      } else {
        setError(res.error);
      }
    });
  }

  function onRemoveBlackout(id: string) {
    startTransition(async () => {
      const res = await removeBlackoutDate(id);
      if (res.ok) setBlackouts((prev) => prev.filter((b) => b.id !== id));
      else setError(res.error);
    });
  }

  return (
    <div className="space-y-8">
      {/* Weekly hours */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900">Weekly hours</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Slots are generated from the open time up to the close time in steps
          of the slot length. Close days you don&apos;t take calls.
        </p>
        <div className="mt-4 space-y-2">
          {rows.map((r) => (
            <div
              key={r.weekday}
              className="grid grid-cols-1 items-center gap-3 rounded-xl border border-zinc-100 p-3 sm:grid-cols-[8rem_auto_1fr]"
            >
              <span className="text-sm font-medium text-zinc-800">
                {WEEKDAY_LABELS[r.weekday]}
              </span>
              <label className="flex items-center gap-2 text-sm text-zinc-600">
                <input
                  type="checkbox"
                  checked={r.isOpen}
                  onChange={(e) =>
                    updateRow(r.weekday, { isOpen: e.target.checked })
                  }
                  className="size-4 accent-primary"
                />
                Open
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="time"
                  value={r.openTime}
                  disabled={!r.isOpen}
                  onChange={(e) =>
                    updateRow(r.weekday, { openTime: e.target.value })
                  }
                  className="rounded-lg border border-zinc-300 px-2 py-1 text-sm disabled:opacity-40"
                />
                <span className="text-zinc-400">to</span>
                <input
                  type="time"
                  value={r.closeTime}
                  disabled={!r.isOpen}
                  onChange={(e) =>
                    updateRow(r.weekday, { closeTime: e.target.value })
                  }
                  className="rounded-lg border border-zinc-300 px-2 py-1 text-sm disabled:opacity-40"
                />
                <label className="flex items-center gap-1 text-sm text-zinc-600">
                  <input
                    type="number"
                    min={5}
                    max={480}
                    step={5}
                    value={r.slotMinutes}
                    disabled={!r.isOpen}
                    onChange={(e) =>
                      updateRow(r.weekday, {
                        slotMinutes: Number(e.target.value),
                      })
                    }
                    className="w-20 rounded-lg border border-zinc-300 px-2 py-1 text-sm disabled:opacity-40"
                  />
                  min slots
                </label>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onSaveHours}
          disabled={isPending}
          className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save hours'}
        </button>
      </section>

      {/* Blackout dates */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900">Blackout dates</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Block specific days (holidays, time off). No slots show on these dates.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="rounded-lg border border-zinc-300 px-2 py-1 text-sm"
          />
          <input
            type="text"
            placeholder="Reason (optional)"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            className="min-w-48 flex-1 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={onAddBlackout}
            disabled={isPending || !newDate}
            className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
          >
            Add
          </button>
        </div>
        <ul className="mt-4 space-y-2">
          {blackouts.length === 0 && (
            <li className="text-sm text-zinc-400">No blackout dates.</li>
          )}
          {blackouts.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between rounded-xl border border-zinc-100 px-3 py-2 text-sm"
            >
              <span>
                <span className="font-medium text-zinc-800">{b.date}</span>
                {b.reason ? (
                  <span className="text-zinc-500"> — {b.reason}</span>
                ) : null}
              </span>
              <button
                type="button"
                onClick={() => onRemoveBlackout(b.id)}
                disabled={isPending || b.id.startsWith('tmp-')}
                className="text-xs font-medium text-red-600 hover:underline disabled:opacity-40"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>

      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
