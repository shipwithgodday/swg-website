// Run against a development database with node --env-file .env.local.
// All database objects/data created by this check live in an isolated schema.
const { neon } = require('@neondatabase/serverless');
const { readFileSync } = require('node:fs');
const { strict: assert } = require('node:assert');
const { randomBytes } = require('node:crypto');
const sql = neon(process.env.DATABASE_URL);
const schema = `shipping_mark_test_${randomBytes(8).toString('hex')}`;
const setPath = `SET LOCAL search_path TO ${schema}, public`;
const migration = readFileSync('drizzle/0010_reserve_shipping_marks.sql', 'utf8').split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
async function run(query, args = []) {
  const result = await sql.transaction([sql.query(setPath), sql.query(query, args)]);
  return result[1];
}
(async () => {
  try {
    await sql.transaction([
      sql.query(`CREATE SCHEMA ${schema}`), sql.query(setPath),
      sql.query('CREATE TABLE customers (id integer, shipping_mark text, shipping_mark_no integer)'),
      sql.query('CREATE TABLE subscribers (id integer, full_name text)'),
      sql.query('CREATE SEQUENCE shipping_mark_seq'),
      sql.query("SELECT setval('shipping_mark_seq', 356, true)"),
      sql.query("INSERT INTO customers VALUES (1, 'GD356', 356)"),
      sql.query("INSERT INTO subscribers VALUES (1, 'GD412 LEGACY CONTACT')"),
      ...migration.map(statement => sql.query(statement)),
    ]);
    assert.equal((await run('SELECT * FROM allocate_shipping_mark()'))[0].mark, 'GD413');
    await assert.rejects(run("SELECT * FROM allocate_shipping_mark('gd412')"), error => error.code === '23505');
    assert.equal((await run("SELECT * FROM allocate_shipping_mark('GD900')"))[0].mark, 'GD900');
    assert.equal((await run('SELECT * FROM allocate_shipping_mark()'))[0].mark, 'GD901');
    await run("INSERT INTO subscribers VALUES (2, 'GD1200 NEW LEGACY CONTACT')");
    assert.equal((await run('SELECT * FROM allocate_shipping_mark()'))[0].mark, 'GD1201');
    const concurrent = await Promise.all(Array.from({ length: 12 }, () => run('SELECT * FROM allocate_shipping_mark()')));
    assert.equal(new Set(concurrent.map(rows => rows[0].mark)).size, 12);
    await run('DELETE FROM customers');
    await run('DELETE FROM subscribers');
    // Even a stale externally reset sequence cannot reuse a reserved number.
    await run("SELECT setval('shipping_mark_seq', 2, true)");
    assert.equal((await run('SELECT * FROM allocate_shipping_mark()'))[0].mark, 'GD1214');
    await assert.rejects(run("SELECT * FROM allocate_shipping_mark('GD412')"), error => error.code === '23505');
    console.log('Shipping-mark integration checks passed: historical reservations, custom collisions, future legacy labels, 12 concurrent allocations, deletion and stale-sequence recovery.');
  } finally {
    await sql.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
