import express from "express";
import articlesRoutes from "./routes/articles.routes.js";
import reviewsRoutes from "./routes/reviews.routes.js";
import usersRoutes from "./routes/users.routes.js";

const app = express();
app.use(express.json());

app.use(usersRoutes);
app.use(articlesRoutes);
app.use(reviewsRoutes);

export default app;
