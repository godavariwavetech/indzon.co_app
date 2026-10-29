// Executes the actual category model functions against an isolated PostgreSQL dump.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {createRequire} = require('node:module');
const {PGlite} = require('./db-audit-runtime/node_modules/@electric-sql/pglite');
const root = process.argv[2];
const adapterFile = path.join(root, 'utils/pg-compat.js');
const localRequire = createRequire(adapterFile);
const adapter = {exports: {}};
vm.runInNewContext(fs.readFileSync(adapterFile, 'utf8'), {
  module: adapter, exports: adapter.exports, __dirname: path.dirname(adapterFile),
  Buffer, console, require: name => name === 'pg'
    ? {Pool: class {}, types: {setTypeParser() {}}} : localRequire(name),
});
function modelFunction(file, name, db) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const start = source.indexOf(`exports.${name} = function`);
  assert.ok(start >= 0, name);
  const end = source.indexOf('\n};', start);
  assert.ok(end >= 0);
  const sandbox = {exports: {}, sqldb: {MySQLConPool: {}}, dbutil: {
    sqlinjection(_, sql, params, context, callback) {
      const translated = adapter.exports.translate(sql, params);
      const promise = db.query(translated.text, translated.values).then(result =>
        /^\s*UPDATE/i.test(sql) ? {affectedRows: result.affectedRows} : result.rows);
      if (callback) { promise.then(result => callback(null, result), callback); }
      else { return promise; }
    },
  }};
  vm.runInNewContext(source.slice(start, end + 4), sandbox);
  return data => new Promise((resolve, reject) => sandbox.exports[name](data,
    (error, result) => error ? reject(error) : resolve(result)));
}
(async () => {
  const db = new PGlite();
  try {
    await db.exec(fs.readFileSync(path.join(root, 'indzon_pg_complete.sql'), 'utf8'));
    const categories = modelFunction('public_app/models/public_mainModel.js', 'getlocationctgrylistMdl', db);
    const before = await categories({});
    assert.ok(before.length);
    const id = before[0].id;
    for (const dashboard of ['dashboard_api', 'dashboard_api11']) {
      const list = modelFunction(`${dashboard}/models/mainModel.js`, 'getlocationcategory', db);
      const update = modelFunction(`${dashboard}/models/mainModel.js`, 'updatecategoryactivestatus', db);
      await update({id, category_active_status: 1});
      assert.equal((await list({})).find(row => row.id === id).category_active_status, 1);
      assert.ok(!(await categories({})).some(row => row.id === id));
      await update({id, category_active_status: 0});
      const restored = (await categories({})).find(row => row.id === id);
      assert.ok(restored);
      assert.equal(restored.category_active_status, 0);
      console.log(`${dashboard}: inactive hides category; active restores it; API exposes status. PASS`);
    }
    assert.equal((await categories({})).length, before.length);
    console.log('Only an isolated in-memory database was used. No live data changed.');
  } finally { await db.close(); }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
