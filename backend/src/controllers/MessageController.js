import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";
import { logError } from "../utils/Errors.js";
import { ConversationService } from "../services/ConversationService.js";
import { MessageService } from "../services/MessageService.js";

const conversationService = new ConversationService();
const messageService = new MessageService();

export async function getConversations(req, res) {
  try {
    const userId = req.user?.sub || req.user?.id;
    const { includeArchived = false, includeDeleted = false } = req.query;

    if (!userId) {
      return sendError(res, "User ID is required", 401);
    }

    const conversations = await conversationService.getUserConversations(
      userId,
      includeArchived === "true",
      includeDeleted === "true"
    );

    // Transform conversations to include other participant info
    const transformedConversations = conversations.map((conv) => {
      const isParticipant1 = conv.participant1Id === parseInt(userId);
      const otherParticipant = isParticipant1 ? conv.participant2 : conv.participant1;
      const unreadCount = isParticipant1
        ? conv.participant1UnreadCount
        : conv.participant2UnreadCount;
      const isArchived = isParticipant1
        ? conv.participant1Archived
        : conv.participant2Archived;

      return {
        id: conv.id,
        otherParticipant: {
          id: otherParticipant.id,
          fullName: otherParticipant.fullName,
          email: otherParticipant.email,
          avatar: otherParticipant.avatar,
          role: otherParticipant.role,
        },
        lastMessage: conv.lastMessage
          ? {
              id: conv.lastMessage.id,
              content: conv.lastMessage.content,
              senderId: conv.lastMessage.senderId,
              sender: {
                id: conv.lastMessage.sender?.id,
                fullName: conv.lastMessage.sender?.fullName,
              },
              createdAt: conv.lastMessage.createdAt,
            }
          : null,
        lastMessageAt: conv.lastMessageAt,
        unreadCount,
        isArchived,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      };
    });

    return sendSuccess(res, transformedConversations, "Conversations retrieved successfully");
  } catch (error) {
    logError(error, "getting conversations");
    return sendError(res, "Error retrieving conversations", 500, error);
  }
}

export async function getConversation(req, res) {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.sub || req.user?.id;

    if (!userId) {
      return sendError(res, "User ID is required", 401);
    }

    const conversation = await conversationService.getConversationById(
      conversationId,
      userId
    );

    const isParticipant1 = conversation.participant1Id === parseInt(userId);
    const otherParticipant = isParticipant1
      ? conversation.participant2
      : conversation.participant1;

    const transformed = {
      id: conversation.id,
      otherParticipant: {
        id: otherParticipant.id,
        fullName: otherParticipant.fullName,
        email: otherParticipant.email,
        avatar: otherParticipant.avatar,
        role: otherParticipant.role,
      },
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
      unreadCount: isParticipant1
        ? conversation.participant1UnreadCount
        : conversation.participant2UnreadCount,
      createdAt: conversation.createdAt,
    };

    return sendSuccess(res, transformed, "Conversation retrieved successfully");
  } catch (error) {
    logError(error, "getting conversation");
    if (error.message.includes("not found")) {
      return sendError(res, error.message, 404);
    }
    if (error.message.includes("Unauthorized")) {
      return sendError(res, error.message, 403);
    }
    return sendError(res, "Error retrieving conversation", 500, error);
  }
}

export async function createOrGetConversation(req, res) {
  try {
    const { otherUserId } = req.body;
    const userId = req.user?.sub || req.user?.id;

    if (!userId) {
      return sendError(res, "User ID is required", 401);
    }

    if (!otherUserId) {
      return sendError(res, "Other user ID is required", 400);
    }

    if (parseInt(userId) === parseInt(otherUserId)) {
      return sendError(res, "Cannot create conversation with yourself", 400);
    }

    const conversation = await conversationService.getOrCreateConversation(
      userId,
      otherUserId
    );

    const isParticipant1 = conversation.participant1Id === parseInt(userId);
    const otherParticipant = isParticipant1
      ? conversation.participant2
      : conversation.participant1;

    const transformed = {
      id: conversation.id,
      otherParticipant: {
        id: otherParticipant.id,
        fullName: otherParticipant.fullName,
        email: otherParticipant.email,
        avatar: otherParticipant.avatar,
        role: otherParticipant.role,
      },
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
      unreadCount: isParticipant1
        ? conversation.participant1UnreadCount
        : conversation.participant2UnreadCount,
      createdAt: conversation.createdAt,
    };

    return sendSuccess(res, transformed, "Conversation retrieved/created successfully");
  } catch (error) {
    logError(error, "creating/getting conversation");
    if (error.message.includes("Cannot create conversation") || error.message.includes("approved")) {
      return sendError(res, error.message, 403);
    }
    return sendError(res, "Error creating/getting conversation", 500, error);
  }
}

export async function createConversationFromApplication(req, res) {
  try {
    const { applicationId } = req.body;
    const userId = req.user?.sub || req.user?.id;

    if (!userId) {
      return sendError(res, "User ID is required", 401);
    }

    if (!applicationId) {
      return sendError(res, "Application ID is required", 400);
    }

    const conversation = await conversationService.getOrCreateConversationFromApplication(
      applicationId,
      userId
    );

    const isParticipant1 = conversation.participant1Id === parseInt(userId);
    const otherParticipant = isParticipant1
      ? conversation.participant2
      : conversation.participant1;

    const transformed = {
      id: conversation.id,
      otherParticipant: {
        id: otherParticipant.id,
        fullName: otherParticipant.fullName,
        email: otherParticipant.email,
        avatar: otherParticipant.avatar,
        role: otherParticipant.role,
      },
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
      unreadCount: isParticipant1
        ? conversation.participant1UnreadCount
        : conversation.participant2UnreadCount,
      createdAt: conversation.createdAt,
    };

    return sendSuccess(res, transformed, "Conversation created successfully", 201);
  } catch (error) {
    logError(error, "creating conversation from application");
    if (error.message.includes("not found") || error.message.includes("not authorized")) {
      return sendError(res, error.message, 404);
    }
    if (error.message.includes("must be approved") || error.message.includes("approved")) {
      return sendError(res, error.message, 403);
    }
    return sendError(res, "Error creating conversation", 500, error);
  }
}

