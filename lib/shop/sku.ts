/**
 * Automatic, human-readable SKU generation.
 *
 * Shape: `PRODUCTCODE[-VAL1[-VAL2]]`, e.g. `LUC-GOD-TEE-M-RED`.
 * SKUs are generated server-side at save time and then frozen on the variant —
 * a later product/option rename never rewrites an existing SKU.
 */

const SIZE_CODES: Record<string, string> = {
  'xs': 'XS',
  'x-small': 'XS',
  'extra small': 'XS',
  's': 'S',
  'small': 'S',
  'm': 'M',
  'medium': 'M',
  'l': 'L',
  'large': 'L',
  'xl': 'XL',
  'x-large': 'XL',
  'extra large': 'XL',
  'xxl': 'XXL',
  '2xl': 'XXL',
  'xx-large': 'XXL',
  'xxxl': 'XXXL',
  '3xl': 'XXXL',
  'xxx-large': 'XXXL',
};

/** First 3 alphanumerics of a word, uppercased. */
function abbreviate(word: string): string {
  return word.replace(/[^a-z0-9]/gi, '').slice(0, 3).toUpperCase();
}

/**
 * A short code derived from the product name: the first three alphanumerics of
 * each of the first three words, uppercased and dash-joined.
 * "Lucky Godday Tee" → "LUC-GOD-TEE".
 */
export function productCode(name: string): string {
  const code = name
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .map(abbreviate)
    .filter(Boolean)
    .join('-');
  return code || 'SKU';
}

/**
 * A short code for an option value. Common sizes map to canonical forms
 * (Small → S, X-Large → XL); everything else uses the first three alphanumerics
 * uppercased (Red → RED, Blue → BLU, "500ml" → 500).
 */
export function valueCode(value: string): string {
  const key = value.trim().toLowerCase();
  if (SIZE_CODES[key]) return SIZE_CODES[key];
  return abbreviate(value) || 'V';
}

/**
 * Build the base SKU for a variant from its product name and ordered option
 * values. No option values (a single default variant) → just the product code.
 */
export function generateSku(productName: string, optionValues: string[]): string {
  return [productCode(productName), ...optionValues.map(valueCode)].join('-');
}

/**
 * Make `base` unique against the `taken` set by appending `-2`, `-3`, … as
 * needed. The returned SKU is added to `taken` so repeated calls stay unique.
 */
export function uniqueSku(base: string, taken: Set<string>): string {
  if (!taken.has(base)) {
    taken.add(base);
    return base;
  }
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  const sku = `${base}-${n}`;
  taken.add(sku);
  return sku;
}

export interface SkuAssignmentInput {
  /** Ordered option values for this variant; empty for a default variant. */
  optionValues: string[];
  /** An existing, already-persisted SKU to preserve (never regenerated). */
  existingSku?: string | null;
}

/**
 * Assign a stable, unique SKU to every variant, preserving any existing SKUs
 * and generating fresh collision-free ones for the rest.
 *
 * @param taken SKUs already used by *other* products — seed from the DB so
 *   generated SKUs don't violate the global unique constraint.
 */
export function assignSkus(
  productName: string,
  variants: SkuAssignmentInput[],
  taken: Set<string> = new Set()
): string[] {
  // Reserve existing SKUs first so generated ones route around them.
  for (const v of variants) {
    if (v.existingSku) taken.add(v.existingSku);
  }
  return variants.map((v) =>
    v.existingSku
      ? v.existingSku
      : uniqueSku(generateSku(productName, v.optionValues), taken)
  );
}
