import { Router } from "express";
import { getFollows, getFollowById, setFollowing } from "../controller/follows.controller.js";

const router = Router();
router.get("/follows", getFollows);
router.get("/follows/:follower_id/:followed_id", getFollowById);
router.put("/users/:id/follow", setFollowing);
export default router;
