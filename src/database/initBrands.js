import { Brand } from "../models/Brand.js";
import { initializeRows } from "./seedData.js";

/** Carga Brands desde la copia de Firestore conservando IDs, fechas y filas existentes. */
export async function initializeBrands(options = {}) {
  return initializeRows(Brand, options);
}
