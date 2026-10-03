import app from "./app.js";
import { sequelize } from "./database/database.js";
import { setupRelations } from "./models/relations.js";
import { initializeUsers } from "./database/initUsers.js";
import { initializeCategories } from "./database/initCategories.js";
import { initializeBrands } from "./database/initBrands.js";
import { initializeStores } from "./database/initStores.js";
import { initializeArticles } from "./database/initArticles.js";
import { initializeReviews } from "./database/initReviews.js";
import { initializeComments } from "./database/initComments.js";
import { initializeReviewLikes } from "./database/initReviewLikes.js";
import { initializeCommentLikes } from "./database/initCommentLikes.js";
import { initializeFollows } from "./database/initFollows.js";
import { initializeReviewBookmarks } from "./database/initReviewBookmarks.js";
import { initializeArticleStores } from "./database/initArticleStores.js";
import { initializeNotifications } from "./database/initNotifications.js";

async function init() {
  try {
    await sequelize.authenticate();
    setupRelations();
    await sequelize.sync({ force: false });

    // La transacción evita dejar una carga parcial si falla cualquier entidad.
    await sequelize.transaction(async (transaction) => {
      const options = { transaction };
      const users = await initializeUsers(options);
      const categories = await initializeCategories(options);
      const brands = await initializeBrands(options);
      const stores = await initializeStores(options);
      const articles = await initializeArticles(categories, brands, options);
      const reviews = await initializeReviews(users, articles, options);
      const comments = await initializeComments(users, reviews, options);
      const reviewLikes = await initializeReviewLikes(users, reviews, options);
      const commentLikes = await initializeCommentLikes(users, comments, options);
      const follows = await initializeFollows(users, options);
      const reviewBookmarks = await initializeReviewBookmarks(users, reviews, options);
      const articleStores = await initializeArticleStores(articles, stores, options);
      const notifications = await initializeNotifications(users, reviews, comments, options);
    });

    app.listen(3000, () => console.log("Server is running on port 3000"));
  } catch (error) {
    console.error("Error starting the server:", error.message);
    process.exitCode = 1;
  }
}

init();
