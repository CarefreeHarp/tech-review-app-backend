import { Article } from "../models/Article.js";
import { Review } from "../models/Review.js";
import { User } from "../models/User.js";

const initialReviews = [
  {
    userIndex: 0,
    articleIndex: 0,
    rating: 5,
    title: "Excelente producto",
    body: "La calidad y el rendimiento cumplen mis expectativas.",
    is_active: true,
  },
  {
    userIndex: 1,
    articleIndex: 1,
    rating: 4,
    title: "Muy buen producto",
    body: "La experiencia de uso ha sido muy buena.",
    is_active: true,
  },
];

export async function initializeReviews() {
  try {
    const count = await Review.count();
    if (count === 0) {
      const users = await User.findAll({ order: [["id", "ASC"]], limit: 2 });
      const articles = await Article.findAll({ order: [["id", "ASC"]], limit: 2 });
      if (users.length === 0 || articles.length === 0) {
        throw new Error("Users and articles are required to initialize reviews");
      }

      const reviews = initialReviews.map(({ userIndex, articleIndex, ...data }) => ({
        ...data,
        user_id: users[userIndex % users.length].id,
        article_id: articles[articleIndex % articles.length].id,
      }));

      await Review.bulkCreate(reviews);
      console.log("Initial reviews loaded");
    }
  } catch (error) {
    console.error("Error initializing reviews:", error);
    throw error;
  }
}
