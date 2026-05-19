export const ORDER_STATUSES = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// The single forward step allowed from each status.
const FORWARD: Partial<Record<OrderStatus, OrderStatus>> = {
  paid: 'processing',
  processing: 'shipped',
  shipped: 'delivered',
};

// Statuses from which an admin may cancel.
const CANCELLABLE: OrderStatus[] = [
  'pending',
  'paid',
  'processing',
  'shipped',
];

/** True if an admin may move an order from `from` to `to`. */
export function canTransition(from: string, to: string): boolean {
  if (from === to) return false;
  if (to === 'cancelled') return CANCELLABLE.includes(from as OrderStatus);
  return FORWARD[from as OrderStatus] === to;
}

/** The statuses an admin may move an order to from `from`. */
export function nextStatuses(from: string): OrderStatus[] {
  const out: OrderStatus[] = [];
  const forward = FORWARD[from as OrderStatus];
  if (forward) out.push(forward);
  if (CANCELLABLE.includes(from as OrderStatus)) out.push('cancelled');
  return out;
}
