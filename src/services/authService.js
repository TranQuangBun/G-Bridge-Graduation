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
      // Don't redirect here, let the calling code handle it
      // Just clear the stored data
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      localStorage.removeItem("profile");
      localStorage.removeItem("languages");
      localStorage.removeItem("certifications");
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
        localStorage.setItem(
          "languages",
          JSON.stringify(response.data.languages || [])
        );
        localStorage.setItem(
          "certifications",
          JSON.stringify(response.data.certifications || [])
        );
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
        localStorage.setItem(
          "languages",
          JSON.stringify(response.data.languages || [])
        );
        localStorage.setItem(
          "certifications",
          JSON.stringify(response.data.certifications || [])
        );
        localStorage.setItem(
          "subscription",
          JSON.stringify(response.data.subscription || null)
        );

        console.log("✅ authService - Login successful");
        console.log(
          "📦 authService - Subscription:",
          response.data.subscription
        );
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
    localStorage.removeItem("languages");
    localStorage.removeItem("certifications");
    localStorage.removeItem("subscription");
    window.location.href = "/login";
  },

  /**
   * Lấy thông tin user hiện tại
   * @returns {Promise} User info
   */
  getCurrentUser: async () => {
    try {
      console.log("🔄 authService - Calling /auth/me...");
      const response = await apiClient.get("/auth/me");
      console.log("📦 authService - Response from /auth/me:", response.data);

      // Cập nhật localStorage
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("profile", JSON.stringify(response.data.profile));
        localStorage.setItem(
          "languages",
          JSON.stringify(response.data.languages || [])
        );
        localStorage.setItem(
          "certifications",
          JSON.stringify(response.data.certifications || [])
        );
        localStorage.setItem(
          "subscription",
          JSON.stringify(response.data.subscription || null)
        );
        console.log(
          "✅ authService - Saved subscription to localStorage:",
          response.data.subscription
        );
      }

      return response.data;
    } catch (error) {
      console.error("❌ authService - Error:", error);
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
   * Lấy languages từ localStorage
   * @returns {Array}
   */
  getStoredLanguages: () => {
    const languagesStr = localStorage.getItem("languages");
    return languagesStr ? JSON.parse(languagesStr) : [];
  },

  /**
   * Lấy certifications từ localStorage
   * @returns {Array}
   */
  getStoredCertifications: () => {
    const certificationsStr = localStorage.getItem("certifications");
    return certificationsStr ? JSON.parse(certificationsStr) : [];
  },

  /**
   * Lấy token từ localStorage
   * @returns {string|null}
   */
  getToken: () => {
    return localStorage.getItem("authToken");
  },

  /**
   * Cập nhật thông tin user cơ bản (fullName, phone, address, avatar)
   * @param {Object} userData - Dữ liệu cần cập nhật
   * @returns {Promise} Response from API
   */
  updateUserProfile: async (userData) => {
    try {
      const response = await apiClient.put("/auth/profile", userData);

      // Cập nhật localStorage
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Cập nhật thất bại" };
    }
  },

  /**
   * Cập nhật thông tin interpreter profile
   * @param {Object} profileData - Dữ liệu profile (languages, certifications, etc.)
   * @returns {Promise} Response from API
   */
  updateInterpreterProfile: async (profileData) => {
    try {
      const response = await apiClient.put(
        "/auth/interpreter-profile",
        profileData
      );

      // Cập nhật localStorage
      if (response.data.profile) {
        localStorage.setItem("profile", JSON.stringify(response.data.profile));
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Cập nhật thất bại" };
    }
  },

  /**
   * Upload avatar
   * @param {File} file - File ảnh avatar
   * @returns {Promise} Response from API
   */
  uploadAvatar: async (file) => {
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await apiClient.post("/auth/upload-avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Cập nhật localStorage
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Upload thất bại" };
    }
  },
};

export default authService;
