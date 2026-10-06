import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

/** Reserves a mark permanently, even if customer creation later fails. */
export async function allocateShippingMark(customMark?: string) {
  const result = await db.execute(
    sql`SELECT n, mark FROM allocate_shipping_mark(${customMark ?? null})`
  );
  const row = result.rows[0] as { n: number | string; mark: string };
  return { markNo: Number(row.n), shippingMark: row.mark };
}

/** Preview the same allocation floor without reserving or consuming a mark. */
export async function peekNextShippingMark(): Promise<string> {
  const result = await db.execute(sql`SELECT greatest(
    (SELECT last_value + CASE WHEN is_called THEN 1 ELSE 0 END FROM shipping_mark_seq),
    coalesce((SELECT max(mark_no) FROM shipping_mark_reservations), 0) + 1,
    coalesce((SELECT max(shipping_mark_no) FROM customers), 0) + 1
  ) AS n`);
  return `GD${Number((result.rows[0] as { n: number | string }).n)}`;
}
