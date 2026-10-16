import { Store } from "../models/Store.js";
import { initializeRows } from "./seedData.js";

/** Carga Stores desde la copia de Firestore conservando IDs, fechas y filas existentes. */
export async function initializeStores(options = {}) {
  return initializeRows(Store, options);
}
