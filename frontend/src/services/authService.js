import { apiClient } from "../api/index.js";
import { authStorage } from "../utils/storage.js";
import { getErrorMessage } from "../utils/errors.js";

const authService = {
  /**
   * Đăng ký tài khoản mới
   * @param {Object} userData - Thông tin đăng ký
   * @returns {Promise} Response from API
   */
  register: async (userData) => {
    try {
      const response = await apiClient.post("/auth/register", userData);
      
      console.log("Register response:", response.data);

      // Lưu token và user info vào localStorage
      // Check both response.data.token and response.data.data.token (nested structure)
      const token = response.data.token || response.data.data?.token;
      const user = response.data.user || response.data.data?.user;
      const profile = response.data.profile || response.data.data?.profile;
      const languages = response.data.languages || response.data.data?.languages || [];
      const certifications = response.data.certifications || response.data.data?.certifications || [];

      if (token) {
        console.log("Saving registration data to localStorage:", { 
          hasToken: !!token, 
          hasUser: !!user,
          hasProfile: !!profile,
          userFullName: user?.fullName,
          userKeys: user ? Object.keys(user) : []
        });
        try {
          authStorage.setToken(token);
          if (user) {
            // Ensure fullName is present
            if (!user.fullName && user.name) {
              user.fullName = user.name;
            }
            authStorage.setUser(user);
          }
          if (profile) authStorage.setProfile(profile);
          authStorage.setLanguages(languages);
          authStorage.setCertifications(certifications);
          
          // Verify it was saved
          const savedToken = authStorage.getToken();
          const savedUser = authStorage.getUser();
          const savedProfile = authStorage.getProfile();
          console.log("Verification after registration save:", { 
            tokenSaved: !!savedToken, 
            userSaved: !!savedUser,
            profileSaved: !!savedProfile,
            tokenMatch: savedToken === token,
            savedUserFullName: savedUser?.fullName,
            savedUserKeys: savedUser ? Object.keys(savedUser) : []
          });
        } catch (storageError) {
          console.error("Error saving registration to localStorage:", storageError);
          throw { message: "Không thể lưu thông tin đăng ký. Vui lòng kiểm tra cài đặt trình duyệt." };
        }
      } else {
        console.warn("No token in registration response:", response.data);
      }

      return {
        token,
        user,
        profile,
        languages,
        certifications,
        ...response.data
      };
    } catch (error) {
      console.error("Registration error:", error);
      throw { message: getErrorMessage(error) || "Đăng ký thất bại" };
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
      
      console.log("Login response:", response.data);

      // Lưu token và user info vào localStorage
      // Check both response.data.token and response.data.data.token (nested structure)
      const token = response.data.token || response.data.data?.token;
      const user = response.data.user || response.data.data?.user;
      const profile = response.data.profile || response.data.data?.profile;
      const languages = response.data.languages || response.data.data?.languages || [];
      const certifications = response.data.certifications || response.data.data?.certifications || [];

      if (token) {
        console.log("Saving to localStorage:", { 
          hasToken: !!token, 
          hasUser: !!user,
          userFullName: user?.fullName,
          userKeys: user ? Object.keys(user) : []
        });
        try {
          authStorage.setToken(token);
          if (user) {
            // Ensure fullName is present
            if (!user.fullName && user.name) {
              user.fullName = user.name;
            }
            authStorage.setUser(user);
          }
          if (profile) authStorage.setProfile(profile);
          authStorage.setLanguages(languages);
          authStorage.setCertifications(certifications);
          
          // Verify it was saved
          const savedToken = authStorage.getToken();
          const savedUser = authStorage.getUser();
          console.log("Verification after save:", { 
            tokenSaved: !!savedToken, 
            userSaved: !!savedUser,
            tokenMatch: savedToken === token,
            savedUserFullName: savedUser?.fullName,
            savedUserKeys: savedUser ? Object.keys(savedUser) : []
          });
        } catch (storageError) {
          console.error("Error saving to localStorage:", storageError);
          throw { message: "Không thể lưu thông tin đăng nhập. Vui lòng kiểm tra cài đặt trình duyệt." };
        }
      } else {
        console.warn("No token in response:", response.data);
      }

      return {
        token,
        user,
        profile,
        languages,
        certifications,
        ...response.data
      };
    } catch (error) {
      console.error("Login error:", error);
      throw { message: getErrorMessage(error) || "Đăng nhập thất bại" };
    }
  },

  /**
   * Đăng xuất
   */
  logout: () => {
    authStorage.clearAll();
    window.location.href = "/login";
  },

  /**
   * Lấy thông tin user hiện tại
   * @returns {Promise} User info
   */
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get("/auth/me");
      
      console.log("getCurrentUser response:", {
        hasData: !!response.data,
        hasDataData: !!response.data?.data,
        // /auth/me returns user object directly in data, not data.user
        userRole: response.data?.data?.role || response.data?.user?.role,
        hasClientProfile: !!(response.data?.data?.clientProfile || response.data?.user?.clientProfile),
        hasInterpreterProfile: !!(response.data?.data?.interpreterProfile || response.data?.user?.interpreterProfile),
        fullResponse: response.data
      });

      // Cập nhật localStorage
      // Backend /auth/me returns: { success: true, data: { id, fullName, role, clientProfile, ... } }
      // So user object IS response.data.data (the data field contains the user object directly)
      const user = response.data.data || response.data.user;
      // Extract profile from user object
      const profile = user?.interpreterProfile || user?.clientProfile || null;
      const languages = user?.languages || [];
      const certifications = user?.certifications || [];

      if (user) {
        // Ensure fullName is present
        if (!user.fullName && user.name) {
          user.fullName = user.name;
        }
        
        authStorage.setUser(user);
        if (profile) authStorage.setProfile(profile);
        authStorage.setLanguages(languages);
        authStorage.setCertifications(certifications);
        
        console.log("Saved user to localStorage:", {
          role: user.role,
          hasClientProfile: !!user.clientProfile,
          hasInterpreterProfile: !!user.interpreterProfile
        });
      }

      return {
        user,
        profile,
        languages,
        certifications,
        ...response.data
      };
    } catch (error) {
      // Preserve the original axios error so AuthContext can check status code
      // Only wrap if it's not already an axios error
      if (error.response) {
        throw error; // Keep original axios error with response.status
      }
      throw { 
        message: getErrorMessage(error) || "Không thể lấy thông tin user",
        originalError: error 
      };
    }
  },

  /**
   * Toggle active status (only for interpreters)
   * @returns {Promise} Response from API
   */
  toggleActiveStatus: async () => {
    try {
      const response = await apiClient.put("/auth/toggle-active-status");
      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) || "Không thể thay đổi trạng thái hoạt động" };
    }
  },

  /**
   * Kiểm tra xem user đã đăng nhập chưa
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return !!authStorage.getToken();
  },

  /**
   * Lấy user info từ localStorage
   * @returns {Object|null}
   */
  getStoredUser: () => {
    return authStorage.getUser();
  },

  /**
   * Lấy profile từ localStorage
   * @returns {Object|null}
   */
  getStoredProfile: () => {
    return authStorage.getProfile();
  },

  /**
   * Lấy languages từ localStorage
   * @returns {Array}
   */
  getStoredLanguages: () => {
    return authStorage.getLanguages();
  },

  /**
   * Lấy certifications từ localStorage
   * @returns {Array}
   */
  getStoredCertifications: () => {
    return authStorage.getCertifications();
  },

  /**
   * Lấy token từ localStorage
   * @returns {string|null}
   */
  getToken: () => {
    return authStorage.getToken();
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
        authStorage.setUser(response.data.user);
      }

      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) || "Cập nhật thất bại" };
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
        authStorage.setProfile(response.data.profile);
      }

      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) || "Cập nhật thất bại" };
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
        authStorage.setUser(response.data.user);
      }

      return response.data;
    } catch (error) {
      throw { message: getErrorMessage(error) || "Upload thất bại" };
    }
  },
};

export default authService;
