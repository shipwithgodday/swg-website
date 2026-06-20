/**
 * Canonical form for matching an email across the `customers` and
 * `subscribers` tables: trimmed and lowercased. Used by the synced-delete
 * logic so "Joe@X.com " and "joe@x.com" resolve to the same audience entry.
 * Returns '' for nullish/blank input (callers treat '' as "no match").
 */
export function normalizeEmail(email: string | null | undefined): string {
  return email?.trim().toLowerCase() ?? '';
}
