import { ProductRequest } from "../models/ProductRequest.js";
import { initializeRows } from "./seedData.js";

/** Carga ProductRequests desde la copia de Firestore conservando IDs, fechas y filas existentes. */
export async function initializeProductRequests(options = {}) {
  return initializeRows(ProductRequest, options);
}
