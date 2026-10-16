import { Comment } from "../models/Comment.js";
import { initializeRows } from "./seedData.js";

/** Carga Comments desde la copia de Firestore conservando IDs, fechas y filas existentes. */
export async function initializeComments(options = {}) {
  return initializeRows(Comment, options);
}
