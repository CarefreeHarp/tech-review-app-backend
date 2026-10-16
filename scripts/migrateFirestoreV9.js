import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, chmod } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { spawn } from 'node:child_process';
import { initializeApp, cert, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { sequelize } from '../src/database/database.js';
import { buildPlan, captureFirestore, decode, encode, fingerprint } from './lib/firestoreV9.js';

const quote = value => '"' + value.replaceAll('"', '""') + '"';
const primaryKeys = { follows: ['follower_id', 'followed_id'], review_bookmarks: ['user_id', 'review_id'], article_stores: ['article_id', 'store_id'] };
const keyOf = (table, row) => JSON.stringify((primaryKeys[table] ?? ['id']).map(key => String(row[key])));

/** Obtiene columnas y valores textuales para conservar la precisión original de PostgreSQL. */
async function captureSql(transaction) {
  const query = (sql, options = {}) => sequelize.query(sql, { logging: false, transaction, ...options });
  const [names] = await query("SELECT table_name AS name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name");
  const tables = {};
  for (const { name } of names) {
    const [columns] = await query("SELECT column_name, data_type, udt_name, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = :name ORDER BY ordinal_position", { replacements: { name } });
    const [rows] = await query(`SELECT ${columns.map(c => `${quote(c.column_name)}::text AS ${quote(c.column_name)}`).join(', ')} FROM public.${quote(name)}`);
    tables[name] = { columns, rows: rows.sort((a, b) => keyOf(name, a).localeCompare(keyOf(name, b))) };
  }
  return { capturedAt: new Date().toISOString(), tables };
}

/** Guarda un respaldo completo recuperable antes de ejecutar cualquier escritura. */
async function dumpSql(directory) {
  const config = sequelize.config;
  const file = join(directory, 'sql-before.dump');
  await new Promise((resolveDump, reject) => {
    const child = spawn('pg_dump', ['--format=custom', '--no-owner', '--no-acl', '--file', file], {
      env: { ...process.env, PGHOST: config.host, PGPORT: String(config.port), PGDATABASE: config.database, PGUSER: config.username, PGPASSWORD: config.password },
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    let error = '';
    child.stderr.on('data', chunk => { error += chunk; });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolveDump() : reject(new Error(error.replaceAll(config.password, '[redacted]'))));
  });
  await chmod(file, 0o600);
}

/** Escribe un JSON privado; nunca incluye la clave de la cuenta de servicio. */
async function save(directory, name, value) {
  const file = join(directory, name);
  await writeFile(file, JSON.stringify(value, null, 2), { mode: 0o600 });
  await chmod(file, 0o600);
}

/** Ordena comentarios de modo que cada padre exista antes de importar sus respuestas. */
function orderedRows(table, rows) {
  if (!['comments', 'categories'].includes(table)) return rows;
  const parentKey = table === 'comments' ? 'parent_comment_id' : 'parent_category_id';
  const remaining = [...rows], result = [], inserted = new Set();
  while (remaining.length) {
    const index = remaining.findIndex(row => row[parentKey] === null || inserted.has(row[parentKey]));
    assert.ok(index >= 0, `Ciclo o padre inexistente en ${table}`);
    const [row] = remaining.splice(index, 1); result.push(row); inserted.add(row.id);
  }
  return result;
}

/** Importa la representación relacional y sincroniza secuencias sin recrear las tablas existentes. */
async function applySql(plan, transaction) {
  await sequelize.query(await readFile(new URL('./sql/firestore-v9.sql', import.meta.url), 'utf8'), { transaction, logging: false });
  for (const [table, rows] of Object.entries(plan.tables)) {
    for (const row of orderedRows(table, rows)) {
      const keys = Object.keys(row), pk = primaryKeys[table] ?? ['id'];
      const bind = keys.map(key => table === 'articles' && key === 'specifications' && row[key] !== null ? JSON.stringify(row[key]) : row[key]);
      const updates = keys.filter(key => !pk.includes(key)).map(key => `${quote(key)} = EXCLUDED.${quote(key)}`).join(', ');
      const sql = `INSERT INTO ${quote(table)} (${keys.map(quote).join(', ')}) VALUES (${keys.map((_, i) => '$' + (i + 1)).join(', ')}) ON CONFLICT (${pk.map(quote).join(', ')}) ${updates ? 'DO UPDATE SET ' + updates : 'DO NOTHING'}`;
      await sequelize.query(sql, { bind, transaction, logging: false });
    }
  }
  // Los únicos registros descartados son las marcas sin productos autorizadas por el usuario.
  for (const brand of plan.removedUnusedBrands) await sequelize.query('DELETE FROM brands WHERE id = $1 AND NOT EXISTS (SELECT 1 FROM articles WHERE brand_id = $1)', { bind: [brand.id], transaction, logging: false });
  for (const table of ['users', 'categories', 'brands', 'stores', 'articles', 'reviews', 'comments', 'review_likes', 'comment_likes', 'notifications']) {
    await sequelize.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${quote(table)}), 1), EXISTS (SELECT 1 FROM ${quote(table)}))`, { transaction, logging: false });
  }
}

/** Compara cada fila y atributo esperado, incluyendo fechas hasta el microsegundo. */
async function verifySql(plan, transaction) {
  const current = await captureSql(transaction);
  const timestamp = text => text === null ? null : BigInt(Date.parse(text)) * 1000n + BigInt((text.match(/\.(\d+)/)?.[1] ?? '').padEnd(6, '0').slice(3, 6) || '0');
  for (const [name, expectedRows] of Object.entries(plan.tables)) {
    const table = current.tables[name];
    assert.ok(table, `Falta la tabla ${name}`);
    assert.equal(table.rows.length, expectedRows.length, `Cantidad distinta en ${name}`);
    const indexed = new Map(table.rows.map(row => [keyOf(name, row), row]));
    const types = Object.fromEntries(table.columns.map(c => [c.column_name, c.data_type]));
    for (const row of expectedRows) {
      const actual = indexed.get(keyOf(name, row)); assert.ok(actual, `Falta una fila en ${name}`);
      for (const [key, expected] of Object.entries(row)) {
        const value = actual[key];
        const location = `${name}${keyOf(name, row)}.${key}`;
        if (expected === null) assert.equal(value, null, location);
        else if (types[key] === 'timestamp with time zone') assert.equal(timestamp(value), timestamp(expected), location);
        else if (types[key] === 'json' || types[key] === 'jsonb') assert.deepEqual(JSON.parse(value), expected, location);
        else if (types[key] === 'boolean') assert.equal(value === 'true', expected, location);
        else assert.equal(value, String(expected), location);
      }
    }
  }
  return current;
}

/** Reemplaza el conjunto en una transacción; aborta si cambió cualquier documento de origen o destino. */
async function replaceFirestore(db, original, target) {
  const targetMap = new Map(target.map(doc => [doc.path, doc]));
  const originalMap = new Map(original.map(doc => [doc.path, doc]));
  const paths = [...new Set([...originalMap.keys(), ...targetMap.keys()])];
  assert.ok(paths.length <= 500, 'La migración requiere más de un lote; no se aplicará parcialmente');
  const roots = [...new Set(paths.map(path => path.split('/')[0]))];
  await db.runTransaction(async transaction => {
    // Leer las colecciones también detecta documentos nuevos añadidos al origen durante la migración.
    for (const root of roots) {
      const query = await transaction.get(db.collection(root));
      const expected = original.filter(doc => doc.path.split('/').length === 2 && doc.path.startsWith(root + '/'));
      assert.equal(query.size, expected.length, `Cambió la colección ${root}`);
    }
    for (let i = 0; i < paths.length; i += 100) {
      const docs = await transaction.getAll(...paths.slice(i, i + 100).map(path => db.doc(path)));
      for (const doc of docs) {
        const expected = originalMap.get(doc.ref.path);
        assert.equal(doc.exists, Boolean(expected), `Cambió ${doc.ref.path}`);
        if (expected) assert.deepEqual(encode(doc.data()), expected.data, `Cambió ${doc.ref.path}`);
      }
    }
    for (const path of paths) {
      const next = targetMap.get(path);
      if (next) transaction.set(db.doc(path), decode(next.data, db));
      else transaction.delete(db.doc(path));
    }
  }, { maxAttempts: 1 });
}

/** Ejecuta un plan verificable; --apply es obligatorio para modificar las dos bases. */
async function main() {
  const args = process.argv.slice(2);
  const option = name => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
  assert.equal(['--dry-run', '--apply', '--verify'].filter(flag => args.includes(flag)).length, 1, 'Indica exactamente un modo: --dry-run, --apply o --verify');
  const serviceAccount = option('--service-account');
  assert.ok(serviceAccount, 'Indica --service-account con una ruta local; nunca pegues la clave');
  const directory = resolve(option('--backup-dir') ?? join('tmp', 'migration-v9', new Date().toISOString().replaceAll(':', '-')));
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const credentials = JSON.parse(await readFile(serviceAccount, 'utf8'));
  assert.equal(credentials.project_id, 'devicers-d04dd');
  const app = initializeApp({ credential: cert(credentials), projectId: credentials.project_id }, 'migration-v9');
  const db = getFirestore(app);
  let transaction, firestoreApplied = false, snapshot, plan;
  try {
    await sequelize.authenticate({ logging: false });
    if (args.includes('--verify')) {
      plan = JSON.parse(await readFile(join(directory, 'plan.json'), 'utf8'));
      const current = await captureFirestore(db, credentials.project_id);
      assert.equal(fingerprint(current.documents), plan.targetFingerprint, 'Firestore difiere del destino esperado');
      await verifySql(plan);
      console.log(JSON.stringify({ verified: true, firestoreDocuments: current.documents.length, sqlRows: Object.fromEntries(Object.entries(plan.tables).map(([name, rows]) => [name, rows.length])) }));
      return;
    }
    // No se sobrescriben respaldos de otra ejecución.
    const existing = await readFile(join(directory, 'firestore-before.json')).then(() => true, error => { if (error.code === 'ENOENT') return false; throw error; });
    assert.ok(!existing, 'El directorio ya contiene un respaldo; usa otro para esta ejecución');
    snapshot = await captureFirestore(db, credentials.project_id);
    plan = buildPlan(snapshot);
    const sqlBefore = await captureSql();
    await save(directory, 'firestore-before.json', snapshot);
    await save(directory, 'sql-before.json', sqlBefore);
    await save(directory, 'plan.json', plan);
    await dumpSql(directory);
    console.log(JSON.stringify({ mode: args.includes('--apply') ? 'apply' : 'dry-run', backupDirectory: directory, sourceDocuments: snapshot.documents.length, targetDocuments: plan.documents.length, deletedOldPaths: plan.deletes.length, generatedDates: plan.generatedDates.length, removedUnusedBrands: plan.removedUnusedBrands, sqlRows: Object.fromEntries(Object.entries(plan.tables).map(([name, rows]) => [name, rows.length])) }));
    if (args.includes('--dry-run')) {
      console.log('DRY RUN: no Firestore or PostgreSQL writes were performed.');
      return;
    }
    assert.ok(args.includes('--apply'), 'Las escrituras requieren --apply');
    transaction = await sequelize.transaction({ isolationLevel: 'SERIALIZABLE' });
    const tables = Object.keys(sqlBefore.tables);
    assert.ok(tables.every(name => Object.hasOwn(plan.tables, name)), 'Hay tablas SQL no contempladas');
    await sequelize.query(`LOCK TABLE ${tables.map(quote).join(', ')} IN SHARE ROW EXCLUSIVE MODE`, { transaction, logging: false });
    const sqlLocked = await captureSql(transaction);
    assert.deepEqual(sqlLocked.tables, sqlBefore.tables, 'SQL cambió después del respaldo');
    await applySql(plan, transaction);
    const sqlAfter = await verifySql(plan, transaction);
    const sourceCheck = await captureFirestore(db, credentials.project_id);
    assert.equal(fingerprint(sourceCheck.documents), plan.sourceFingerprint, 'Firestore cambió después del respaldo');
    await replaceFirestore(db, snapshot.documents, plan.documents);
    firestoreApplied = true;
    const firestoreAfter = await captureFirestore(db, credentials.project_id);
    assert.equal(fingerprint(firestoreAfter.documents), plan.targetFingerprint, 'Falló la verificación del destino Firestore');
    await transaction.commit();
    transaction = null;
    await save(directory, 'sql-after.json', sqlAfter);
    await save(directory, 'firestore-after.json', firestoreAfter);
    await save(directory, 'result.json', { completedAt: new Date().toISOString(), sourceFingerprint: plan.sourceFingerprint, targetFingerprint: plan.targetFingerprint, verified: true, generatedDates: plan.generatedDates.length });
    console.log('Migration v9 completed and both databases verified.');
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    if (firestoreApplied && transaction) {
      // Si SQL no pudo confirmar, restaurar Firestore solo si nadie ha escrito después de la migración.
      try {
        const current = await captureFirestore(db, credentials.project_id);
        assert.equal(fingerprint(current.documents), plan.targetFingerprint, 'Firestore recibió cambios posteriores; no se sobrescribirán');
        await replaceFirestore(db, current.documents, snapshot.documents);
        console.error('Firestore restored from the backup because the SQL transaction did not complete.');
      } catch (restoreError) { console.error('Automatic restoration could not complete:', restoreError.message); }
    }
    throw error;
  } finally {
    await db.terminate(); await deleteApp(app); await sequelize.close();
  }
}

main().catch(error => { console.error('Migration stopped:', error.message.replaceAll(sequelize.config.password, '[redacted]')); process.exitCode = 1; });
