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

const certificationService = {
  /**
   * Lấy danh sách certifications của user hiện tại
   * @returns {Promise} List of certifications
   */
  getMyCertifications: async () => {
    try {
      const response = await apiClient.get("/certifications");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to get certifications" };
    }
  },

  /**
   * Thêm certification mới
   * @param {Object} certificationData - Thông tin certification
   * @returns {Promise} Created certification
   */
  addCertification: async (certificationData) => {
    try {
      const response = await apiClient.post(
        "/certifications",
        certificationData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to add certification" };
    }
  },

  /**
   * Cập nhật certification
   * @param {number} id - ID của certification
   * @param {Object} certificationData - Dữ liệu cập nhật
   * @returns {Promise} Updated certification
   */
  updateCertification: async (id, certificationData) => {
    try {
      const response = await apiClient.put(
        `/certifications/${id}`,
        certificationData
      );
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || { message: "Failed to update certification" }
      );
    }
  },

  /**
   * Upload certification image
   * @param {number} id - ID của certification
   * @param {File} file - File ảnh hoặc PDF
   * @returns {Promise} Updated certification with imageUrl
   */
  uploadCertificationImage: async (id, file) => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await apiClient.post(
        `/certifications/${id}/upload-image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to upload image" };
    }
  },

  /**
   * Xóa certification
   * @param {number} id - ID của certification
   * @returns {Promise} Response
   */
  deleteCertification: async (id) => {
    try {
      const response = await apiClient.delete(`/certifications/${id}`);
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || { message: "Failed to delete certification" }
      );
    }
  },
};

export default certificationService;
