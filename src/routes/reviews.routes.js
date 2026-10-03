import { Router } from "express";
import {
  createReview,
  getReviews,
  getReviewById,
  deleteReview,
  getReviewsByArticle,
  getReviewsByUser,
  updateReview,
} from "../controller/reviews.controller.js";

const router = Router();

router.get("/reviews", getReviews);
router.get("/reviews/:id", getReviewById);
router.post("/reviews", createReview);
router.get("/articles/:articleId/reviews", getReviewsByArticle);
router.get("/users/:userId/reviews", getReviewsByUser);
router.put("/reviews/:id", updateReview);
router.delete("/reviews/:id", deleteReview);

export default router;
