import { Router } from "express";
import { getUsers, getUserById } from "../controller/users.controller.js";

const router = Router();
router.get("/users", getUsers);
router.get("/users/:id", getUserById);
export default router;
