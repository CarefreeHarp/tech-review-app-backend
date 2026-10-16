import { Follow } from "../models/Follow.js";
import { initializeRows } from "./seedData.js";

/** Carga Follows desde la copia de Firestore conservando IDs, fechas y filas existentes. */
export async function initializeFollows(options = {}) {
  return initializeRows(Follow, options);
}
