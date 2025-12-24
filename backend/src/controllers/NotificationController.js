import { NotificationService } from "../services/NotificationService.js";
import { sendSuccess, sendError } from "../utils/Response.js";
import { logError } from "../utils/Errors.js";
import { NotificationType } from "../entities/Notification.js";
import { AppDataSource } from "../config/DataSource.js";
import { User } from "../entities/User.js";

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

export async function sendConnectionRequest(req, res) {
  try {
    const clientId = req.user.sub || req.user.id;
    const { interpreterId, message, jobId } = req.body;

    if (!interpreterId) {
      return sendError(res, "Interpreter ID is required", 400);
    }

    // Get client info for notification
    const userRepository = AppDataSource.getRepository(User);
    const client = await userRepository.findOne({ where: { id: clientId } });

    const title = jobId 
      ? `Connection request for job: ${req.body.jobTitle || "Job"}`
      : "New connection request";
    
    const notificationMessage = message || 
      `${client?.fullName || "A client"} wants to connect with you${jobId ? " regarding a job opportunity" : ""}.`;

    await notificationService.createNotification({
      recipientId: interpreterId,
      actorId: clientId,
      type: NotificationType.CONNECTION_REQUEST,
      title: title,
      message: notificationMessage,
      metadata: {
        jobId: jobId || null,
        message: message || null,
      },
    });

    return sendSuccess(res, { success: true }, "Connection request sent successfully");
  } catch (error) {
    logError(error, "Sending connection request");
    return sendError(res, "Error sending connection request", 500, error);
  }
}

