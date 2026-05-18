import { config } from 'dotenv';
config({ path: '.env.local' });

import path from 'path';
import * as XLSX from 'xlsx';
import { sql, eq } from 'drizzle-orm';
import { db } from '../lib/db';
import { customers } from '../lib/db/schema';
import { parseShippingMark, cell } from '../lib/shop/marks';

const FILE = path.join(process.cwd(), 'SWG CUSTOMER LIST.xlsx');
const SHEET = 'Table 1';

async function main() {
  const existing = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.source, 'import'))
    .limit(1);
  if (existing.length) {
    console.error('Import aborted: imported customers already exist.');
    process.exit(1);
  }

  const workbook = XLSX.readFile(FILE);
  const sheet = workbook.Sheets[SHEET];
  if (!sheet) throw new Error(`Sheet "${SHEET}" not found`);

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    header: ['mark', 'name', 'phone', 'email'],
    range: 1, // skip header row
    defval: null,
  });

  const records: (typeof customers.$inferInsert)[] = [];
  let skipped = 0;

  for (const row of rows) {
    const rawMark = cell(row.mark);
    if (!rawMark) {
      skipped++;
      continue;
    }
    const parsed = parseShippingMark(rawMark);
    if (!parsed) {
      skipped++;
      continue;
    }
    records.push({
      shippingMark: parsed.mark,
      shippingMarkNo: parsed.markNo,
      name: cell(row.name),
      phone: cell(row.phone),
      email: cell(row.email),
      source: 'import',
    });
  }

  if (!records.length) throw new Error('No importable rows found');

  // Deduplicate: if the same shipping mark appears more than once in the sheet,
  // keep the last occurrence (later rows win) to avoid unique-constraint violations.
  const deduped = Array.from(
    records
      .reduce((map, r) => map.set(r.shippingMark, r), new Map<string, typeof records[number]>())
      .values()
  );
  const dupeCount = records.length - deduped.length;
  if (dupeCount) console.warn(`Deduplicated ${dupeCount} duplicate mark(s) in the sheet.`);

  await db.insert(customers).values(deduped);

  const maxNo = deduped.reduce((m, r) => Math.max(m, r.shippingMarkNo), 1);
  await db.execute(sql`SELECT setval('shipping_mark_seq', ${maxNo})`);

  console.log(
    `Imported ${deduped.length} customers, skipped ${skipped}. ` +
      `shipping_mark_seq set to ${maxNo} (next mark: GD${maxNo + 1}).`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
