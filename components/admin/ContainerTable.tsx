'use client';
import { useState } from 'react';
import { format } from 'date-fns';
import { Ship, Warehouse } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ContainerRow } from '@/lib/shipment/queries';

interface Props {
  containers: ContainerRow[];
  onEdit: (container: ContainerRow) => void;
  onArrivalMarked: () => void;
}

function formatDate(date: Date | null): string {
  if (!date) return 'Not set';
  return format(date, 'd MMM yyyy');
}

function EtaCell({
  containerId,
  eta,
  arrived,
  milestone,
  onArrivalMarked,
}: {
  containerId: string;
  eta: Date | null;
  arrived: Date | null;
  milestone: 'port' | 'warehouse';
  onArrivalMarked: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleMarkArrived() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/containers/${containerId}/arrive`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ milestone }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? 'Failed to mark arrived');
        return;
      }
      toast.success(
        milestone === 'port'
          ? 'Marked as arrived at Tema Port'
          : 'Marked as arrived at Ghana Warehouse'
      );
      onArrivalMarked();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (arrived) {
    return (
      <div>
        <p className="text-xs text-zinc-400 line-through">{formatDate(eta)}</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
          ✓ Arrived {formatDate(arrived)}
        </span>
      </div>
    );
  }

  return (
    <div>
      <p className={eta ? 'text-sm text-zinc-900' : 'text-sm text-zinc-400'}>
        {formatDate(eta)}
      </p>
      {eta && (
        <button
          type="button"
          onClick={handleMarkArrived}
          disabled={loading}
          className="mt-0.5 text-xs text-zinc-400 underline hover:text-zinc-700 disabled:opacity-50 transition-colors">
          {loading ? 'Saving…' : 'Mark arrived'}
        </button>
      )}
    </div>
  );
}

export function ContainerTable({ containers, onEdit, onArrivalMarked }: Props) {
  if (containers.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200/70 bg-white p-10 text-center shadow-sm">
        <Ship className="mx-auto mb-3 size-8 text-zinc-300" />
        <p className="text-sm text-zinc-400">No containers yet. Add one below.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-50">
            <TableHead>Container</TableHead>
            <TableHead>
              <span className="flex items-center gap-1.5">
                <Ship className="size-3.5" /> Tema Port
              </span>
            </TableHead>
            <TableHead>
              <span className="flex items-center gap-1.5">
                <Warehouse className="size-3.5" /> Ghana Warehouse
              </span>
            </TableHead>
            <TableHead className="text-right">Subscribers</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {containers.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-mono font-semibold text-zinc-900">
                {c.containerNumber}
              </TableCell>
              <TableCell>
                <EtaCell
                  containerId={c.id}
                  eta={c.etaPort}
                  arrived={c.arrivedAtPort}
                  milestone="port"
                  onArrivalMarked={onArrivalMarked}
                />
              </TableCell>
              <TableCell>
                <EtaCell
                  containerId={c.id}
                  eta={c.etaWarehouse}
                  arrived={c.arrivedAtWarehouse}
                  milestone="warehouse"
                  onArrivalMarked={onArrivalMarked}
                />
              </TableCell>
              <TableCell className="text-right tabular-nums text-zinc-600">
                {c.subscriberCount}
              </TableCell>
              <TableCell className="text-right">
                <button
                  type="button"
                  onClick={() => onEdit(c)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors">
                  Edit ETAs
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
