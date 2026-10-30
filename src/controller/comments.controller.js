import { sequelize } from "../database/database.js";
import { CommentLike } from "../models/CommentLike.js";
import { Comment } from "../models/Comment.js";
import { Review } from "../models/Review.js";
import { User } from "../models/User.js";
import { timestampAttributes, serializeComment } from "./serialization.js";

const include = [{ model: CommentLike, as: "likes", separate: true }, { model: User, as: "user", attributes: ["id", "username", "profile_image_url"] }];

/** Obtiene todos los registros de Comment. */
export const getComments = async (req, res) => {
  try {
    const records = await Comment.findAll({ attributes: timestampAttributes('comments'), include, order: [["id", "ASC"]] });
    return res.json(records.map(serializeComment));
  } catch {
    return res.status(500).json({ message: "No pudimos cargar los registros." });
  }
};

/** Busca un registro de Comment mediante su ID. */
export const getCommentById = async (req, res) => {
  const { id } = req.params;
  if (!/^[1-9]\d*$/.test(id ?? "") || !Number.isSafeInteger(Number(id))) {
    return res.status(400).json({ message: "Los identificadores deben ser enteros positivos." });
  }
  try {
    const record = await Comment.findByPk(Number(id), { attributes: timestampAttributes('comments'), include });
    if (!record) {
      return res.status(404).json({ message: "No encontramos este registro." });
    }
    return res.json(serializeComment(record));
  } catch {
    return res.status(500).json({ message: "No pudimos cargar el registro." });
  }
};

/**
 * Publica un comentario en la reseña, o una respuesta cuando recibe parent_comment_id. Copia el nombre y
 * la foto del autor, igual que el documento de Firestore, y responde con el comentario guardado.
 */
export const createComment = async (req, res) => {
  const { id } = req.params;
  if (!/^[1-9]\d*$/.test(id ?? "") || !Number.isSafeInteger(Number(id))) {
    return res.status(400).json({ message: "Los identificadores deben ser enteros positivos." });
  }
  const { user_id, body, parent_comment_id = null } = req.body ?? {};
  if (!Number.isSafeInteger(user_id) || user_id < 1) {
    return res.status(400).json({ message: "user_id debe ser un entero positivo." });
  }
  if (typeof body !== "string" || body.trim() === "") {
    return res.status(400).json({ message: "body no puede estar vacío." });
  }
  if (parent_comment_id !== null && (!Number.isSafeInteger(parent_comment_id) || parent_comment_id < 1)) {
    return res.status(400).json({ message: "parent_comment_id debe ser un entero positivo." });
  }
  const reviewId = Number(id);
  try {
    // Se responde después del commit; si falta alguna referencia, la transacción termina sin escribir.
    const { status, body: response } = await sequelize.transaction(async transaction => {
      const review = await Review.findByPk(reviewId, { transaction });
      if (!review || !review.is_active) return { status: 404, body: { message: "No encontramos esta reseña." } };
      const user = await User.findByPk(user_id, { transaction });
      if (!user) return { status: 404, body: { message: "No encontramos este usuario." } };
      if (parent_comment_id !== null) {
        const parent = await Comment.findOne({ where: { id: parent_comment_id, review_id: reviewId, is_active: true }, transaction });
        if (!parent) return { status: 404, body: { message: "No encontramos el comentario al que respondes." } };
      }

      const comment = await Comment.create({
        review_id: reviewId, user_id, parent_comment_id, body: body.trim(),
        user_username: user.username, user_profile_image_url: user.profile_image_url,
      }, { transaction });
      // La segunda lectura entrega las fechas con el mismo formato que GET /comments/:id.
      const record = await Comment.findByPk(comment.id, { attributes: timestampAttributes('comments'), include, transaction });
      return { status: 201, body: serializeComment(record) };
    });
    return res.status(status).json(response);
  } catch (error) {
    console.log("Error creating comment:", error);
    return res.status(500).json({ message: "No pudimos publicar el comentario." });
  }
};
