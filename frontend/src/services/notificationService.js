import apiClient from "../api/client.js";
import { getErrorMessage } from "../utils/errors.js";

const notificationService = {
  getMyNotifications: async (params = {}) => {
    try {
      const response = await apiClient.get("/notifications/me", {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  markNotificationRead: async (notificationId) => {
    try {
      const response = await apiClient.patch(
        `/notifications/${notificationId}/read`
      );
      return response.data;
    } catch (error) {
      console.error("Error marking notification read:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  markAllNotificationsRead: async () => {
    try {
      const response = await apiClient.patch("/notifications/me/read-all");
      return response.data;
    } catch (error) {
      console.error("Error marking all notifications read:", error);
      throw new Error(getErrorMessage(error));
    }
  },
};

export default notificationService;

