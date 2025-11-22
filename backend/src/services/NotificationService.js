import { NotificationRepository } from "../repositories/NotificationRepository.js";
import { AppDataSource } from "../config/DataSource.js";
import { User } from "../entities/User.js";
import { NotificationType } from "../entities/Notification.js";

export class NotificationService {
  constructor() {
    this.notificationRepository = new NotificationRepository();
    this.userRepository = AppDataSource.getRepository(User);
  }

  async createNotification({
    recipientId,
    actorId = null,
    type = NotificationType.GENERIC,
    title,
    message = "",
    metadata = null,
  }) {
    if (!recipientId || !title) {
      throw new Error("recipientId and title are required");
    }

    const payload = {
      recipientId: parseInt(recipientId),
      actorId: actorId ? parseInt(actorId) : null,
      type,
      title,
      message,
      metadata,
    };

    return await this.notificationRepository.create(payload);
  }

  async getNotifications(recipientId, { page = 1, limit = 20, isRead } = {}) {
    const { notifications, total } =
      await this.notificationRepository.findByRecipient(recipientId, {
        page,
        limit,
        isRead,
      });

    return {
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async markAsRead(recipientId, notificationId) {
    const notification = await this.notificationRepository.findById(
      parseInt(notificationId)
    );
    if (!notification || notification.recipientId !== parseInt(recipientId)) {
      throw new Error("Notification not found");
    }

    return await this.notificationRepository.update(notification.id, {
      isRead: true,
      readAt: new Date(),
    });
  }

  async markAllAsRead(recipientId) {
    await this.notificationRepository.repository.update(
      { recipientId: parseInt(recipientId), isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return true;
  }
}

