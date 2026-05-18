const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I,O,0,1

/** A human-readable, collision-resistant order number, e.g. SWG-7K2P9QXM. */
export function generateOrderNumber(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let suffix = '';
  for (const b of bytes) suffix += ALPHABET[b % ALPHABET.length];
  return `SWG-${suffix}`;
}
