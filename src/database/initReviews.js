import { Review } from "../models/Review.js";
import { initializeRows } from "./seedData.js";

/** Carga Reviews desde la copia de Firestore conservando IDs, fechas y filas existentes. */
export async function initializeReviews(options = {}) {
  return initializeRows(Review, options);
}
