import express from "express";

import usersRoutes from "./routes/users.routes.js";
import articleRoutes from "./routes/article.routes.js";
import reviewsRoutes from "./routes/reviews.routes.js";


const app = express();

app.use(express.json());

// Routes
app.use(usersRoutes);
app.use(articleRoutes);
app.use(reviewsRoutes);


export default app;