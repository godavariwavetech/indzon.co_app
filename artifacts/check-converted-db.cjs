// Imports a SQL export into an isolated, in-memory PostgreSQL instance.
// Prints counts/schema only; never prints customer data or credentials.
const fs = require('node:fs');
const {PGlite} = require('./db-audit-runtime/node_modules/@electric-sql/pglite');

(async () => {
  const db = new PGlite();
  try {
    await db.exec(fs.readFileSync(process.argv[2], 'utf8'));
    const tables = (await db.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename",
    )).rows;
    let totalRows = 0;
    const counts = {};
    for (const {tablename} of tables) {
      const quoted = '"' + tablename.replaceAll('"', '""') + '"';
      const result = await db.query(`SELECT COUNT(*)::integer AS count FROM ${quoted}`);
      counts[tablename] = result.rows[0].count;
      totalRows += result.rows[0].count;
    }
    console.log(JSON.stringify({import: 'PASS', tables: tables.length, totalRows,
      otpTableCounts: Object.fromEntries(['sms_count_t', 'sms_details_t', 'customer_list_t'].map(t => [t, counts[t]])),
    }, null, 2));
    console.log('OTP columns:', JSON.stringify((await db.query(
      "SELECT table_name,column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('sms_count_t','sms_details_t') ORDER BY table_name,ordinal_position",
    )).rows));
    await db.exec('BEGIN');
    const updated = await db.query('UPDATE sms_count_t SET sms_count = sms_count + 1 RETURNING id');
    await db.query('INSERT INTO sms_details_t (customer_number,otp) VALUES ($1,$2)', ['audit-only', '0000']);
    await db.exec('ROLLBACK');
    console.log(JSON.stringify({otpSql: 'PASS', counterRowsUpdated: updated.rows.length, testChangesRolledBack: true}));
  } finally {
    await db.close();
  }
})().catch(error => {
  console.error('Validation failed:', error.message);
  process.exitCode = 1;
});
