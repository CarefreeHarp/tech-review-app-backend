import { Router } from "express";
import { getComments, getCommentById } from "../controller/comments.controller.js";

const router = Router();
router.get("/comments", getComments);
router.get("/comments/:id", getCommentById);
export default router;
