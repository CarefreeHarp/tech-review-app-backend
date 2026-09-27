import app from "./app.js";
import { sequelize } from "./database/database.js";
import "./models/Article.js";
import "./models/User.js";
import "./models/Review.js";
import "./models/ReviewLike.js";
import { initializeData } from "./database/seed.js";


async function init() {
  try {
    await sequelize
      .authenticate()
      .then(() => {
        console.log("Database connected");
      })
      .catch((error) => {
        console.log("Error connecting to the database:", error);
      });

    await sequelize.sync({ force: false });
    await initializeData();
  } catch (error) {
    console.log("Error starting the server:", error);
  }
}

init();
