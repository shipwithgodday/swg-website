/** Capitalises the first letter of each word; splits on spaces, _ and -. */
export function titleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending Payment',
  paid: 'Paid',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

/** Human label for an order status, e.g. `pending` -> `Pending Payment`. */
export function formatOrderStatus(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? titleCase(status);
}

/** Human label for a product status, e.g. `draft` -> `Draft`. */
export function formatProductStatus(status: string): string {
  return titleCase(status);
}
