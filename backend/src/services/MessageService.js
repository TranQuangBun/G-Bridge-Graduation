import { MessageRepository } from "../repositories/MessageRepository.js";
import { ConversationRepository } from "../repositories/ConversationRepository.js";
import { AppDataSource } from "../config/DataSource.js";
import { Message } from "../entities/Message.js";
import { Conversation } from "../entities/Conversation.js";

export class MessageService {
  constructor() {
    this.messageRepository = new MessageRepository();
    this.conversationRepository = new ConversationRepository();
  }

  async sendMessage(conversationId, senderId, content, fileData = null) {
    // Verify conversation exists and user is a participant
    const conversation = await this.conversationRepository.findById(
      conversationId
    );

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (
      conversation.participant1Id !== parseInt(senderId) &&
      conversation.participant2Id !== parseInt(senderId)
    ) {
      throw new Error(
        "Unauthorized: You are not a participant in this conversation"
      );
    }

    // Create message
    const messageData = {
      conversationId: parseInt(conversationId),
      senderId: parseInt(senderId),
      content: content?.trim() || "",
      isRead: false,
    };

    // Add file data if provided
    if (fileData) {
      messageData.fileUrl = fileData.fileUrl;
      messageData.fileName = fileData.fileName;
      messageData.fileType = fileData.fileType;
      messageData.fileSize = fileData.fileSize;
    }

    const message = await this.messageRepository.create(messageData);

    // Update conversation
    conversation.lastMessageId = message.id;
    conversation.lastMessageAt = new Date();

    // Increment unread count for the other participant
    if (conversation.participant1Id === parseInt(senderId)) {
      conversation.participant2UnreadCount =
        (conversation.participant2UnreadCount || 0) + 1;
    } else {
      conversation.participant1UnreadCount =
        (conversation.participant1UnreadCount || 0) + 1;
    }

    await this.conversationRepository.repository.save(conversation);

    // Return message with relations
    return await this.messageRepository.repository.findOne({
      where: { id: message.id },
      relations: ["sender", "conversation"],
    });
  }

  async getMessages(conversationId, userId, page = 1, limit = 50) {
    // Verify user is a participant
    const conversation = await this.conversationRepository.findById(
      conversationId
    );

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (
      conversation.participant1Id !== parseInt(userId) &&
      conversation.participant2Id !== parseInt(userId)
    ) {
      throw new Error(
        "Unauthorized: You are not a participant in this conversation"
      );
    }

    const [messages, total] = await this.messageRepository.findByConversationId(
      conversationId,
      page,
      limit
    );

    return {
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async markAsRead(messageId, userId) {
    const message = await this.messageRepository.findById(messageId);

    if (!message) {
      throw new Error("Message not found");
    }

    // Only mark as read if user is not the sender
    if (message.senderId === parseInt(userId)) {
      return message;
    }

    message.isRead = true;
    message.readAt = new Date();

    return await this.messageRepository.repository.save(message);
  }

  async deleteMessage(messageId, userId) {
    const message = await this.messageRepository.findById(messageId);

    if (!message) {
      throw new Error("Message not found");
    }

    // Only allow sender to delete
    if (message.senderId !== parseInt(userId)) {
      throw new Error("Unauthorized: You can only delete your own messages");
    }

    // Soft delete: mark as deleted instead of removing
    message.deletedAt = new Date();
    message.deletedBy = parseInt(userId);
    message.content = ""; // Clear content for privacy
    message.fileUrl = null; // Clear file URL
    message.fileName = null;
    message.fileType = null;
    message.fileSize = null;

    const updatedMessage = await this.messageRepository.repository.save(
      message
    );

    // Return with sender relation
    const result = await this.messageRepository.repository.findOne({
      where: { id: updatedMessage.id },
      relations: ["sender"],
    });

    console.log("Deleted message result:", {
      id: result.id,
      deletedAt: result.deletedAt,
      deletedBy: result.deletedBy,
      content: result.content,
    });

    return result;
  }

  async updateMessage(messageId, userId, content) {
    const message = await this.messageRepository.findById(messageId);

    if (!message) {
      throw new Error("Message not found");
    }

    // Only allow sender to update
    if (message.senderId !== parseInt(userId)) {
      throw new Error("Unauthorized: You can only update your own messages");
    }

    message.content = content;
    message.isEdited = true;
    message.updatedAt = new Date();

    return await this.messageRepository.repository.save(message);
  }
}
