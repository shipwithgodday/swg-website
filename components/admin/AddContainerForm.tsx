'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Input } from '@/components/admin/ui/input';
import { Button } from '@/components/admin/ui/button';

export function AddContainerForm() {
  const router = useRouter();
  const [containerNumber, setContainerNumber] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = containerNumber.trim().toUpperCase();
    if (!num) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/containers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ containerNumber: num }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? 'Failed to add container');
        return;
      }
      toast.success(`Container ${num} added`);
      setContainerNumber('');
      router.refresh();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-zinc-900">
        Add new container
      </h2>
      <div className="flex gap-3">
        <Input
          placeholder="e.g. C5"
          value={containerNumber}
          onChange={(e) => setContainerNumber(e.target.value.toUpperCase())}
          className="w-40"
          required
        />
        <Button type="submit" disabled={loading || !containerNumber.trim()}>
          {loading ? 'Adding…' : 'Add Container'}
        </Button>
      </div>
    </form>
  );
}
