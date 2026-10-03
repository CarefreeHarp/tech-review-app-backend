import { Router } from "express";
import { getStores, getStoreById } from "../controller/stores.controller.js";

const router = Router();
router.get("/stores", getStores);
router.get("/stores/:id", getStoreById);
export default router;
