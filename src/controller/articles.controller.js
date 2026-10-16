import { Article } from "../models/Article.js";
import { Review } from "../models/Review.js";
import { User } from "../models/User.js";

import { timestampAttributes, articleDetails, reviewDetails, serializeArticle } from "./serialization.js";

const include = [
  ...articleDetails,
  { model: Review, as: "reviews", separate: true, include: [{ model: User, as: "user" }, ...reviewDetails] },
];

/** Obtiene todos los registros de Article. */
export const getArticles = async (req, res) => {
  try {
    const records = await Article.findAll({ attributes: timestampAttributes('articles'), include, order: [["id", "ASC"]] });
    return res.json(records.map(serializeArticle));
  } catch {
    return res.status(500).json({ message: "No pudimos cargar los registros." });
  }
};

/** Busca un registro de Article mediante su ID. */
export const getArticleById = async (req, res) => {
  const { id } = req.params;
  if (!/^[1-9]\d*$/.test(id ?? "") || !Number.isSafeInteger(Number(id))) {
    return res.status(400).json({ message: "Los identificadores deben ser enteros positivos." });
  }
  try {
    const record = await Article.findByPk(Number(id), { attributes: timestampAttributes('articles'), include });
    if (!record) {
      return res.status(404).json({ message: "No encontramos este registro." });
    }
    return res.json(serializeArticle(record));
  } catch {
    return res.status(500).json({ message: "No pudimos cargar el registro." });
  }
};
