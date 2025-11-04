import express from "express";
import * as notificationController from "../controllers/notificationController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

// Get all notifications for current user
router.get("/", authRequired, notificationController.getNotifications);

// Get unread notification count
router.get(
  "/unread-count",
  authRequired,
  notificationController.getUnreadCount
);

// Mark notification as read
router.put("/:id/read", authRequired, notificationController.markAsRead);

// Mark all notifications as read
router.put(
  "/read-all",
  authRequired,
  notificationController.markAllAsRead
);

// Delete notification
router.delete(
  "/:id",
  authRequired,
  notificationController.deleteNotification
);

// Delete all notifications
router.delete(
  "/all",
  authRequired,
  notificationController.deleteAllNotifications
);

// Create notification (admin or internal use)
router.post("/", authRequired, notificationController.createNotification);

// Cleanup expired notifications (cron job)
router.delete(
  "/cleanup/expired",
  notificationController.cleanupExpiredNotifications
);

export default router;
