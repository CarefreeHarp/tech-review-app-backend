import { User } from "../models/User.js";
import { Review } from "../models/Review.js";
import { Article } from "../models/Article.js";

const include = [
  { model: Review, as: "reviews", include: [{ model: Article, as: "article" }] },
];

/** Obtiene todos los registros de User. */
export const getUsers = async (req, res) => {
  try {
    const records = await User.findAll({ include, order: [["id", "ASC"]] });
    return res.json(records);
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
    const record = await User.findByPk(Number(id), { include });
    if (!record) {
      return res.status(404).json({ message: "No encontramos este registro." });
    }
    return res.json(record);
  } catch {
    return res.status(500).json({ message: "No pudimos cargar el registro." });
  }
};
