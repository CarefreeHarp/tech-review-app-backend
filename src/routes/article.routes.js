import { Router } from "express";

import { 
    getArticles,
    getArticleById
} from "../controller/articles.controller.js";


const router = Router();


// GET localhost:3000/articles
router.get("/articles", getArticles);

// GET localhost:3000/articles/:id
router.get("/articles/:id", getArticleById);


export default router;