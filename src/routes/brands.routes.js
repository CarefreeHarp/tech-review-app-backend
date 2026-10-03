import { Router } from "express";
import { getBrands, getBrandById } from "../controller/brands.controller.js";

const router = Router();
router.get("/brands", getBrands);
router.get("/brands/:id", getBrandById);
export default router;
