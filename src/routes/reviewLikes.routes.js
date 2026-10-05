import { Router } from "express";
import { getReviewLikes, getReviewLikeById } from "../controller/reviewLikes.controller.js";

const router = Router();
router.get("/review-likes", getReviewLikes);
router.get("/review-likes/:id", getReviewLikeById);
export default router;
