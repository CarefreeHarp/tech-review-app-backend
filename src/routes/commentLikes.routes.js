import { Router } from "express";
import { getCommentLikes, getCommentLikeById, toggleCommentLike } from "../controller/commentLikes.controller.js";

const router = Router();
router.get("/comment-likes", getCommentLikes);
router.get("/comment-likes/:id", getCommentLikeById);
router.post("/reviews/:reviewId/comments/:commentId/likes/toggle", toggleCommentLike);
export default router;
