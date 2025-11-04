import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { Op } from "sequelize";

/**
 * Get all notifications for current user
 * GET /api/notifications
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 20,
      isRead,
      type,
      priority,
    } = req.query;

    const offset = (page - 1) * limit;

    // Build filter
    const where = { userId };

    if (isRead !== undefined) {
      where.isRead = isRead === "true";
    }

    if (type) {
      where.type = type;
    }

    if (priority) {
      where.priority = priority;
    }

    // Get notifications with pagination
    const { count, rows: notifications } = await Notification.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Get unread count
    const unreadCount = await Notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
        unreadCount,
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    res.json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unread count",
      error: error.message,
    });
  }
};

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    await notification.update({
      isRead: true,
      readAt: new Date(),
    });

    res.json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.update(
      {
        isRead: true,
        readAt: new Date(),
      },
      {
        where: {
          userId,
          isRead: false,
        },
      }
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
      error: error.message,
    });
  }
};

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    await notification.destroy();

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      error: error.message,
    });
  }
};

/**
 * Delete all notifications
 * DELETE /api/notifications/all
 */
export const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.destroy({
      where: { userId },
    });

    res.json({
      success: true,
      message: "All notifications deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete all notifications",
      error: error.message,
    });
  }
};

/**
 * Create notification (internal use or admin)
 * POST /api/notifications
 */
export const createNotification = async (req, res) => {
  try {
    const {
      userId,
      type,
      title,
      message,
      data,
      link,
      icon,
      priority,
      expiresAt,
    } = req.body;

    // Validate user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      data,
      link,
      icon,
      priority: priority || "normal",
      expiresAt,
    });

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create notification",
      error: error.message,
    });
  }
};

/**
 * Helper function to create notification (can be called from other controllers)
 */
export const createNotificationHelper = async ({
  userId,
  type,
  title,
  message,
  data = null,
  link = null,
  icon = null,
  priority = "normal",
  expiresAt = null,
}) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      data,
      link,
      icon,
      priority,
      expiresAt,
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Clean up expired notifications (cron job)
 * DELETE /api/notifications/cleanup
 */
export const cleanupExpiredNotifications = async (req, res) => {
  try {
    const deletedCount = await Notification.destroy({
      where: {
        expiresAt: {
          [Op.lt]: new Date(),
        },
      },
    });

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} expired notifications`,
      data: { deletedCount },
    });
  } catch (error) {
    console.error("Error cleaning up notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cleanup notifications",
      error: error.message,
    });
  }
};
