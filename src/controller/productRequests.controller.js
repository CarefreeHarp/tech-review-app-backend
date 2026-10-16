import { col } from "sequelize";
import { ProductRequest } from "../models/ProductRequest.js";
import { User } from "../models/User.js";

import { timestampAttributes } from "./serialization.js";

const attributes = timestampAttributes("product_requests", [["created_at", "createdAt"]]);

const fields = ["product_name", "image_url", "category", "brand", "release_date", "status"];

/** Valida los campos sin recortar, normalizar ni sustituir los valores almacenados. */
function validatePayload(payload, creating) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return "Envía un objeto JSON.";
  const allowed = [...fields, ...(creating ? ["id", "user_id"] : [])];
  if (Object.keys(payload).some(key => !allowed.includes(key))) return "La solicitud contiene campos no admitidos.";
  if (creating && (!Number.isSafeInteger(payload.user_id) || payload.user_id < 1)) return "user_id debe ser un entero positivo.";
  if (creating && payload.id !== undefined && (typeof payload.id !== "string" || !payload.id.length)) return "id debe ser un texto no vacío.";
  for (const field of fields) {
    if (payload[field] === undefined) continue;
    if (payload[field] !== null && typeof payload[field] !== "string") return `${field} debe ser texto o null.`;
    if (["product_name", "status"].includes(field) && (typeof payload[field] !== "string" || !payload[field].trim())) return `${field} no puede estar vacío.`;
  }
  if (creating && (typeof payload.product_name !== "string" || !payload.product_name.trim())) return "product_name es obligatorio.";
  return null;
}

/** Convierte los errores de persistencia en respuestas sin exponer detalles de conexión. */
function fail(res, error) {
  if (error.name === "SequelizeUniqueConstraintError") return res.status(409).json({ message: "Ya existe una solicitud con ese ID." });
  if (["SequelizeValidationError", "SequelizeForeignKeyConstraintError"].includes(error.name)) return res.status(400).json({ message: "Los datos de la solicitud no son válidos." });
  return res.status(500).json({ message: "No pudimos procesar la solicitud." });
}

/** Lista las solicitudes y permite consultar únicamente las de un usuario. */
export async function getProductRequests(req, res) {
  const where = {};
  if (req.query.user_id !== undefined) {
    if (typeof req.query.user_id !== "string" || !/^[1-9]\d*$/.test(req.query.user_id) || !Number.isSafeInteger(Number(req.query.user_id))) return res.status(400).json({ message: "user_id debe ser un entero positivo." });
    where.user_id = Number(req.query.user_id);
  }
  try { return res.json(await ProductRequest.findAll({ attributes, where, order: [[col("product_requests.created_at"), "DESC"], ["id", "ASC"]] })); }
  catch (error) { return fail(res, error); }
}

/** Obtiene una solicitud conservando su identificador textual. */
export async function getProductRequestById(req, res) {
  try {
    const record = await ProductRequest.findByPk(req.params.id, { attributes });
    return record ? res.json(record) : res.status(404).json({ message: "No encontramos esta solicitud." });
  } catch (error) { return fail(res, error); }
}

/** Crea una solicitud vinculada al usuario existente; no utiliza firebase_uid. */
export async function createProductRequest(req, res) {
  const message = validatePayload(req.body, true);
  if (message) return res.status(400).json({ message });
  try {
    if (!await User.findByPk(req.body.user_id)) return res.status(404).json({ message: "No encontramos este usuario." });
    return res.status(201).json(await ProductRequest.create(req.body));
  } catch (error) { return fail(res, error); }
}

/** Actualiza campos de la solicitud sin reasignar su autor ni su ID. */
export async function updateProductRequest(req, res) {
  const message = validatePayload(req.body, false);
  if (message) return res.status(400).json({ message });
  try {
    const record = await ProductRequest.findByPk(req.params.id, { attributes });
    if (!record) return res.status(404).json({ message: "No encontramos esta solicitud." });
    await record.update(req.body);
    return res.json(record);
  } catch (error) { return fail(res, error); }
}

/** Elimina la solicitud indicada. */
export async function deleteProductRequest(req, res) {
  try {
    const record = await ProductRequest.findByPk(req.params.id, { attributes });
    if (!record) return res.status(404).json({ message: "No encontramos esta solicitud." });
    await record.destroy();
    return res.status(204).send();
  } catch (error) { return fail(res, error); }
}
