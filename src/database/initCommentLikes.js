import { CommentLike } from "../models/CommentLike.js";
import { initializeRows } from "./seedData.js";

/** Carga CommentLikes desde la copia de Firestore conservando IDs, fechas y filas existentes. */
export async function initializeCommentLikes(options = {}) {
  return initializeRows(CommentLike, options);
}
