const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I,O,0,1

/** Exposed for callers that need to reason about the order-number charset. */
export const ORDER_NUMBER_ALPHABET = ALPHABET;

/** A human-readable, collision-resistant order number, e.g. SWG-7K2P9QXM. */
export function generateOrderNumber(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let suffix = '';
  for (const b of bytes) suffix += ALPHABET[b % ALPHABET.length];
  return `SWG-${suffix}`;
}

const ORDER_NUMBER_RE = new RegExp(`^SWG-[${ALPHABET}]{8}$`);

/**
 * True when `raw` looks like one of our order numbers. Trims surrounding
 * whitespace and upper-cases first, so user input from a URL or form is
 * accepted. Used to cheaply reject junk before hitting the database.
 */
export function isValidOrderNumber(raw: string): boolean {
  return ORDER_NUMBER_RE.test(raw.trim().toUpperCase());
}
