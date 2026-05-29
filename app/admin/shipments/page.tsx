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

  useEffect(() => {
    fetch('/api/admin/containers')
      .then((r) => r.json())
      .then(setContainers)
      .catch(console.error);
  }, []);

  function handleEdit(container: ContainerRow) {
    setEditTarget(container);
    setSheetOpen(true);
  }

  function handleSheetClose(open: boolean) {
    setSheetOpen(open);
    if (!open) {
      fetch('/api/admin/containers')
        .then((r) => r.json())
        .then(setContainers)
        .catch(console.error);
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
        <ContainerTable containers={containers} onEdit={handleEdit} />
      </MotionReveal>

      <MotionReveal delay={0.1}>
        <AddContainerForm />
      </MotionReveal>

      <EditEtaSheet
        container={editTarget}
        open={sheetOpen}
        onOpenChange={handleSheetClose}
      />
    </div>
  );
}
