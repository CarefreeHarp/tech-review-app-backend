import { Router } from "express";
import { getReviewBookmarks, getReviewBookmarkById } from "../controller/reviewBookmarks.controller.js";

const router = Router();
router.get("/review-bookmarks", getReviewBookmarks);
router.get("/review-bookmarks/:user_id/:review_id", getReviewBookmarkById);
export default router;
