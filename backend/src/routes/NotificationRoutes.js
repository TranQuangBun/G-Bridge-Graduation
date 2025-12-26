import express from "express";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  sendConnectionRequest,
} from "../controllers/NotificationController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/me", authRequired, getMyNotifications);
router.patch("/:id/read", authRequired, markNotificationRead);
router.patch("/me/read-all", authRequired, markAllNotificationsRead);
router.post("/connection-request", authRequired, sendConnectionRequest);

export default router;

