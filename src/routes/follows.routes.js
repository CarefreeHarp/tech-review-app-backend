import { Router } from "express";
import { getFollows, getFollowById } from "../controller/follows.controller.js";

const router = Router();
router.get("/follows", getFollows);
router.get("/follows/:follower_id/:followed_id", getFollowById);
export default router;
