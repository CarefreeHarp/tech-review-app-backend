import { ReviewBookmark } from "../models/ReviewBookmark.js";

/** Obtiene todos los registros de ReviewBookmark. */
export const getReviewBookmarks = async (req, res) => {
  try {
    const records = await ReviewBookmark.findAll({ order: [["user_id", "ASC"], ["review_id", "ASC"]] });
    return res.json(records);
  } catch {
    return res.status(500).json({ message: "No pudimos cargar los registros." });
  }
};

/** Busca un registro de ReviewBookmark mediante su clave compuesta. */
export const getReviewBookmarkById = async (req, res) => {
  const { user_id, review_id } = req.params;
  if (!/^[1-9]\d*$/.test(user_id ?? "") || !Number.isSafeInteger(Number(user_id)) ||
      !/^[1-9]\d*$/.test(review_id ?? "") || !Number.isSafeInteger(Number(review_id))) {
    return res.status(400).json({ message: "Los identificadores deben ser enteros positivos." });
  }
  try {
    const record = await ReviewBookmark.findOne({ where: { user_id: Number(user_id), review_id: Number(review_id) } });
    if (!record) {
      return res.status(404).json({ message: "No encontramos este registro." });
    }
    return res.json(record);
  } catch {
    return res.status(500).json({ message: "No pudimos cargar el registro." });
  }
};
