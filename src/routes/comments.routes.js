import { Router } from "express";
import { getComments, getCommentById, createComment } from "../controller/comments.controller.js";

const router = Router();
router.get("/comments", getComments);
router.get("/comments/:id", getCommentById);
router.post("/reviews/:id/comments", createComment);
export default router;
