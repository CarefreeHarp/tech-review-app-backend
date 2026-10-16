import { User } from "../models/User.js";
import { initializeRows } from "./seedData.js";

/** Carga Users desde la copia de Firestore conservando IDs, fechas y filas existentes. */
export async function initializeUsers(options = {}) {
  return initializeRows(User, options);
}
