import { Router } from "express";
import { getNotifications, getNotificationById } from "../controller/notifications.controller.js";

const router = Router();
router.get("/notifications", getNotifications);
router.get("/notifications/:id", getNotificationById);
export default router;
