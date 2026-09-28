import { Router } from "express";
import {
  createReview,
  deleteReview,
  getReviewsByArticle,
  getReviewsByUser,
  updateReview,
} from "../controllers/reviews.controller.js";

const router = Router();

router.post("/users/:userId/articles/:articleId/reviews", createReview);
router.get("/articles/:articleId/reviews", getReviewsByArticle);
router.get("/users/:userId/reviews", getReviewsByUser);
router.put("/reviews/:id", updateReview);
router.delete("/reviews/:id", deleteReview);

export default router;
