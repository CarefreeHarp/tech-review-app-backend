import { Router } from "express";
import { getCommentLikes, getCommentLikeById } from "../controller/commentLikes.controller.js";

const router = Router();
router.get("/comment-likes", getCommentLikes);
router.get("/comment-likes/:id", getCommentLikeById);
export default router;
