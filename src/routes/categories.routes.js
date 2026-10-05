import { Router } from "express";
import { getCategories, getCategoryById } from "../controller/categories.controller.js";

const router = Router();
router.get("/categories", getCategories);
router.get("/categories/:id", getCategoryById);
export default router;
