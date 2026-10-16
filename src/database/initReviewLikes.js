import { ReviewLike } from "../models/ReviewLike.js";
import { initializeRows } from "./seedData.js";

/** Carga ReviewLikes desde la copia de Firestore conservando IDs, fechas y filas existentes. */
export async function initializeReviewLikes(options = {}) {
  return initializeRows(ReviewLike, options);
}
