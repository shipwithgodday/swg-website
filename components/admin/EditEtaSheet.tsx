'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/admin/ui/textarea';
import { Button } from '@/components/admin/ui/button';
import type { ContainerRow } from '@/lib/shipment/queries';

interface Props {
  container: ContainerRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditEtaSheet({ container, open, onOpenChange }: Props) {
  const router = useRouter();
  const [etaPort, setEtaPort] = useState<Date | undefined>();
  const [etaWarehouse, setEtaWarehouse] = useState<Date | undefined>();
  const [portReason, setPortReason] = useState('');
  const [warehouseReason, setWarehouseReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && container) {
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
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="mb-6">
          <SheetTitle>Edit ETAs — {container?.containerNumber}</SheetTitle>
          <SheetDescription>
            Set or update arrival dates. A reason is recommended when changing
            a date that was already confirmed.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8">
          {/* ETA — Tema Port */}
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-900">
              ETA — Tema Port
            </p>
            <Calendar
              mode="single"
              selected={etaPort}
              onSelect={setEtaPort}
              className="rounded-lg border border-zinc-200"
            />
            {portChanged && (
              <div className="mt-3">
                <label className="mb-1 block text-xs text-zinc-500">
                  Why is this date changing? (optional)
                </label>
                <Textarea
                  value={portReason}
                  onChange={(e) => setPortReason(e.target.value)}
                  placeholder="e.g. Vessel delayed at Lomé"
                  rows={2}
                />
              </div>
            )}
          </div>

          {/* ETA — Ghana Warehouse */}
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-900">
              ETA — Ghana Warehouse
            </p>
            <Calendar
              mode="single"
              selected={etaWarehouse}
              onSelect={setEtaWarehouse}
              className="rounded-lg border border-zinc-200"
            />
            {warehouseChanged && (
              <div className="mt-3">
                <label className="mb-1 block text-xs text-zinc-500">
                  Why is this date changing? (optional)
                </label>
                <Textarea
                  value={warehouseReason}
                  onChange={(e) => setWarehouseReason(e.target.value)}
                  placeholder="e.g. Customs clearance delay"
                  rows={2}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={loading} className="flex-1">
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
