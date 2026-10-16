import { Article } from "../models/Article.js";
import { initializeRows } from "./seedData.js";

/** Carga Articles desde la copia de Firestore conservando IDs, fechas y filas existentes. */
export async function initializeArticles(options = {}) {
  return initializeRows(Article, options);
}
