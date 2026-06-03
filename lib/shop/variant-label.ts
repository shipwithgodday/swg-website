/**
 * The customer-facing label for a variant. Simple (option-less) products carry
 * no label — an empty string (or a legacy "Default") renders as nothing so the
 * cart, checkout, order and email views don't show "(Default)".
 */
export function variantLabel(name: string | null | undefined): string {
  const n = (name ?? '').trim();
  return n && n.toLowerCase() !== 'default' ? n : '';
}
