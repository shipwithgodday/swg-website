'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Ship, Warehouse, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/admin/ui/textarea';
import { Button } from '@/components/admin/ui/button';
import { cn } from '@/lib/utils';
import type { ContainerRow } from '@/lib/shipment/queries';

interface Props {
  container: ContainerRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Tab = 'port' | 'warehouse';

function formatShort(date: Date | null | undefined): string {
  if (!date) return 'Not set';
  return format(date, 'd MMM yyyy');
}

function formatLong(date: Date | null | undefined): string {
  if (!date) return 'No date selected';
  return format(date, 'EEEE, d MMMM yyyy');
}

export function EditEtaSheet({ container, open, onOpenChange }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('port');
  const [etaPort, setEtaPort] = useState<Date | undefined>();
  const [etaWarehouse, setEtaWarehouse] = useState<Date | undefined>();
  const [portReason, setPortReason] = useState('');
  const [warehouseReason, setWarehouseReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && container) {
      setTab('port');
      setEtaPort(container.etaPort ? new Date(container.etaPort) : undefined);
      setEtaWarehouse(
        container.etaWarehouse ? new Date(container.etaWarehouse) : undefined
      );
      setPortReason('');
      setWarehouseReason('');
    }
  }, [container, open]);

  const originalPort = container?.etaPort ? new Date(container.etaPort) : null;
  const originalWarehouse = container?.etaWarehouse
    ? new Date(container.etaWarehouse)
    : null;

  const portChanged =
    originalPort !== null &&
    etaPort !== undefined &&
    etaPort.getTime() !== originalPort.getTime();
  const warehouseChanged =
    originalWarehouse !== null &&
    etaWarehouse !== undefined &&
    etaWarehouse.getTime() !== originalWarehouse.getTime();

  async function handleSave() {
    if (!container) return;
    setLoading(true);

    const body: Record<string, unknown> = {};
    if (etaPort !== undefined) body.etaPort = etaPort.toISOString();
    if (etaWarehouse !== undefined)
      body.etaWarehouse = etaWarehouse.toISOString();
    if (portChanged && portReason.trim())
      body.etaPortReason = portReason.trim();
    if (warehouseChanged && warehouseReason.trim())
      body.etaWarehouseReason = warehouseReason.trim();

    try {
      const res = await fetch(`/api/admin/containers/${container.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? 'Failed to save');
        return;
      }
      toast.success('ETAs updated');
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md">

        {/* Dark header — matches sidebar aesthetic */}
        <div className="bg-zinc-950 px-5 pb-5 pt-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                Container
              </p>
              <SheetTitle className="font-mono text-2xl font-bold text-white">
                {container?.containerNumber ?? '—'}
              </SheetTitle>
            </div>
            <SheetDescription className="sr-only">
              Set or update arrival dates for this container.
            </SheetDescription>
          </div>

          {/* ETA status row */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab('port')}
              className={cn(
                'flex flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all',
                tab === 'port'
                  ? 'border-zinc-700 bg-zinc-800'
                  : 'border-zinc-800 bg-zinc-900 opacity-60 hover:opacity-80'
              )}>
              <Ship className="size-3.5 shrink-0 text-zinc-400" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  Tema Port
                </p>
                <p className={cn(
                  'truncate text-xs font-semibold',
                  etaPort ? 'text-primary' : 'text-zinc-600'
                )}>
                  {formatShort(etaPort)}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTab('warehouse')}
              className={cn(
                'flex flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all',
                tab === 'warehouse'
                  ? 'border-zinc-700 bg-zinc-800'
                  : 'border-zinc-800 bg-zinc-900 opacity-60 hover:opacity-80'
              )}>
              <Warehouse className="size-3.5 shrink-0 text-zinc-400" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  Warehouse
                </p>
                <p className={cn(
                  'truncate text-xs font-semibold',
                  etaWarehouse ? 'text-primary' : 'text-zinc-600'
                )}>
                  {formatShort(etaWarehouse)}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Selected date display */}
          <div className="border-b border-zinc-100 bg-zinc-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-3.5 shrink-0 text-zinc-400" />
              <p className={cn(
                'text-sm font-medium',
                (tab === 'port' ? etaPort : etaWarehouse)
                  ? 'text-zinc-900'
                  : 'text-zinc-400'
              )}>
                {tab === 'port'
                  ? formatLong(etaPort)
                  : formatLong(etaWarehouse)}
              </p>
            </div>
          </div>

          {/* Calendar */}
          <div className="px-4 py-4">
            {tab === 'port' && (
              <Calendar
                mode="single"
                selected={etaPort}
                onSelect={setEtaPort}
                className="w-full"
              />
            )}
            {tab === 'warehouse' && (
              <Calendar
                mode="single"
                selected={etaWarehouse}
                onSelect={setEtaWarehouse}
                className="w-full"
              />
            )}
          </div>

          {/* Reason field — only when changing a previously set date */}
          {tab === 'port' && portChanged && (
            <div className="mx-4 mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <label className="mb-1.5 block text-xs font-medium text-amber-800">
                Why is this date changing? (optional)
              </label>
              <Textarea
                value={portReason}
                onChange={(e) => setPortReason(e.target.value)}
                placeholder="e.g. Vessel delayed at Lomé"
                rows={2}
                className="border-amber-200 bg-white focus-visible:border-amber-400 focus-visible:ring-amber-900/10"
              />
            </div>
          )}
          {tab === 'warehouse' && warehouseChanged && (
            <div className="mx-4 mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <label className="mb-1.5 block text-xs font-medium text-amber-800">
                Why is this date changing? (optional)
              </label>
              <Textarea
                value={warehouseReason}
                onChange={(e) => setWarehouseReason(e.target.value)}
                placeholder="e.g. Customs clearance delay"
                rows={2}
                className="border-amber-200 bg-white focus-visible:border-amber-400 focus-visible:ring-amber-900/10"
              />
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="border-t border-zinc-100 bg-white px-4 py-3">
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={loading}
              variant="gold"
              className="flex-1">
              {loading ? 'Saving…' : 'Save Changes'}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}>
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
