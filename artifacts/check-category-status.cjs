// Isolated PostgreSQL regression check; no live database access.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const {PGlite} = require('./db-audit-runtime/node_modules/@electric-sql/pglite');
(async () => {
  const db = new PGlite();
  try {
    await db.exec(fs.readFileSync(process.argv[2], 'utf8'));
    const {rows} = await db.query('SELECT id FROM category_tbl WHERE d_in=0 AND category_active_status=0 LIMIT 1');
    assert.ok(rows.length, 'Need an active category in the fixture');
    const id = rows[0].id;
    const visible = async () => (await db.query(
      'SELECT id FROM category_tbl WHERE d_in=0 AND category_active_status=0 AND id=$1', [id],
    )).rows.length;
    await db.exec('BEGIN');
    await db.query('UPDATE category_tbl SET category_active_status=$1 WHERE id=$2 AND d_in=0', [1,id]);
    assert.equal(await visible(), 0, 'Inactive category must not be returned');
    await db.query('UPDATE category_tbl SET category_active_status=$1 WHERE id=$2 AND d_in=0', [0,id]);
    assert.equal(await visible(), 1, 'Reactivated category must be returned');
    await db.exec('ROLLBACK');
    console.log('PASS: disabling hides the category; reactivating restores it. All checks used an isolated in-memory database.');
  } finally { await db.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
