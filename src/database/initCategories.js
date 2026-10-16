import { Category } from "../models/Category.js";
import { initializeRows } from "./seedData.js";

/** Carga Categories desde la copia de Firestore conservando IDs, fechas y filas existentes. */
export async function initializeCategories(options = {}) {
  return initializeRows(Category, options);
}
