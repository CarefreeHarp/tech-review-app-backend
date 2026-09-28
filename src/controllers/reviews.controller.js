import { Article } from "../models/Article.js";
import { Review } from "../models/Review.js";
import { User } from "../models/User.js";

export const createReview = async (req, res) => {
  try {
    const { userId, articleId } = req.params;
    const { rating, title, body } = req.body;

    // La calificación se maneja como estrellas de 1 a 5.
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Selecciona una calificación de 1 a 5 estrellas." });
    }

    if (!body) {
      return res.status(400).json({ message: "Escribe el contenido de tu reseña." });
    }

    // Se valida la existencia de ambos registros antes de crear la reseña.
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "No encontramos este usuario." });
    }

    const article = await Article.findByPk(articleId);
    if (!article) {
      return res.status(404).json({ message: "No encontramos este artículo." });
    }

    const review = await Review.create({
      user_id: user.id,
      article_id: article.id,
      rating,
      title,
      body,
      is_active: true,
    });

    return res.status(201).json(review);
  } catch (error) {
    console.log("Error creating review:", error);
    return res
      .status(500)
      .json({ message: "No pudimos publicar tu reseña. Intenta de nuevo más tarde." });
  }
};

export const getReviewsByArticle = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.articleId);
    if (!article) {
      return res.status(404).json({ message: "No encontramos este artículo." });
    }

    const reviews = await Review.findAll({
      where: { article_id: article.id },
      order: [["createdAt", "DESC"]],
    });

    return res.json(reviews);
  } catch (error) {
    console.log("Error getting article reviews:", error);
    return res
      .status(500)
      .json({ message: "No pudimos cargar las reseñas. Intenta de nuevo más tarde." });
  }
};

export const getReviewsByUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "No encontramos este usuario." });
    }

    const reviews = await Review.findAll({
      where: { user_id: user.id },
      order: [["createdAt", "DESC"]],
    });

    return res.json(reviews);
  } catch (error) {
    console.log("Error getting user reviews:", error);
    return res
      .status(500)
      .json({ message: "No pudimos cargar las reseñas. Intenta de nuevo más tarde." });
  }
};

export const updateReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "No encontramos esta reseña." });
    }

    await review.update(req.body);

    return res.json(review);
  } catch (error) {
    console.log("Error updating review:", error);
    return res
      .status(500)
      .json({ message: "No pudimos actualizar la reseña. Intenta de nuevo más tarde." });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "No encontramos esta reseña." });
    }

    await review.destroy();

    return res.sendStatus(204);
  } catch (error) {
    console.log("Error deleting review:", error);
    return res
      .status(500)
      .json({ message: "No pudimos eliminar la reseña. Intenta de nuevo más tarde." });
  }
};
