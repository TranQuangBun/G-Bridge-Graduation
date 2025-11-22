import { BaseRepository } from "./BaseRepository.js";
import { Notification } from "../entities/Notification.js";

export class NotificationRepository extends BaseRepository {
  constructor() {
    super(Notification);
  }

  async findByRecipient(recipientId, { isRead, limit = 20, page = 1 } = {}) {
    const where = { recipientId: parseInt(recipientId) };
    if (typeof isRead === "boolean") {
      where.isRead = isRead;
    }
    const take = parseInt(limit);
    const skip = (parseInt(page) - 1) * take;

    const [notifications, total] = await this.repository.findAndCount({
      where,
      relations: ["actor"],
      order: { createdAt: "DESC" },
      take,
      skip,
    });

    return { notifications, total };
  }
}

