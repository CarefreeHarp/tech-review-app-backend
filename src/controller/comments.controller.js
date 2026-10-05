import { Comment } from "../models/Comment.js";

/** Obtiene todos los registros de Comment. */
export const getComments = async (req, res) => {
  try {
    const records = await Comment.findAll({ order: [["id", "ASC"]] });
    return res.json(records);
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
    const record = await Comment.findByPk(Number(id));
    if (!record) {
      return res.status(404).json({ message: "No encontramos este registro." });
    }
    return res.json(record);
  } catch {
    return res.status(500).json({ message: "No pudimos cargar el registro." });
  }
};
