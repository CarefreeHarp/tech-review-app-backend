import { Notification } from "../models/Notification.js";
import { initializeRows } from "./seedData.js";

/** Carga Notifications desde la copia de Firestore conservando IDs, fechas y filas existentes. */
export async function initializeNotifications(options = {}) {
  return initializeRows(Notification, options);
}
