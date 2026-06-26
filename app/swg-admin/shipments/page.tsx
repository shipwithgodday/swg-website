'use client';
import { useState, useEffect } from 'react';
import { Ship } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ContainerTable } from '@/components/admin/ContainerTable';
import { AddContainerForm } from '@/components/admin/AddContainerForm';
import { EditEtaSheet } from '@/components/admin/EditEtaSheet';
import { MotionReveal } from '@/components/shared/MotionReveal';
import type { ContainerRow } from '@/lib/shipment/queries';

export default function AdminShipmentsPage() {
  const [containers, setContainers] = useState<ContainerRow[]>([]);
  const [editTarget, setEditTarget] = useState<ContainerRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  async function loadContainers() {
    fetch('/api/admin/containers')
      .then((r) => r.json())
      .then((rows: Array<Record<string, unknown>>) =>
        rows.map((r) => ({
          ...r,
          etaPort: r.etaPort ? new Date(r.etaPort as string) : null,
          etaWarehouse: r.etaWarehouse
            ? new Date(r.etaWarehouse as string)
            : null,
          arrivedAtPort: r.arrivedAtPort
            ? new Date(r.arrivedAtPort as string)
            : null,
          arrivedAtWarehouse: r.arrivedAtWarehouse
            ? new Date(r.arrivedAtWarehouse as string)
            : null,
          createdAt: new Date(r.createdAt as string),
          updatedAt: new Date(r.updatedAt as string),
        } as ContainerRow))
      )
      .then(setContainers)
      .catch(console.error);
  }

  useEffect(() => {
    loadContainers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleEdit(container: ContainerRow) {
    setEditTarget(container);
    setSheetOpen(true);
  }

  function handleSheetClose(open: boolean) {
    setSheetOpen(open);
    if (!open) {
      loadContainers();
    }
  }

  return (
    <div className="space-y-8">
      <MotionReveal>
        <AdminPageHeader
          title="Shipments"
          description="Manage container ETAs and track notification subscribers."
        >
          <Ship className="size-5 text-zinc-400" />
        </AdminPageHeader>
      </MotionReveal>

      <MotionReveal delay={0.05}>
        <ContainerTable
          containers={containers}
          onEdit={handleEdit}
          onArrivalMarked={loadContainers}
          onDeleted={loadContainers}
        />
      </MotionReveal>

      <MotionReveal delay={0.1}>
        <AddContainerForm onSuccess={loadContainers} />
      </MotionReveal>

      <EditEtaSheet
        container={editTarget}
        open={sheetOpen}
        onOpenChange={handleSheetClose}
      />
    </div>
  );
}
