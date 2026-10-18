import { sequelize } from "../database/database.js";
import { Notification } from "../models/Notification.js";
import { Review } from "../models/Review.js";
import { ReviewLike } from "../models/ReviewLike.js";
import { User } from "../models/User.js";
import { timestampAttributes } from "./serialization.js";

/** Obtiene todos los registros de ReviewLike. */
export const getReviewLikes = async (req, res) => {
  try {
    const records = await ReviewLike.findAll({ attributes: timestampAttributes('review_likes', ['created_at']), order: [["id", "ASC"]] });
    return res.json(records);
  } catch {
    return res.status(500).json({ message: "No pudimos cargar los registros." });
  }
};

/** Busca un registro de ReviewLike mediante su ID. */
export const getReviewLikeById = async (req, res) => {
  const { id } = req.params;
  if (!/^[1-9]\d*$/.test(id ?? "") || !Number.isSafeInteger(Number(id))) {
    return res.status(400).json({ message: "Los identificadores deben ser enteros positivos." });
  }
  try {
    const record = await ReviewLike.findByPk(Number(id), { attributes: timestampAttributes('review_likes', ['created_at']) });
    if (!record) {
      return res.status(404).json({ message: "No encontramos este registro." });
    }
    return res.json(record);
  } catch {
    return res.status(500).json({ message: "No pudimos cargar el registro." });
  }
};

/**
 * Da o quita el like del usuario en la reseña. El registro de review_likes, la notificación del autor
 * y el conteo devuelto cambian en una sola transacción, igual que en la versión de Firestore.
 */
export const toggleReviewLike = async (req, res) => {
  const { id } = req.params;
  if (!/^[1-9]\d*$/.test(id ?? "") || !Number.isSafeInteger(Number(id))) {
    return res.status(400).json({ message: "Los identificadores deben ser enteros positivos." });
  }
  const { user_id } = req.body ?? {};
  if (!Number.isSafeInteger(user_id) || user_id < 1) {
    return res.status(400).json({ message: "user_id debe ser un entero positivo." });
  }
  const reviewId = Number(id);
  try {
    // Se responde después del commit; si falta la reseña o el usuario, la transacción termina sin escribir.
    const { status, body } = await sequelize.transaction(async transaction => {
      // El bloqueo hace que dos toques simultáneos sobre la misma reseña se ejecuten uno detrás del otro.
      const review = await Review.findByPk(reviewId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!review) return { status: 404, body: { message: "No encontramos esta reseña." } };
      if (!await User.findByPk(user_id, { transaction })) {
        return { status: 404, body: { message: "No encontramos este usuario." } };
      }

      const like = await ReviewLike.findOne({ where: { user_id, review_id: reviewId }, transaction });
      // Al quitar el like se retira su notificación; al darlo se borra antes cualquier copia para no duplicarla.
      await Notification.destroy({ where: { type: "review_like", review_id: reviewId, actor_user_id: user_id }, transaction });
      if (like) {
        await like.destroy({ transaction });
      } else {
        await ReviewLike.create({ user_id, review_id: reviewId }, { transaction });
        // El autor no recibe notificaciones por los likes que da a sus propias reseñas.
        if (user_id !== review.user_id) {
          await Notification.create({
            user_id: review.user_id, actor_user_id: user_id, type: "review_like",
            review_id: reviewId, comment_id: null, is_read: false,
          }, { transaction });
        }
      }

      const likes_count = await ReviewLike.count({ where: { review_id: reviewId }, transaction });
      return { status: 200, body: { review_id: reviewId, user_id, is_liked: !like, likes_count } };
    });
    return res.status(status).json(body);
  } catch (error) {
    console.log("Error toggling review like:", error);
    return res.status(500).json({ message: "No pudimos actualizar el like." });
  }
};
