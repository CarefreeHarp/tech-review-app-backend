import { Router } from "express";
import { getArticleStores, getArticleStoreById } from "../controller/articleStores.controller.js";

const router = Router();
router.get("/article-stores", getArticleStores);
router.get("/article-stores/:article_id/:store_id", getArticleStoreById);
export default router;
