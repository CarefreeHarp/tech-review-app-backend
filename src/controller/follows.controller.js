import { Op } from "sequelize";
import { sequelize } from "../database/database.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { Follow } from "../models/Follow.js";
import { timestampAttributes } from "./serialization.js";

/** Obtiene todos los registros de Follow. */
export const getFollows = async (req, res) => {
  const { followerId, followedId } = req.query;
  if ([followerId, followedId].some(value => value !== undefined && (typeof value !== "string" || !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))))) {
    return res.status(400).json({ message: "Los identificadores deben ser enteros positivos." });
  }
  const where = { ...(followerId === undefined ? {} : { follower_id: Number(followerId) }), ...(followedId === undefined ? {} : { followed_id: Number(followedId) }) };
  try {
    const records = await Follow.findAll({ where, attributes: timestampAttributes('follows', ['created_at']), order: [["follower_id", "ASC"], ["followed_id", "ASC"]] });
    return res.json(records);
  } catch {
    return res.status(500).json({ message: "No pudimos cargar los registros." });
  }
};

/** Busca un registro de Follow mediante su clave compuesta. */
export const getFollowById = async (req, res) => {
  const { follower_id, followed_id } = req.params;
  if (!/^[1-9]\d*$/.test(follower_id ?? "") || !Number.isSafeInteger(Number(follower_id)) ||
      !/^[1-9]\d*$/.test(followed_id ?? "") || !Number.isSafeInteger(Number(followed_id))) {
    return res.status(400).json({ message: "Los identificadores deben ser enteros positivos." });
  }
  try {
    const record = await Follow.findOne({ attributes: timestampAttributes('follows', ['created_at']), where: { follower_id: Number(follower_id), followed_id: Number(followed_id) } });
    if (!record) {
      return res.status(404).json({ message: "No encontramos este registro." });
    }
    return res.json(record);
  } catch {
    return res.status(500).json({ message: "No pudimos cargar el registro." });
  }
};

/** Establece seguir o dejar de seguir; un reintento del mismo estado no duplica acciones ni avisos. */
export async function setFollowing(req, res) {
  const targetId = Number(req.params.id);
  const { follower_id: actorId, is_following: following } = req.body ?? {};
  if (!/^[1-9]\d*$/.test(req.params.id ?? "") || !Number.isSafeInteger(targetId) ||
      !Number.isSafeInteger(actorId) || actorId < 1 || targetId === actorId || typeof following !== "boolean") {
    return res.status(400).json({ message: "Indica dos usuarios diferentes y el estado del seguimiento." });
  }
  try {
    const result = await sequelize.transaction(async transaction => {
      // Ordenar los bloqueos evita interbloqueos cuando dos personas se siguen entre sí a la vez.
      const users = await User.findAll({ where: { id: { [Op.in]: [actorId, targetId] } }, order: [["id", "ASC"]], transaction, lock: transaction.LOCK.UPDATE });
      if (users.length !== 2 || users.some(user => !user.is_active)) return { status: 404, body: { message: "No encontramos estos perfiles." } };
      const where = { follower_id: actorId, followed_id: targetId };
      const existing = await Follow.findOne({ where, transaction });
      if (following && !existing) {
        await Follow.create(where, { transaction });
        await Notification.destroy({ where: { type: "follow", user_id: targetId, actor_user_id: actorId }, transaction });
        await Notification.create({ user_id: targetId, actor_user_id: actorId, type: "follow", review_id: null, comment_id: null, is_read: false }, { transaction });
      } else if (!following) {
        await Follow.destroy({ where, transaction });
        await Notification.destroy({ where: { type: "follow", user_id: targetId, actor_user_id: actorId }, transaction });
      }
      const followers_count = await Follow.count({ where: { followed_id: targetId }, transaction });
      return { status: 200, body: { is_following: following, followers_count } };
    });
    return res.status(result.status).json(result.body);
  } catch { return res.status(500).json({ message: "No pudimos actualizar el seguimiento." }); }
}
