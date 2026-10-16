import { Router } from "express";
import { getUsers, getUserById, getUserByFirebaseUid, createUser, updateUser } from "../controller/users.controller.js";

const router = Router();
router.get("/users", getUsers);
router.get("/users/by-firebase-uid/:uid", getUserByFirebaseUid);
router.get("/users/:id", getUserById);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
export default router;
