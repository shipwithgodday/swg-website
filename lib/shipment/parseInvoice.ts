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
