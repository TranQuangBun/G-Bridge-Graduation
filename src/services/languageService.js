import axios from "axios";

// Base URL của backend API
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:4000/api";

// Create axios instance với config mặc định
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to request headers if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

const languageService = {
  /**
   * Lấy danh sách languages của user hiện tại
   * @returns {Promise} List of languages
   */
  getMyLanguages: async () => {
    try {
      const response = await apiClient.get("/languages");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to get languages" };
    }
  },

  /**
   * Thêm language mới
   * @param {Object} languageData - Thông tin language
   * @returns {Promise} Created language
   */
  addLanguage: async (languageData) => {
    try {
      const response = await apiClient.post("/languages", languageData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to add language" };
    }
  },

  /**
   * Cập nhật language
   * @param {number} id - ID của language
   * @param {Object} languageData - Dữ liệu cập nhật
   * @returns {Promise} Updated language
   */
  updateLanguage: async (id, languageData) => {
    try {
      const response = await apiClient.put(`/languages/${id}`, languageData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to update language" };
    }
  },

  /**
   * Xóa language
   * @param {number} id - ID của language
   * @returns {Promise} Response
   */
  deleteLanguage: async (id) => {
    try {
      const response = await apiClient.delete(`/languages/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to delete language" };
    }
  },
};

export default languageService;
