import { ArticleStore } from "../models/ArticleStore.js";

/** Obtiene todos los registros de ArticleStore. */
export const getArticleStores = async (req, res) => {
  try {
    const records = await ArticleStore.findAll({ order: [["article_id", "ASC"], ["store_id", "ASC"]] });
    return res.json(records);
  } catch {
    return res.status(500).json({ message: "No pudimos cargar los registros." });
  }
};

/** Busca un registro de ArticleStore mediante su clave compuesta. */
export const getArticleStoreById = async (req, res) => {
  const { article_id, store_id } = req.params;
  if (!/^[1-9]\d*$/.test(article_id ?? "") || !Number.isSafeInteger(Number(article_id)) ||
      !/^[1-9]\d*$/.test(store_id ?? "") || !Number.isSafeInteger(Number(store_id))) {
    return res.status(400).json({ message: "Los identificadores deben ser enteros positivos." });
  }
  try {
    const record = await ArticleStore.findOne({ where: { article_id: Number(article_id), store_id: Number(store_id) } });
    if (!record) {
      return res.status(404).json({ message: "No encontramos este registro." });
    }
    return res.json(record);
  } catch {
    return res.status(500).json({ message: "No pudimos cargar el registro." });
  }
};
