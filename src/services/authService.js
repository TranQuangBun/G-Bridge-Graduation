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

const authService = {
  /**
   * Đăng ký tài khoản mới
   * @param {Object} userData - Thông tin đăng ký
   * @returns {Promise} Response from API
   */
  register: async (userData) => {
    try {
      const response = await apiClient.post("/auth/register", userData);

      // Lưu token và user info vào localStorage
      if (response.data.token) {
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("profile", JSON.stringify(response.data.profile));
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Đăng ký thất bại" };
    }
  },

  /**
   * Đăng nhập
   * @param {string} email - Email
   * @param {string} password - Password
   * @returns {Promise} Response from API
   */
  login: async (email, password) => {
    try {
      const response = await apiClient.post("/auth/login", { email, password });

      // Lưu token và user info vào localStorage
      if (response.data.token) {
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("profile", JSON.stringify(response.data.profile));
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Đăng nhập thất bại" };
    }
  },

  /**
   * Đăng xuất
   */
  logout: () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("profile");
    window.location.href = "/login";
  },

  /**
   * Lấy thông tin user hiện tại
   * @returns {Promise} User info
   */
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get("/auth/me");

      // Cập nhật localStorage
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("profile", JSON.stringify(response.data.profile));
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Không thể lấy thông tin user" };
    }
  },

  /**
   * Kiểm tra xem user đã đăng nhập chưa
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return !!localStorage.getItem("authToken");
  },

  /**
   * Lấy user info từ localStorage
   * @returns {Object|null}
   */
  getStoredUser: () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Lấy profile từ localStorage
   * @returns {Object|null}
   */
  getStoredProfile: () => {
    const profileStr = localStorage.getItem("profile");
    return profileStr ? JSON.parse(profileStr) : null;
  },

  /**
   * Lấy token từ localStorage
   * @returns {string|null}
   */
  getToken: () => {
    return localStorage.getItem("authToken");
  },
};

export default authService;
