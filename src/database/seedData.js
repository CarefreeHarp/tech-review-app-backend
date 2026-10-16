import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Op, QueryTypes } from "sequelize";
import { sequelize } from "./database.js";

/** Copia versionada de Firestore; cargarla no requiere Firebase Admin ni acceso a Firebase. */
export const initialData = JSON.parse(readFileSync(new URL("./data/initialData.json", import.meta.url), "utf8"));

/** Ordena categorías y respuestas de modo que sus padres existan antes de insertarlas. */
function orderRows(table, rows) {
  const parent = table === "categories" ? "parent_category_id" : table === "comments" ? "parent_comment_id" : null;
  if (!parent) return rows;
  const pending = [...rows], result = [], included = new Set();
  while (pending.length) {
    const index = pending.findIndex(row => row[parent] === null || included.has(row[parent]));
    assert.ok(index >= 0, `Padre inexistente o ciclo en los datos iniciales de ${table}.`);
    const [row] = pending.splice(index, 1);
    result.push(row);
    included.add(row.id);
  }
  return result;
}

/**
 * Inserta los registros iniciales por su clave original sin modificar registros existentes.
 * Las fechas se envían como texto a PostgreSQL para conservar sus microsegundos.
 * @param model Modelo de la tabla que recibe la copia de datos.
 * @param options Opciones con la transacción común de todos los inicializadores.
 * @returns Registros correspondientes a los IDs iniciales, incluidos los que ya existían.
 */
export async function initializeRows(model, options = {}) {
  if (!options.transaction) return sequelize.transaction(transaction => initializeRows(model, { ...options, transaction }));
  const table = model.tableName;
  assert.ok(Object.hasOwn(initialData.tables, table), `Tabla no contemplada: ${table}.`);
  const rows = orderRows(table, initialData.tables[table]);
  if (!rows.length) return [];
  const attributes = model.getAttributes();
  const byColumn = Object.fromEntries(Object.entries(attributes).map(([key, value]) => [value.field ?? key, { key, ...value }]));
  const generator = sequelize.getQueryInterface().queryGenerator;
  const quotedTable = generator.quoteTable(model.getTableName());
  const quote = name => generator.quoteIdentifier(name);
  const keys = model.primaryKeyAttributes.map(key => attributes[key].field ?? key);
  // También protege el avance de secuencia frente a escrituras concurrentes en esta tabla.
  await sequelize.query(`LOCK TABLE ${quotedTable} IN SHARE ROW EXCLUSIVE MODE`, options);
  for (const row of rows) {
    const columns = Object.keys(row);
    assert.ok(columns.every(column => Object.hasOwn(byColumn, column)), `Campo inicial desconocido en ${table}.`);
    const values = Object.fromEntries(columns.map(column => [byColumn[column].key, row[column]]));
    await model.build(values).validate();
    const bind = columns.map(column => byColumn[column].type.key === "JSON" && row[column] !== null ? JSON.stringify(row[column]) : row[column]);
    await sequelize.query(
      `INSERT INTO ${quotedTable} (${columns.map(quote).join(", ")}) VALUES (${columns.map((_, index) => "$" + (index + 1)).join(", ")}) ON CONFLICT (${keys.map(quote).join(", ")}) DO NOTHING`,
      { ...options, bind }
    );
  }
  if (attributes.id?.autoIncrement) {
    const [sequence] = await sequelize.query("SELECT pg_get_serial_sequence(:table, 'id') AS name", { ...options, replacements: { table: quotedTable }, type: QueryTypes.SELECT });
    assert.ok(sequence.name, `Falta la secuencia de ${table}.`);
    // El nombre procede del catálogo SQL; se cita por segmentos para admitir esquemas explícitos.
    const quotedSequence = sequence.name.split(".").map(part => quote(part.replace(/^"|"$/g, ""))).join(".");
    const [state] = await sequelize.query(`SELECT last_value, is_called FROM ${quotedSequence}`, { ...options, type: QueryTypes.SELECT });
    const [maximum] = await sequelize.query(`SELECT MAX(id) AS id FROM ${quotedTable}`, { ...options, type: QueryTypes.SELECT });
    const consumed = Number(state.last_value) - (state.is_called ? 0 : 1);
    const next = Math.max(consumed + 1, Number(maximum.id) + 1, initialData.nextIds[table] ?? 1);
    await sequelize.query("SELECT setval(CAST(:sequence AS regclass), :value, true)", { ...options, replacements: { sequence: sequence.name, value: next - 1 } });
  }
  return model.findAll({ ...options, where: { [Op.or]: rows.map(row => Object.fromEntries(model.primaryKeyAttributes.map(key => [key, row[attributes[key].field ?? key]]))) }, order: model.primaryKeyAttributes.map(key => [key, "ASC"]) });
}

/** Detecta una base realmente vacía; no repone automáticamente filas borradas por el usuario. */
export async function isDatabaseEmpty(options = {}) {
  for (const table of Object.keys(initialData.tables)) {
    const model = sequelize.models[table];
    assert.ok(model, `Falta el modelo de ${table}.`);
    if (await model.count(options) > 0) return false;
  }
  return true;
}
