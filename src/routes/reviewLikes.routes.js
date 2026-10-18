import { Router } from "express";
import { getReviewLikes, getReviewLikeById, toggleReviewLike } from "../controller/reviewLikes.controller.js";

const router = Router();
router.get("/review-likes", getReviewLikes);
router.get("/review-likes/:id", getReviewLikeById);
router.post("/reviews/:id/likes/toggle", toggleReviewLike);
export default router;
