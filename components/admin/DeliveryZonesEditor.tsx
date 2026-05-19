'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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

function ZoneRow({ zone }: { zone?: Zone }) {
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
    <div className="grid grid-cols-[1fr_8rem_5rem_auto] items-center gap-3 rounded-md border border-border p-3">
      <Input
        value={name}
        placeholder="Region name"
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        type="number"
        min="0"
        step="0.01"
        value={feeCedis}
        placeholder="Fee (GHS)"
        onChange={(e) => setFeeCedis(e.target.value)}
      />
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={active}
          onCheckedChange={(c) => setActive(c === true)}
        />
        Active
      </label>
      <Button size="sm" disabled={pending || !name} onClick={save}>
        {pending ? '…' : zone ? 'Save' : 'Add'}
      </Button>
    </div>
  );
}

export function DeliveryZonesEditor({ zones }: { zones: Zone[] }) {
  return (
    <div className="space-y-3">
      {zones.map((z) => (
        <ZoneRow key={z.id} zone={z} />
      ))}
      <div>
        <p className="mb-2 mt-6 text-sm font-medium">Add a zone</p>
        <ZoneRow />
      </div>
    </div>
  );
}
