'use client';
import { useState } from 'react';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, X } from 'lucide-react';
import { generateSku } from '@/lib/shop/sku';

export interface OptionDraft {
  name: string;
  values: string[];
}

export interface VariantRow {
  id?: string;
  /** Ordered option values for this row; [] for a single default variant. */
  optionValues: string[];
  /** Derived display label kept in sync with optionValues. */
  name: string;
  /** Persisted SKU (preview only); undefined for not-yet-saved rows. */
  sku?: string;
  priceCedis: string;
  stockQuantity: string;
}

export interface VariantState {
  options: OptionDraft[];
  variants: VariantRow[];
}

const PRESET_OPTIONS = ['Size', 'Color', 'Material', 'Weight', 'Scent', 'Style'];
const LOW_STOCK_THRESHOLD = 5;
const MAX_OPTIONS = 2;

const comboKey = (values: string[]) => JSON.stringify(values);

/** Options that actually contribute variants (have at least one value). */
function readyOptions(options: OptionDraft[]): OptionDraft[] {
  return options.filter((o) => o.values.length > 0);
}

/** Cartesian product of each ready option's values. [] options → [[]]. */
function cartesian(options: OptionDraft[]): string[][] {
  return readyOptions(options).reduce<string[][]>(
    (acc, opt) => acc.flatMap((combo) => opt.values.map((v) => [...combo, v])),
    [[]]
  );
}

/**
 * Rebuild the variant rows for the current options, preserving the price,
 * stock, id and SKU of any combination that still exists. When moving from a
 * simple (option-less) product to variants, the simple product's price/stock
 * seed the freshly created rows.
 */
function regenerate(
  options: OptionDraft[],
  prev: VariantRow[]
): VariantRow[] {
  const byCombo = new Map(prev.map((v) => [comboKey(v.optionValues), v]));
  // The option-less default row, if we're transitioning away from simple.
  const seed = prev.find((v) => v.optionValues.length === 0);
  return cartesian(options).map((combo) => {
    const existing = byCombo.get(comboKey(combo));
    const carried = combo.length ? seed : undefined;
    return {
      id: existing?.id,
      sku: existing?.sku,
      optionValues: combo,
      name: combo.length
        ? combo.join(' / ')
        : (existing?.name ?? 'Default'),
      priceCedis: existing?.priceCedis ?? carried?.priceCedis ?? '',
      stockQuantity:
        existing?.stockQuantity ?? carried?.stockQuantity ?? '0',
    };
  });
}

interface Props {
  productName: string;
  value: VariantState;
  onChange: (next: VariantState) => void;
}

