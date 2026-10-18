import { sequelize } from "../database/database.js";
import { Comment } from "../models/Comment.js";
import { Review } from "../models/Review.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { CommentLike } from "../models/CommentLike.js";
import { timestampAttributes } from "./serialization.js";

/** Obtiene todos los registros de CommentLike. */
export const getCommentLikes = async (req, res) => {
  try {
    const records = await CommentLike.findAll({ attributes: timestampAttributes('comment_likes', ['created_at']), order: [["id", "ASC"]] });
    return res.json(records);
  } catch {
    return res.status(500).json({ message: "No pudimos cargar los registros." });
  }
};

/** Busca un registro de CommentLike mediante su ID. */
export const getCommentLikeById = async (req, res) => {
  const { id } = req.params;
  if (!/^[1-9]\d*$/.test(id ?? "") || !Number.isSafeInteger(Number(id))) {
    return res.status(400).json({ message: "Los identificadores deben ser enteros positivos." });
  }
  try {
    const record = await CommentLike.findByPk(Number(id), { attributes: timestampAttributes('comment_likes', ['created_at']) });
    if (!record) {
      return res.status(404).json({ message: "No encontramos este registro." });
    }
    return res.json(record);
  } catch {
    return res.status(500).json({ message: "No pudimos cargar el registro." });
  }
};

/** Alterna el like de un comentario junto con la notificación de su autor en una transacción SQL. */
export async function toggleCommentLike(req, res) {
  const reviewId = Number(req.params.reviewId), commentId = Number(req.params.commentId);
  const { user_id: userId } = req.body ?? {};
  if (![req.params.reviewId, req.params.commentId].every(id => /^[1-9]\d*$/.test(id ?? "") && Number.isSafeInteger(Number(id))) || !Number.isSafeInteger(userId) || userId < 1) {
    return res.status(400).json({ message: "Los identificadores deben ser enteros positivos." });
  }
  try {
    const result = await sequelize.transaction(async transaction => {
      const review = await Review.findByPk(reviewId, { transaction, lock: transaction.LOCK.UPDATE });
      const comment = await Comment.findByPk(commentId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!review?.is_active || !comment?.is_active || comment.review_id !== reviewId) return { status: 404, body: { message: "No encontramos este comentario." } };
      if (!await User.findByPk(userId, { transaction })) return { status: 404, body: { message: "No encontramos este usuario." } };
      const where = { user_id: userId, comment_id: commentId };
      const existing = await CommentLike.findOne({ where, transaction });
      await Notification.destroy({ where: { type: "comment_like", comment_id: commentId, actor_user_id: userId }, transaction });
      if (existing) await existing.destroy({ transaction });
      else {
        await CommentLike.create(where, { transaction });
        if (userId !== comment.user_id) {
          await Notification.create({ user_id: comment.user_id, actor_user_id: userId, type: "comment_like", review_id: reviewId, comment_id: commentId, is_read: false }, { transaction });
        }
      }
      const likes_count = await CommentLike.count({ where: { comment_id: commentId }, transaction });
      return { status: 200, body: { review_id: reviewId, comment_id: commentId, user_id: userId, is_liked: !existing, likes_count } };
    });
    return res.status(result.status).json(result.body);
  } catch { return res.status(500).json({ message: "No pudimos actualizar el like del comentario." }); }
}
