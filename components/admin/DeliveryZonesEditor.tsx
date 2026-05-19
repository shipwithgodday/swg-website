'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  createDeliveryZone,
  updateDeliveryZone,
} from '@/app/actions/shop/delivery-zones';

interface Zone {
  id: string;
  name: string;
  fee: number; // pesewas
  active: boolean;
}

/** A single editable zone. `isNew` renders the create row at the bottom. */
function ZoneRow({ zone, isNew = false }: { zone?: Zone; isNew?: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(zone?.name ?? '');
  const [feeCedis, setFeeCedis] = useState(
    zone ? (zone.fee / 100).toFixed(2) : ''
  );
  const [active, setActive] = useState(zone?.active ?? true);
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      const payload = {
        name,
        fee: Math.round(parseFloat(feeCedis || '0') * 100),
        active,
      };
      const res = zone
        ? await updateDeliveryZone(zone.id, payload)
        : await createDeliveryZone(payload);
      if (res.ok) {
        toast.success(zone ? 'Zone updated' : 'Zone added');
        if (!zone) {
          setName('');
          setFeeCedis('');
          setActive(true);
        }
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 px-5 py-4',
        isNew &&
          'rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/70'
      )}>
      <Input
        value={name}
        placeholder="Region name"
        onChange={(e) => setName(e.target.value)}
        className="min-w-40 flex-1"
      />
      <div className="relative w-32">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-zinc-400">
          ₵
        </span>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={feeCedis}
          placeholder="Fee"
          onChange={(e) => setFeeCedis(e.target.value)}
          className="pl-7 text-right tabular-nums"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-600 select-none">
        <Checkbox
          checked={active}
          onCheckedChange={(c) => setActive(c === true)}
        />
        Active
      </label>
      <Button
        size="sm"
        variant={isNew ? 'gold' : 'outline'}
        disabled={pending || !name}
        onClick={save}>
        {isNew && <Plus className="size-4" />}
        {pending ? 'Saving…' : isNew ? 'Add zone' : 'Save'}
      </Button>
    </div>
  );
}

export function DeliveryZonesEditor({ zones }: { zones: Zone[] }) {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-5 py-3">
          <p className="text-sm font-semibold text-zinc-900">Zones</p>
          <p className="text-xs text-zinc-400 tabular-nums">
            {zones.length} {zones.length === 1 ? 'region' : 'regions'}
          </p>
        </div>
        {zones.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-400">
            No delivery zones yet. Add your first one below.
          </p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {zones.map((z) => (
              <ZoneRow key={z.id} zone={z} />
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-zinc-900">Add a zone</p>
        <ZoneRow isNew />
      </div>
    </div>
  );
}
