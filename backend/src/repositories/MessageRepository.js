import { BaseRepository } from "./BaseRepository.js";
import { Message } from "../entities/Message.js";
import { Not } from "typeorm";

export class MessageRepository extends BaseRepository {
  constructor() {
    super(Message);
  }

  async findByConversationId(conversationId, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    return await this.repository.findAndCount({
      where: { conversationId: parseInt(conversationId) },
      relations: ["sender"],
      take: limit,
      skip: offset,
      order: { createdAt: "DESC" },
    });
  }

  async markAsRead(conversationId, userId) {
    return await this.repository.update(
      {
        conversationId: parseInt(conversationId),
        senderId: Not(parseInt(userId)), // Not sent by current user
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );
  }

  async getUnreadCount(conversationId, userId) {
    return await this.repository.count({
      where: {
        conversationId: parseInt(conversationId),
        senderId: Not(parseInt(userId)),
        isRead: false,
      },
    });
  }
}

