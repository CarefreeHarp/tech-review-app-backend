import { Article } from "../models/Article.js";

export const getArticles = async (req, res) => {
  try {
    const articles = await Article.findAll({ order: [["id", "ASC"]] });
    return res.json(articles);
  } catch (error) {
    console.log("Error getting articles:", error);
    return res
      .status(500)
      .json({ message: "No pudimos cargar los artículos. Intenta de nuevo más tarde." });
  }
};

export const getArticleById = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);

    if (!article) {
      return res.status(404).json({ message: "No encontramos este artículo." });
    }

    return res.json(article);
  } catch (error) {
    console.log("Error getting article:", error);
    return res
      .status(500)
      .json({ message: "No pudimos cargar el artículo. Intenta de nuevo más tarde." });
  }
};
