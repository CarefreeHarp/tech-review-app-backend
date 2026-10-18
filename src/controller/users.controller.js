import { Op } from "sequelize";
import { User } from "../models/User.js";
import { Review } from "../models/Review.js";
import { Follow } from "../models/Follow.js";
import { Article } from "../models/Article.js";

import { timestampAttributes, articleDetails, reviewDetails, serializeUser } from "./serialization.js";

const include = [
  { model: Follow, as: "followers", separate: true },
  { model: Follow, as: "following", separate: true },
  { model: Review, as: "reviews", separate: true, include: [{ model: Article, as: "article", include: articleDetails }, ...reviewDetails] },
];

/** Obtiene los usuarios y permite excluir al usuario de la búsqueda de perfiles. */
export const getUsers = async (req, res) => {
  const { excludeUserId } = req.query;
  if (excludeUserId !== undefined &&
      (typeof excludeUserId !== "string" || !/^[1-9]\d*$/.test(excludeUserId) ||
       !Number.isSafeInteger(Number(excludeUserId)))) {
    return res.status(400).json({ message: "Los identificadores deben ser enteros positivos." });
  }
  try {
    const where = excludeUserId === undefined ? {} : { id: { [Op.ne]: Number(excludeUserId) } };
    const records = await User.findAll({ attributes: timestampAttributes('users', ['created_at', 'updated_at', 'notifications_last_viewed_at']), where, include, order: [["id", "ASC"]] });
    return res.json(records.map(serializeUser));
  } catch {
    return res.status(500).json({ message: "No pudimos cargar los registros." });
  }
};

/** Busca un registro de User mediante su ID. */
export const getUserById = async (req, res) => {
  const { id } = req.params;
  if (!/^[1-9]\d*$/.test(id ?? "") || !Number.isSafeInteger(Number(id))) {
    return res.status(400).json({ message: "Los identificadores deben ser enteros positivos." });
  }
  try {
    const record = await User.findByPk(Number(id), { attributes: timestampAttributes('users', ['created_at', 'updated_at', 'notifications_last_viewed_at']), include });
    if (!record) {
      return res.status(404).json({ message: "No encontramos este registro." });
    }
    return res.json(serializeUser(record));
  } catch {
    return res.status(500).json({ message: "No pudimos cargar el registro." });
  }
};

/** Valida únicamente los campos aceptados por el registro o la edición. */
function validateProfilePayload(payload, creating) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return "Envía un objeto JSON.";
  const fields = creating ? ["firebase_uid", "email", "username", "profile_image_url"]
    : ["username", "biography", "profile_image_url"];
  if (Object.keys(payload).some(key => !fields.includes(key))) return "El perfil contiene campos no admitidos.";
  if (!creating && Object.keys(payload).length === 0) return "Envía al menos un campo editable.";
  for (const key of fields) {
    if (payload[key] === undefined) continue;
    if (["biography", "profile_image_url"].includes(key) && payload[key] === null) continue;
    if (typeof payload[key] !== "string") return `${key} debe ser texto.`;
    if (["firebase_uid", "email", "username"].includes(key) && !payload[key].trim()) return `${key} no puede estar vacío.`;
  }
  if (creating && ["firebase_uid", "email", "username"].some(key => typeof payload[key] !== "string" || !payload[key].trim())) {
    return "firebase_uid, email y username son obligatorios.";
  }
  return null;
}

function profileFailure(res, error) {
  if (error.name === "SequelizeUniqueConstraintError") return res.status(409).json({ message: "El correo o nombre de usuario ya está registrado." });
  if (error.name === "SequelizeValidationError") return res.status(400).json({ message: "Los datos del perfil no son válidos." });
  return res.status(500).json({ message: "No pudimos guardar el perfil." });
}

/** Recupera el perfil asociado al UID de registro para obtener su ID de aplicación. */
export async function getUserByFirebaseUid(req, res) {
  try {
    const record = await User.findOne({ where: { firebase_uid: req.params.uid }, attributes: timestampAttributes("users", ["created_at", "updated_at", "notifications_last_viewed_at"]), include });
    return record ? res.json(serializeUser(record)) : res.status(404).json({ message: "No encontramos este perfil." });
  } catch {
    return res.status(500).json({ message: "No pudimos cargar el perfil." });
  }
}

/** Registro repetible por UID; un reintento conserva el perfil existente y su ID. */
export async function createUser(req, res) {
  const message = validateProfilePayload(req.body, true);
  if (message) return res.status(400).json({ message });
  try {
    const [record, created] = await User.findOrCreate({
      where: { firebase_uid: req.body.firebase_uid },
      defaults: { ...req.body, biography: "", is_active: true },
    });
    return res.status(created ? 201 : 200).json(serializeUser(record));
  } catch (error) { return profileFailure(res, error); }
}

/** Actualiza los campos editables del usuario identificado por el ID de la ruta. */
export async function updateUser(req, res) {
  if (!/^[1-9]\d*$/.test(req.params.id ?? "") || !Number.isSafeInteger(Number(req.params.id))) {
    return res.status(400).json({ message: "El identificador debe ser un entero positivo." });
  }
  const message = validateProfilePayload(req.body, false);
  if (message) return res.status(400).json({ message });
  try {
    const record = await User.findByPk(Number(req.params.id));
    if (!record) return res.status(404).json({ message: "No encontramos este perfil." });
    await record.update(req.body);
    return res.json(serializeUser(record));
  } catch (error) { return profileFailure(res, error); }
}
