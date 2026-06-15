export interface ParsedMark {
  mark: string;
  markNo: number;
}

/** Parses a raw shipping-mark cell. Returns null if there is no mark. */
export function parseShippingMark(raw: string): ParsedMark | null {
  const mark = raw.trim();
  if (!mark) return null;
  const match = /^GD(\d+)$/.exec(mark);
  return { mark, markNo: match ? parseInt(match[1], 10) : 0 };
}

/** Normalises an Excel cell to a trimmed string or null. */
export function cell(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s.length ? s : null;
}