export function VariantEditor({ productName, value, onChange }: Props) {
  const { options, variants } = value;
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkStock, setBulkStock] = useState('');

  function apply(nextOptions: OptionDraft[]) {
    onChange({
      options: nextOptions,
      variants: regenerate(nextOptions, variants),
    });
  }

  function setOptions(updater: (opts: OptionDraft[]) => OptionDraft[]) {
    apply(updater(options));
  }

  function addOption() {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((opts) => [...opts, { name: '', values: [] }]);
  }

  function removeOption(idx: number) {
    setOptions((opts) => opts.filter((_, i) => i !== idx));
    setDrafts((d) => {
      const next = { ...d };
      delete next[idx];
      return next;
    });
  }

  function renameOption(idx: number, name: string) {
    // Renaming doesn't change combinations — skip regeneration.
    onChange({
      options: options.map((o, i) => (i === idx ? { ...o, name } : o)),
      variants,
    });
  }

  function addValue(idx: number, raw: string) {
    const val = raw.trim();
    if (!val) return;
    setOptions((opts) =>
      opts.map((o, i) =>
        i === idx && !o.values.includes(val)
          ? { ...o, values: [...o.values, val] }
          : o
      )
    );
    setDrafts((d) => ({ ...d, [idx]: '' }));
  }

  function removeValue(idx: number, val: string) {
    setOptions((opts) =>
      opts.map((o, i) =>
        i === idx ? { ...o, values: o.values.filter((v) => v !== val) } : o
      )
    );
  }

  function updateVariant(i: number, patch: Partial<VariantRow>) {
    onChange({
      options,
      variants: variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)),
    });
  }

  function setAll(patch: (v: VariantRow) => Partial<VariantRow>) {
    onChange({ options, variants: variants.map((v) => ({ ...v, ...patch(v) })) });
  }

  const usedNames = new Set(
    options.map((o) => o.name.trim().toLowerCase()).filter(Boolean)
  );

  // A product is "simple" until an option has at least one value, at which
  // point it gains generated variants. The simple product keeps a single
  // internal line (variants[0]) carrying its own price, stock and SKU.
  const hasVariants = readyOptions(options).length > 0;
  const simple = variants[0];
  const simpleStock = parseInt(simple?.stockQuantity || '0', 10);
  const simpleLow = simpleStock > 0 && simpleStock <= LOW_STOCK_THRESHOLD;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Pricing &amp; variants</Label>
        <p className="text-xs text-muted-foreground">
          Set a price below for a simple product, or add an option like Size or
          Color to create variants. SKUs are generated automatically.
        </p>
      </div>

      {/* ── Option builders ─────────────────────────────────────────── */}
      {options.map((opt, idx) => (
        <div
          key={idx}
          className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Option {idx + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => removeOption(idx)}
              aria-label="Remove option">
              <Trash2 className="size-4" />
            </Button>
          </div>

          {/* Option name */}
          <div className="space-y-1.5">
            <Label className="text-xs">Option name</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={opt.name}
                onChange={(e) => renameOption(idx, e.target.value)}
                placeholder={idx === 0 ? 'e.g. Size' : 'e.g. Color'}
                className="max-w-[200px] font-medium"
              />
              {PRESET_OPTIONS.filter((p) => !usedNames.has(p.toLowerCase()))
                .length > 0 && (
                <>
                  <span className="text-xs text-muted-foreground">or</span>
                  {PRESET_OPTIONS.filter(
                    (p) => !usedNames.has(p.toLowerCase())
                  ).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => renameOption(idx, preset)}
                      className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground transition hover:border-foreground/40 hover:text-foreground">
                      {preset}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Values */}
          <div className="space-y-1.5">
            <Label className="text-xs">Values</Label>
            {opt.values.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {opt.values.map((val) => (
                  <span
                    key={val}
                    className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-sm font-medium text-background">
                    {val}
                    <button
                      type="button"
                      onClick={() => removeValue(idx, val)}
                      aria-label={`Remove ${val}`}
                      className="opacity-60 transition hover:opacity-100">
                      <X className="size-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                value={drafts[idx] ?? ''}
                onChange={(e) =>
                  setDrafts((d) => ({ ...d, [idx]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addValue(idx, drafts[idx] ?? '');
                  }
                }}
                onBlur={() => addValue(idx, drafts[idx] ?? '')}
                placeholder={
                  opt.name.trim().toLowerCase() === 'size'
                    ? 'e.g. Small'
                    : 'e.g. a value'
                }
                className="max-w-[200px]"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!(drafts[idx] ?? '').trim()}
                onClick={() => addValue(idx, drafts[idx] ?? '')}>
                <Plus className="mr-1 size-4" />
                Add
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Add each value one at a time (e.g. Small, Medium, Large) — press
              Enter or click Add.
            </p>
          </div>
        </div>
      ))}

      {options.length < MAX_OPTIONS && (
        <Button type="button" variant="outline" size="sm" onClick={addOption}>
          <Plus className="mr-1.5 size-4" />
          {options.length === 0
            ? 'Add an option (Size, Color…)'
            : 'Add another option'}
        </Button>
      )}

      {/* ── Simple product (no options) ─────────────────────────────── */}
      {!hasVariants && (
        <div className="space-y-3 rounded-xl border border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Simple product
            </span>
            <span className="truncate rounded bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
              {generateSku(productName || 'Product', [])}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Price (GHS)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={simple?.priceCedis ?? ''}
                onChange={(e) =>
                  updateVariant(0, { priceCedis: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Stock</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={simple?.stockQuantity ?? '0'}
                  onChange={(e) =>
                    updateVariant(0, { stockQuantity: e.target.value })
                  }
                />
                {simpleLow && (
                  <span className="shrink-0 text-[10px] font-semibold text-orange-600">
                    LOW
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Generated variant grid ──────────────────────────────────── */}
      {hasVariants && (
      <div className="space-y-2 rounded-xl border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {variants.length} variant{variants.length === 1 ? '' : 's'}
          </span>
          {variants.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value)}
                  placeholder="Price"
                  className="h-7 w-20"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  disabled={bulkPrice === ''}
                  onClick={() => setAll(() => ({ priceCedis: bulkPrice }))}>
                  Set all
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min="0"
                  value={bulkStock}
                  onChange={(e) => setBulkStock(e.target.value)}
                  placeholder="Stock"
                  className="h-7 w-20"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  disabled={bulkStock === ''}
                  onClick={() => setAll(() => ({ stockQuantity: bulkStock }))}>
                  Set all
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[480px] space-y-1">
            <div className="grid grid-cols-[1.4fr_1.4fr_1fr_1fr] gap-3 px-1 pb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              <span>Variant</span>
              <span>SKU (auto)</span>
              <span>Price (GHS)</span>
              <span>Stock</span>
            </div>
            {variants.map((v, i) => {
              const stock = parseInt(v.stockQuantity || '0', 10);
              const low = stock > 0 && stock <= LOW_STOCK_THRESHOLD;
              const sku =
                v.sku ?? generateSku(productName || 'Product', v.optionValues);
              return (
                <div
                  key={v.id ?? comboKey(v.optionValues) ?? i}
                  className="grid grid-cols-[1.4fr_1.4fr_1fr_1fr] items-center gap-3 rounded-lg px-1 py-1.5 odd:bg-muted/20">
                  <span className="truncate text-sm font-medium">{v.name}</span>
                  <span className="truncate rounded bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                    {sku}
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={v.priceCedis}
                    onChange={(e) =>
                      updateVariant(i, { priceCedis: e.target.value })
                    }
                    className="h-8"
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min="0"
                      value={v.stockQuantity}
                      onChange={(e) =>
                        updateVariant(i, { stockQuantity: e.target.value })
                      }
                      className="h-8"
                    />
                    {low && (
                      <span className="shrink-0 text-[10px] font-semibold text-orange-600">
                        LOW
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

/**
 * Build the editor's initial state from a saved product, hydrating legacy
 * products (variants but no stored options) into a single editable option.
 */
export function hydrateVariantState(
  options: OptionDraft[],
  variants: VariantRow[]
): VariantState {
  if (options.length > 0) {
    return { options, variants };
  }
  // Legacy product with multiple flat variants → expose them as one option
  // whose values are the existing variant names.
  if (variants.length > 1) {
    return {
      options: [{ name: 'Option', values: variants.map((v) => v.name) }],
      variants: variants.map((v) => ({ ...v, optionValues: [v.name] })),
    };
  }
  // Single variant (or none) → a default, option-less product.
  return {
    options: [],
    variants:
      variants.length === 1
        ? [{ ...variants[0], optionValues: [], name: variants[0].name || 'Default' }]
        : [{ optionValues: [], name: 'Default', priceCedis: '', stockQuantity: '0' }],
  };
}

export const emptyVariantState: VariantState = {
  options: [],
  variants: [
    { optionValues: [], name: 'Default', priceCedis: '', stockQuantity: '0' },
  ],
};
