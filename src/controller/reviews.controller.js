import { Article } from "../models/Article.js";
import { Review } from "../models/Review.js";
import { User } from "../models/User.js";

/** Obtiene todos los registros de Review. */
export const getReviews = async (req, res) => {
  try {
    const records = await Review.findAll({ order: [["id", "ASC"]] });
    return res.json(records);
  } catch {
    return res.status(500).json({ message: "No pudimos cargar los registros." });
  }
};

/** Busca un registro de Review mediante su ID. */
export const getReviewById = async (req, res) => {
  const { id } = req.params;
  if (!/^[1-9]\d*$/.test(id ?? "") || !Number.isSafeInteger(Number(id))) {
    return res.status(400).json({ message: "Los identificadores deben ser enteros positivos." });
  }
  try {
    const record = await Review.findByPk(Number(id));
    if (!record) {
      return res.status(404).json({ message: "No encontramos este registro." });
    }
    return res.json(record);
  } catch {
    return res.status(500).json({ message: "No pudimos cargar el registro." });
  }
};

export const createReview = async (req, res) => {
  try {
    const { userId, articleId, rating, title, body } = req.body ?? {};

    // Los identificadores llegan en el JSON y deben referenciar registros válidos.
    if (!Number.isInteger(userId) || userId < 1) {
      return res.status(400).json({ message: "userId debe ser un entero positivo." });
    }

    if (!Number.isInteger(articleId) || articleId < 1) {
      return res.status(400).json({ message: "articleId debe ser un entero positivo." });
    }

    // La calificación se maneja como estrellas de 1 a 5.
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Selecciona una calificación de 1 a 5 estrellas." });
    }

    if (typeof body !== "string" || !body.trim()) {
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
      .status(error.name === "SequelizeValidationError" || error.name === "SequelizeForeignKeyConstraintError" ? 400 : 500)
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
      .status(error.name === "SequelizeValidationError" || error.name === "SequelizeForeignKeyConstraintError" ? 400 : 500)
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
      .status(error.name === "SequelizeValidationError" || error.name === "SequelizeForeignKeyConstraintError" ? 400 : 500)
      .json({ message: "No pudimos cargar las reseñas. Intenta de nuevo más tarde." });
  }
};

export const updateReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "No encontramos esta reseña." });
    }

    // Solo se aceptan columnas editables; las referencias nuevas se comprueban antes de guardar.
    const payload = Object.fromEntries(Object.entries(req.body ?? {}).filter(([key]) =>
      ["rating", "title", "body", "is_active", "user_id", "article_id"].includes(key)
    ));
    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: "Envía al menos un campo editable." });
    }
    if (payload.rating !== undefined && (!Number.isInteger(payload.rating) || payload.rating < 1 || payload.rating > 5)) {
      return res.status(400).json({ message: "Selecciona una calificación de 1 a 5 estrellas." });
    }
    if (payload.body !== undefined && (typeof payload.body !== "string" || !payload.body.trim())) {
      return res.status(400).json({ message: "Escribe el contenido de tu reseña." });
    }
    for (const [key, model] of [["user_id", User], ["article_id", Article]]) {
      if (payload[key] === undefined) continue;
      if (!Number.isInteger(payload[key]) || payload[key] < 1) {
        return res.status(400).json({ message: `${key} debe ser un entero positivo.` });
      }
      if (!await model.findByPk(payload[key])) {
        return res.status(404).json({ message: "No encontramos el usuario o artículo indicado." });
      }
    }
    await review.update(payload);

    return res.json(review);
  } catch (error) {
    console.log("Error updating review:", error);
    return res
      .status(error.name === "SequelizeValidationError" || error.name === "SequelizeForeignKeyConstraintError" ? 400 : 500)
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
      .status(error.name === "SequelizeValidationError" || error.name === "SequelizeForeignKeyConstraintError" ? 400 : 500)
      .json({ message: "No pudimos eliminar la reseña. Intenta de nuevo más tarde." });
  }
};
