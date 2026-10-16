import { ReviewBookmark } from "../models/ReviewBookmark.js";
import { initializeRows } from "./seedData.js";

/** Carga ReviewBookmarks desde la copia de Firestore conservando IDs, fechas y filas existentes. */
export async function initializeReviewBookmarks(options = {}) {
  return initializeRows(ReviewBookmark, options);
}
