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
import { initializeProductRequests } from "./database/initProductRequests.js";
import { isDatabaseEmpty } from "./database/seedData.js";

async function init() {
  try {
    await sequelize.authenticate();
    setupRelations();
    // El borrado solo se activa con la opción explícita de make dev-reset.
    const resetDatabase = process.argv.includes("--reset-db");
    await sequelize.sync({ force: resetDatabase });

    // Una instalación nueva carga la copia incluida; reiniciar una base con datos no la sobrescribe.
    if (resetDatabase || process.argv.includes("--seed") || await isDatabaseEmpty()) {
      await sequelize.transaction(async transaction => {
        const initializers = [
          initializeUsers, initializeCategories, initializeBrands, initializeStores,
          initializeArticles, initializeReviews, initializeComments, initializeReviewLikes,
          initializeCommentLikes, initializeFollows, initializeReviewBookmarks,
          initializeArticleStores, initializeNotifications, initializeProductRequests,
        ];
        for (const initialize of initializers) await initialize({ transaction });
      });
    }

    app.listen(3000, () => console.log("Server is running on port 3000"));
  } catch (error) {
    console.error("Error starting the server:", error.message);
    process.exitCode = 1;
  }
}

init();
