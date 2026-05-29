'use client';
import { format } from 'date-fns';
import { Ship } from 'lucide-react';
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
}

function formatEta(date: Date | null): string {
  if (!date) return 'Not set';
  return format(new Date(date), 'd MMM yyyy');
}

export function ContainerTable({ containers, onEdit }: Props) {
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
            <TableHead>ETA — Tema Port</TableHead>
            <TableHead>ETA — Ghana Warehouse</TableHead>
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
              <TableCell className={c.etaPort ? 'text-zinc-900' : 'text-zinc-400'}>
                {formatEta(c.etaPort)}
              </TableCell>
              <TableCell className={c.etaWarehouse ? 'text-zinc-900' : 'text-zinc-400'}>
                {formatEta(c.etaWarehouse)}
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
