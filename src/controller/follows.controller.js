import { Follow } from "../models/Follow.js";

/** Obtiene todos los registros de Follow. */
export const getFollows = async (req, res) => {
  try {
    const records = await Follow.findAll({ order: [["follower_id", "ASC"], ["followed_id", "ASC"]] });
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
    const record = await Follow.findOne({ where: { follower_id: Number(follower_id), followed_id: Number(followed_id) } });
    if (!record) {
      return res.status(404).json({ message: "No encontramos este registro." });
    }
    return res.json(record);
  } catch {
    return res.status(500).json({ message: "No pudimos cargar el registro." });
  }
};
