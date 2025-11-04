import axios from "axios";

const API_URL = "http://localhost:4000/api/notifications";

// Get authorization token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Get all notifications for current user
 * @param {Object} params - Query parameters (page, limit, isRead, type, priority)
 * @returns {Promise}
 */
const getNotifications = async (params = {}) => {
  try {
    const response = await axios.get(API_URL, {
      headers: getAuthHeader(),
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error.response?.data || error;
  }
};

/**
 * Get unread notification count
 * @returns {Promise}
 */
const getUnreadCount = async () => {
  try {
    const response = await axios.get(`${API_URL}/unread-count`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching unread count:", error);
    throw error.response?.data || error;
  }
};

/**
 * Mark notification as read
 * @param {number} notificationId
 * @returns {Promise}
 */
const markAsRead = async (notificationId) => {
  try {
    const response = await axios.put(
      `${API_URL}/${notificationId}/read`,
      {},
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error.response?.data || error;
  }
};

/**
 * Mark all notifications as read
 * @returns {Promise}
 */
const markAllAsRead = async () => {
  try {
    const response = await axios.put(
      `${API_URL}/read-all`,
      {},
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error.response?.data || error;
  }
};

/**
 * Delete notification
 * @param {number} notificationId
 * @returns {Promise}
 */
const deleteNotification = async (notificationId) => {
  try {
    const response = await axios.delete(`${API_URL}/${notificationId}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error.response?.data || error;
  }
};

/**
 * Delete all notifications
 * @returns {Promise}
 */
const deleteAllNotifications = async () => {
  try {
    const response = await axios.delete(`${API_URL}/all`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    throw error.response?.data || error;
  }
};

/**
 * Create notification (admin only)
 * @param {Object} notificationData
 * @returns {Promise}
 */
const createNotification = async (notificationData) => {
  try {
    const response = await axios.post(API_URL, notificationData, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error.response?.data || error;
  }
};

const notificationService = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  createNotification,
};

export default notificationService;
