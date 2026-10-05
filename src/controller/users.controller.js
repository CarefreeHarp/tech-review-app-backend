import { Op } from "sequelize";
import { User } from "../models/User.js";
import { Review } from "../models/Review.js";
import { Article } from "../models/Article.js";

const include = [
  { model: Review, as: "reviews", include: [{ model: Article, as: "article" }] },
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
    const records = await User.findAll({ where, include, order: [["id", "ASC"]] });
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
