/**
 * Parses an invoice number against a list of known shipping marks.
 * Returns { containerNumber, shippingMark } where shippingMark is always
 * uppercase, regardless of input casing. Returns null if no match.
 */
export function parseInvoiceNumber(
  invoice: string,
  shippingMarks: string[]
): { containerNumber: string; shippingMark: string } | null {
  const normalized = invoice.toUpperCase().trim();
  const sorted = [...shippingMarks]
    .map((m) => m.toUpperCase())
    .sort((a, b) => b.length - a.length);
  for (const mark of sorted) {
    if (normalized.endsWith(mark)) {
      const containerNumber = normalized.slice(0, normalized.length - mark.length);
      if (containerNumber.length > 0) {
        return { containerNumber, shippingMark: mark };
      }
      // The mark consumed the entire string — no valid container prefix.
      // Stop here so a shorter overlapping mark cannot produce a spurious match.
      return null;
    }
  }
  return null;
}

/**
 * Fallback for invoices whose shipping mark doesn't belong to a known customer
 * (e.g. customers added only via the mailing list). Returns the longest known
 * container number the invoice starts with, uppercased, or null if none match.
 */
export function matchContainerPrefix(
  invoice: string,
  containerNumbers: string[]
): string | null {
  const normalized = invoice.toUpperCase().trim();
  const sorted = [...containerNumbers]
    .map((c) => c.toUpperCase())
    .sort((a, b) => b.length - a.length);
  return sorted.find((c) => c.length > 0 && normalized.startsWith(c)) ?? null;
}
