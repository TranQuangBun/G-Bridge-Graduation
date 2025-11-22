import { NotificationService } from "../services/NotificationService.js";
import { sendSuccess, sendError } from "../utils/Response.js";
import { logError } from "../utils/Errors.js";

const notificationService = new NotificationService();

export async function getMyNotifications(req, res) {
  try {
    const userId = req.user.sub || req.user.id;
    const data = await notificationService.getNotifications(userId, req.query);
    return sendSuccess(res, data, "Notifications fetched successfully");
  } catch (error) {
    logError(error, "Fetching notifications");
    return sendError(res, "Error fetching notifications", 500, error);
  }
}

export async function markNotificationRead(req, res) {
  try {
    const userId = req.user.sub || req.user.id;
    const { id } = req.params;
    const notification = await notificationService.markAsRead(userId, id);
    return sendSuccess(res, notification, "Notification marked as read");
  } catch (error) {
    if (error.message === "Notification not found") {
      return sendError(res, error.message, 404);
    }
    logError(error, "Marking notification read");
    return sendError(res, "Error updating notification", 500, error);
  }
}

export async function markAllNotificationsRead(req, res) {
  try {
    const userId = req.user.sub || req.user.id;
    await notificationService.markAllAsRead(userId);
    return sendSuccess(res, true, "All notifications marked as read");
  } catch (error) {
    logError(error, "Marking notifications read");
    return sendError(res, "Error updating notifications", 500, error);
  }
}

