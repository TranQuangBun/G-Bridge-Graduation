import apiClient from "../api/client.js";
import { getErrorMessage } from "../utils/errors.js";

const messageService = {
  // Get all conversations for current user
  getConversations: async (includeArchived = false, includeDeleted = false) => {
    try {
      const params = new URLSearchParams();
      if (includeArchived) params.append("includeArchived", "true");
      if (includeDeleted) params.append("includeDeleted", "true");

      const response = await apiClient.get(
        `/messages/conversations?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching conversations:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Get unread count
  getUnreadCount: async () => {
    try {
      const response = await apiClient.get(
        "/messages/conversations/unread-count"
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Create or get existing conversation
  createOrGetConversation: async (otherUserId) => {
    try {
      const response = await apiClient.post("/messages/conversations", {
        otherUserId: parseInt(otherUserId),
      });
      return response.data;
    } catch (error) {
      console.error("Error creating/getting conversation:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Create conversation from approved application
  createConversationFromApplication: async (applicationId) => {
    try {
      const response = await apiClient.post(
        "/messages/conversations/from-application",
        {
          applicationId: parseInt(applicationId),
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error creating conversation from application:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Get conversation by ID
  getConversation: async (conversationId) => {
    try {
      const response = await apiClient.get(
        `/messages/conversations/${conversationId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching conversation:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Mark conversation as read
  markConversationAsRead: async (conversationId) => {
    try {
      const response = await apiClient.patch(
        `/messages/conversations/${conversationId}/read`
      );
      return response.data;
    } catch (error) {
      console.error("Error marking conversation as read:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Archive conversation
  archiveConversation: async (conversationId) => {
    try {
      const response = await apiClient.patch(
        `/messages/conversations/${conversationId}/archive`
      );
      return response.data;
    } catch (error) {
      console.error("Error archiving conversation:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Unarchive conversation
  unarchiveConversation: async (conversationId) => {
    try {
      const response = await apiClient.patch(
        `/messages/conversations/${conversationId}/unarchive`
      );
      return response.data;
    } catch (error) {
      console.error("Error unarchiving conversation:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Delete conversation
  deleteConversation: async (conversationId) => {
    try {
      const response = await apiClient.delete(
        `/messages/conversations/${conversationId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting conversation:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Get messages in a conversation
  getMessages: async (conversationId, page = 1, limit = 50) => {
    try {
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", limit);

      const response = await apiClient.get(
        `/messages/conversations/${conversationId}/messages?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Send a message
  sendMessage: async (conversationId, content) => {
    try {
      const response = await apiClient.post(
        `/messages/conversations/${conversationId}/messages`,
        { content: content.trim() }
      );
      return response.data;
    } catch (error) {
      console.error("Error sending message:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Delete a message
  deleteMessage: async (messageId) => {
    try {
      const response = await apiClient.delete(
        `/messages/messages/${messageId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting message:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Update a message
  updateMessage: async (messageId, data) => {
    try {
      const response = await apiClient.patch(
        `/messages/messages/${messageId}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error("Error updating message:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Send message with file
  sendMessageWithFile: async (conversationId, content, file) => {
    try {
      const formData = new FormData();
      if (content) formData.append("content", content.trim());
      formData.append("file", file);

      const response = await apiClient.post(
        `/messages/conversations/${conversationId}/messages/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error sending message with file:", error);
      throw new Error(getErrorMessage(error));
    }
  },
};

export default messageService;
