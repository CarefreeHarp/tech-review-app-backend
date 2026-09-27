import app from "./app.js";
import { sequelize } from "./database/database.js";
import { setupRelations } from "./models/relations.js";
import "./models/Article.js";
import "./models/User.js";
import "./models/Review.js";
import "./models/ReviewLike.js";

async function init() {
  
  try {
    await sequelize.authenticate()
  .then(() => {
        console.log("Database connected");
  })
  .catch((error) => {
        console.log("Error connecting to the database:", error);
  });

    setupRelations(); // las relaciones 

    await sequelize.sync({ force: false }); // las tablas

    app.listen(3000, () => {
        console.log("Server is running on port 3000");
    })
    
  } catch (error) {
    console.log("Error starting the server:", error);
  }
}

init();
