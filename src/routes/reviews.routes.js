import { Router } from "express";

import {
    createReview,
    getReviewsByArticle,
    getReviewsByUser,
    updateReview,
    deleteReview
} from "../controllers/reviews.controller.js";


const router = Router();


// Crear review
// POST localhost:3000/reviews
router.post("/reviews", createReview);


// Reviews de un artículo
// GET localhost:3000/articles/:id/reviews
router.get("/articles/:id/reviews", getReviewsByArticle);


// Reviews de un usuario
// GET localhost:3000/users/:id/reviews
router.get("/users/:id/reviews", getReviewsByUser);


// Actualizar review
// PUT localhost:3000/reviews/:id
router.put("/reviews/:id", updateReview);


// Eliminar review
// DELETE localhost:3000/reviews/:id
router.delete("/reviews/:id", deleteReview);


export default router;