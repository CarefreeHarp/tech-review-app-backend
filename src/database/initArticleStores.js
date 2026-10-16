import { ArticleStore } from "../models/ArticleStore.js";
import { initializeRows } from "./seedData.js";

/** Carga ArticleStores desde la copia de Firestore conservando IDs, fechas y filas existentes. */
export async function initializeArticleStores(options = {}) {
  return initializeRows(ArticleStore, options);
}
