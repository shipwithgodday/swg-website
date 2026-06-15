'use client';

import { useState, useTransition } from 'react';
import { deleteBooking } from '@/app/actions/bookingAvailability';

export interface BookingRow {
  id: string;
  date: string;
  time: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  desiredService: string;
  meetingType: string;
}

function Row({
  b,
  onDelete,
  pending,
}: {
  b: BookingRow;
  onDelete: (id: string) => void;
  pending: boolean;
}) {
  return (
    <tr className="border-b border-zinc-100 last:border-0">
      <td className="px-3 py-2 text-sm font-medium text-zinc-800">
        {b.date}
        <span className="ml-2 text-zinc-500">{b.time}</span>
      </td>
      <td className="px-3 py-2 text-sm text-zinc-700">{b.fullName}</td>
      <td className="px-3 py-2 text-sm text-zinc-500">
        <div>{b.email}</div>
        <div>{b.phoneNumber}</div>
      </td>
      <td className="px-3 py-2 text-sm text-zinc-600">{b.desiredService}</td>
      <td className="px-3 py-2 text-sm text-zinc-600">{b.meetingType}</td>
      <td className="px-3 py-2 text-right">
        <button
          type="button"
          onClick={() => onDelete(b.id)}
          disabled={pending}
          className="text-xs font-medium text-red-600 hover:underline disabled:opacity-40"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

export function BookingsList({
  upcoming,
  past,
}: {
  upcoming: BookingRow[];
  past: BookingRow[];
}) {
  const [showPast, setShowPast] = useState(false);
  const [upcomingRows, setUpcomingRows] = useState(upcoming);
  const [pastRows, setPastRows] = useState(past);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onDelete(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await deleteBooking(id);
      if (res.ok) {
        setUpcomingRows((prev) => prev.filter((b) => b.id !== id));
        setPastRows((prev) => prev.filter((b) => b.id !== id));
      } else {
        setError(res.error);
      }
    });
  }

  const rows = showPast ? pastRows : upcomingRows;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">
          {showPast ? 'Past bookings' : 'Upcoming bookings'}
        </h3>
        <button
          type="button"
          onClick={() => setShowPast((v) => !v)}
          className="text-xs font-medium text-primary hover:underline"
        >
          {showPast ? 'Show upcoming' : 'Show past bookings'}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-400">
          {showPast ? 'No past bookings.' : 'No upcoming bookings.'}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-400">
                <th className="px-3 py-2 font-semibold">When</th>
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 font-semibold">Contact</th>
                <th className="px-3 py-2 font-semibold">Service</th>
                <th className="px-3 py-2 font-semibold">Type</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <Row key={b.id} b={b} onDelete={onDelete} pending={isPending} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </section>
  );
}
