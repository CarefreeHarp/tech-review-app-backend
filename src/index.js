import app from "./app.js";
import { sequelize } from "./database/database.js";
import "./models/Article.js";
import "./models/User.js";
import "./models/Review.js";
import "./models/ReviewLike.js";

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

    app.listen(3000, () => {
      console.log("Server listening on http://localhost:3000");
    });
  } catch (error) {
    console.log("Error starting the server:", error);
  }
}

init();
