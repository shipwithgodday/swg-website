'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';

export interface VariantRow {
  id?: string;
  name: string;
  sku: string;
  priceCedis: string;
  stockQuantity: string;
}

export const emptyVariant: VariantRow = {
  name: '',
  sku: '',
  priceCedis: '',
  stockQuantity: '0',
};

interface Props {
  variants: VariantRow[];
  onChange: (next: VariantRow[]) => void;
}

export function VariantEditor({ variants, onChange }: Props) {
  function update(i: number, patch: Partial<VariantRow>) {
    onChange(variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }
  return (
    <div className="space-y-4">
      <Label>Variants</Label>
      {variants.map((v, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 items-end rounded-md border p-3">
          <div className="space-y-1">
            <Label className="text-xs">Name</Label>
            <Input
              value={v.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="e.g. Large"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">SKU</Label>
            <Input
              value={v.sku}
              onChange={(e) => update(i, { sku: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Price (GHS)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={v.priceCedis}
              onChange={(e) => update(i, { priceCedis: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Stock</Label>
            <Input
              type="number"
              min="0"
              value={v.stockQuantity}
              onChange={(e) =>
                update(i, { stockQuantity: e.target.value })
              }
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={variants.length === 1}
            onClick={() =>
              onChange(variants.filter((_, idx) => idx !== i))
            }>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...variants, { ...emptyVariant }])}>
        Add variant
      </Button>
    </div>
  );
}
