import { Router } from "express";
import { getProductRequests, getProductRequestById, createProductRequest, updateProductRequest, deleteProductRequest } from "../controller/productRequests.controller.js";

const router = Router();
router.get("/product-requests", getProductRequests);
router.get("/product-requests/:id", getProductRequestById);
router.post("/product-requests", createProductRequest);
router.put("/product-requests/:id", updateProductRequest);
router.delete("/product-requests/:id", deleteProductRequest);
export default router;