export async function archiveConversation(req, res) {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.sub || req.user?.id;

    if (!userId) {
      return sendError(res, "User ID is required", 401);
    }

    await conversationService.archiveConversation(conversationId, userId);

    return sendSuccess(res, null, "Conversation archived successfully");
  } catch (error) {
    logError(error, "archiving conversation");
    if (error.message.includes("not found")) {
      return sendError(res, error.message, 404);
    }
    return sendError(res, "Error archiving conversation", 500, error);
  }
}

export async function unarchiveConversation(req, res) {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.sub || req.user?.id;

    if (!userId) {
      return sendError(res, "User ID is required", 401);
    }

    await conversationService.unarchiveConversation(conversationId, userId);

    return sendSuccess(res, null, "Conversation unarchived successfully");
  } catch (error) {
    logError(error, "unarchiving conversation");
    if (error.message.includes("not found")) {
      return sendError(res, error.message, 404);
    }
    return sendError(res, "Error unarchiving conversation", 500, error);
  }
}

export async function deleteConversation(req, res) {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.sub || req.user?.id;

    if (!userId) {
      return sendError(res, "User ID is required", 401);
    }

    await conversationService.deleteConversation(conversationId, userId);

    return sendSuccess(res, null, "Conversation deleted successfully");
  } catch (error) {
    logError(error, "deleting conversation");
    if (error.message.includes("not found")) {
      return sendError(res, error.message, 404);
    }
    return sendError(res, "Error deleting conversation", 500, error);
  }
}

export async function markConversationAsRead(req, res) {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.sub || req.user?.id;

    if (!userId) {
      return sendError(res, "User ID is required", 401);
    }

    await conversationService.markConversationAsRead(conversationId, userId);

    return sendSuccess(res, null, "Conversation marked as read");
  } catch (error) {
    logError(error, "marking conversation as read");
    if (error.message.includes("not found")) {
      return sendError(res, error.message, 404);
    }
    return sendError(res, "Error marking conversation as read", 500, error);
  }
}

export async function getUnreadCount(req, res) {
  try {
    const userId = req.user?.sub || req.user?.id;

    if (!userId) {
      return sendError(res, "User ID is required", 401);
    }

    const count = await conversationService.getUnreadCount(userId);

    return sendSuccess(res, { unreadCount: count }, "Unread count retrieved");
  } catch (error) {
    logError(error, "getting unread count");
    return sendError(res, "Error getting unread count", 500, error);
  }
}

export async function getMessages(req, res) {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user?.sub || req.user?.id;

    if (!userId) {
      return sendError(res, "User ID is required", 401);
    }

    const result = await messageService.getMessages(
      conversationId,
      userId,
      parseInt(page),
      parseInt(limit)
    );

    // Transform messages
    const transformedMessages = result.messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      sender: {
        id: msg.sender.id,
        fullName: msg.sender.fullName,
        avatar: msg.sender.avatar,
      },
      isRead: msg.isRead,
      readAt: msg.readAt,
      createdAt: msg.createdAt,
    }));

    return sendPaginated(
      res,
      transformedMessages,
      result.pagination,
      "Messages retrieved successfully"
    );
  } catch (error) {
    logError(error, "getting messages");
    if (error.message.includes("not found") || error.message.includes("Unauthorized")) {
      return sendError(res, error.message, error.message.includes("not found") ? 404 : 403);
    }
    return sendError(res, "Error retrieving messages", 500, error);
  }
}

export async function sendMessage(req, res) {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    const userId = req.user?.sub || req.user?.id;

    if (!userId) {
      return sendError(res, "User ID is required", 401);
    }

    if (!content || !content.trim()) {
      return sendError(res, "Message content is required", 400);
    }

    const message = await messageService.sendMessage(
      conversationId,
      userId,
      content
    );

    const transformed = {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      sender: {
        id: message.sender.id,
        fullName: message.sender.fullName,
        avatar: message.sender.avatar,
      },
      isRead: message.isRead,
      readAt: message.readAt,
      createdAt: message.createdAt,
    };

    return sendSuccess(res, transformed, "Message sent successfully", 201);
  } catch (error) {
    logError(error, "sending message");
    if (error.message.includes("not found") || error.message.includes("Unauthorized")) {
      return sendError(res, error.message, error.message.includes("not found") ? 404 : 403);
    }
    return sendError(res, "Error sending message", 500, error);
  }
}

export async function deleteMessage(req, res) {
  try {
    const { messageId } = req.params;
    const userId = req.user?.sub || req.user?.id;

    if (!userId) {
      return sendError(res, "User ID is required", 401);
    }

    await messageService.deleteMessage(messageId, userId);

    return sendSuccess(res, null, "Message deleted successfully");
  } catch (error) {
    logError(error, "deleting message");
    if (error.message.includes("not found")) {
      return sendError(res, error.message, 404);
    }
    if (error.message.includes("Unauthorized")) {
      return sendError(res, error.message, 403);
    }
    return sendError(res, "Error deleting message", 500, error);
  }
}

