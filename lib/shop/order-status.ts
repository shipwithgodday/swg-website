export const ORDER_STATUSES = [
  'pending',
  'paid',
  'processing',
  'procured_china',
  'shipped',
  'arrived_ghana',
  'delivered',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * The fulfilment chain in order. Admins can move an order to any later
 * step in this chain (e.g. paid -> shipped is fine), but never backwards
 * and never into the chain from outside it (`pending` doesn't go to
 * `paid` manually — only Paystack flips that one).
 */
const FORWARD_CHAIN: OrderStatus[] = [
  'paid',
  'processing',
  'procured_china',
  'shipped',
  'arrived_ghana',
  'delivered',
];

// Statuses from which an admin may cancel.
const CANCELLABLE: OrderStatus[] = [
  'pending',
  'paid',
  'processing',
  'procured_china',
  'shipped',
  'arrived_ghana',
];

/** True if an admin may move an order from `from` to `to`. */
export function canTransition(from: string, to: string): boolean {
  if (from === to) return false;
  if (to === 'cancelled') return CANCELLABLE.includes(from as OrderStatus);
  const fromIdx = FORWARD_CHAIN.indexOf(from as OrderStatus);
  const toIdx = FORWARD_CHAIN.indexOf(to as OrderStatus);
  return fromIdx >= 0 && toIdx > fromIdx;
}

/** Forward fulfilment statuses an admin may jump to from `from`. */
export function forwardStatuses(from: string): OrderStatus[] {
  const fromIdx = FORWARD_CHAIN.indexOf(from as OrderStatus);
  if (fromIdx < 0) return [];
  return FORWARD_CHAIN.slice(fromIdx + 1);
}

/** Whether an admin may cancel an order in this status. */
export function canCancelFrom(from: string): boolean {
  return CANCELLABLE.includes(from as OrderStatus);
}

/** All statuses an admin may move an order to from `from`. */
export function nextStatuses(from: string): OrderStatus[] {
  const out: OrderStatus[] = forwardStatuses(from);
  if (canCancelFrom(from)) out.push('cancelled');
  return out;
}
