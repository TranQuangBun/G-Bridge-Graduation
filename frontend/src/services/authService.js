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
      const languages =
        response.data.languages || response.data.data?.languages || [];
      const certifications =
        response.data.certifications ||
        response.data.data?.certifications ||
        [];

      if (token) {
        console.log("Saving registration data to localStorage:", {
          hasToken: !!token,
          hasUser: !!user,
          hasProfile: !!profile,
          userFullName: user?.fullName,
          userKeys: user ? Object.keys(user) : [],
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
            savedUserKeys: savedUser ? Object.keys(savedUser) : [],
          });
        } catch (storageError) {
          console.error(
            "Error saving registration to localStorage:",
            storageError
          );
          throw new Error(
            "Không thể lưu thông tin đăng ký. Vui lòng kiểm tra cài đặt trình duyệt."
          );
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
        ...response.data,
      };
    } catch (error) {
      console.error("Registration error:", error);
      throw new Error(getErrorMessage(error) || "Đăng ký thất bại");
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
      const languages =
        response.data.languages || response.data.data?.languages || [];
      const certifications =
        response.data.certifications ||
        response.data.data?.certifications ||
        [];

      if (token) {
        console.log("Saving to localStorage:", {
          hasToken: !!token,
          hasUser: !!user,
          userFullName: user?.fullName,
          userKeys: user ? Object.keys(user) : [],
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
            savedUserKeys: savedUser ? Object.keys(savedUser) : [],
          });
        } catch (storageError) {
          console.error("Error saving to localStorage:", storageError);
          throw new Error(
            "Không thể lưu thông tin đăng nhập. Vui lòng kiểm tra cài đặt trình duyệt."
          );
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
        ...response.data,
      };
    } catch (error) {
      console.error("Login error:", error);
      throw new Error(getErrorMessage(error) || "Đăng nhập thất bại");
    }
  },

  /**
   * Đăng xuất
   * Note: This function only clears storage. Navigation should be handled by the component.
   */
  logout: () => {
    authStorage.clearAll();
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
        hasClientProfile: !!(
          response.data?.data?.clientProfile ||
          response.data?.user?.clientProfile
        ),
        hasInterpreterProfile: !!(
          response.data?.data?.interpreterProfile ||
          response.data?.user?.interpreterProfile
        ),
        fullResponse: response.data,
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
          hasInterpreterProfile: !!user.interpreterProfile,
        });
      }

      return {
        user,
        profile,
        languages,
        certifications,
        ...response.data,
      };
    } catch (error) {
      // Preserve the original axios error so AuthContext can check status code
      // Only wrap if it's not already an axios error
      if (error.response) {
        throw error; // Keep original axios error with response.status
      }
      const errorMessage =
        getErrorMessage(error) || "Không thể lấy thông tin user";
      const err = new Error(errorMessage);
      err.originalError = error;
      throw err;
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
      throw new Error(
        getErrorMessage(error) || "Không thể thay đổi trạng thái hoạt động"
      );
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
      throw new Error(getErrorMessage(error) || "Cập nhật thất bại");
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
      throw new Error(getErrorMessage(error) || "Cập nhật thất bại");
    }
  },

  /**
   * Cập nhật thông tin client profile (company info)
   * @param {Object} profileData - Dữ liệu profile công ty
   * @returns {Promise} Response from API
   */
  updateClientProfile: async (profileData) => {
    try {
      console.log("updateClientProfile - Starting with data:", profileData);

      // First get the client profile ID from user
      const meResponse = await apiClient.get("/auth/me");
      console.log("updateClientProfile - /auth/me full response:", {
        status: meResponse.status,
        data: meResponse.data,
        dataStructure: {
          hasData: !!meResponse.data?.data,
          hasClientProfile: !!meResponse.data?.data?.clientProfile,
          hasUser: !!meResponse.data?.data?.user,
          hasUserClientProfile: !!meResponse.data?.data?.user?.clientProfile,
        },
      });

      // Try multiple possible response structures
      // Backend returns: { success: true, message: "Success", data: userObject }
      // userObject has clientProfile as a relation
      const responseData = meResponse.data;
      const userData = responseData?.data || responseData;

      // userData is the user object itself, which has clientProfile as a property
      const clientProfile = userData?.clientProfile;
      const clientProfileId = clientProfile?.id;

      console.log(
        "updateClientProfile - Extracted clientProfileId:",
        clientProfileId
      );
      console.log("updateClientProfile - clientProfile object:", clientProfile);

      if (!clientProfileId) {
        // Client profile doesn't exist, create it first
        console.log("updateClientProfile - Creating new client profile");
        try {
          const createResponse = await apiClient.post(
            "/client-profiles",
            profileData
          );
          console.log(
            "updateClientProfile - Create response:",
            createResponse.data
          );

          // Backend returns: { success: true, message: "...", data: profileObject }
          const createdProfile =
            createResponse.data?.data || createResponse.data;
          console.log("updateClientProfile - Created profile:", createdProfile);

          // Refresh user data after creation to get updated user with clientProfile
          const refreshResponse = await apiClient.get("/auth/me");
          const refreshResponseData = refreshResponse.data;
          const updatedUserData =
            refreshResponseData?.data || refreshResponseData;

          console.log(
            "updateClientProfile - Refreshed user after create:",
            updatedUserData
          );

          if (updatedUserData) {
            // updatedUserData is the user object itself
            authStorage.setUser(updatedUserData);
            if (updatedUserData.clientProfile) {
              authStorage.setProfile(updatedUserData.clientProfile);
            }
          }

          return createResponse.data;
        } catch (createError) {
          console.error("updateClientProfile - Create error:", createError);
          console.error("Create error response:", createError.response?.data);
          console.error("Create error status:", createError.response?.status);

          // If profile already exists (409), try to update instead
          if (createError.response?.status === 409) {
            console.log(
              "updateClientProfile - Profile already exists (409), fetching ID to update"
            );
            const meResponse2 = await apiClient.get("/auth/me");
            const responseData2 = meResponse2.data;
            const userData2 = responseData2?.data || responseData2;
            const clientProfile2 = userData2?.clientProfile;
            const clientProfileId2 = clientProfile2?.id;

            console.log(
              "updateClientProfile - Found clientProfileId2:",
              clientProfileId2
            );

            if (clientProfileId2) {
              const updateResponse = await apiClient.put(
                `/client-profiles/${clientProfileId2}`,
                profileData
              );
              console.log(
                "updateClientProfile - Update response:",
                updateResponse.data
              );

              // Refresh user data after update
              const refreshResponse = await apiClient.get("/auth/me");
              const refreshResponseData = refreshResponse.data;
              const updatedUserData =
                refreshResponseData?.data || refreshResponseData;

              if (updatedUserData) {
                // updatedUserData is the user object itself
                authStorage.setUser(updatedUserData);
                if (updatedUserData.clientProfile) {
                  authStorage.setProfile(updatedUserData.clientProfile);
                }
              }

              return updateResponse.data;
            } else {
              throw new Error(
                "Không thể tìm thấy ID của client profile để cập nhật"
              );
            }
          } else {
            throw createError;
          }
        }
      } else {
        // Client profile exists, update it
        console.log(
          "updateClientProfile - Updating existing client profile:",
          clientProfileId
        );
        const updateResponse = await apiClient.put(
          `/client-profiles/${clientProfileId}`,
          profileData
        );
        console.log(
          "updateClientProfile - Update response:",
          updateResponse.data
        );

        // Refresh user data after update
        const refreshResponse = await apiClient.get("/auth/me");
        const refreshResponseData = refreshResponse.data;
        const updatedUserData =
          refreshResponseData?.data || refreshResponseData;

        console.log(
          "updateClientProfile - Refreshed user data:",
          updatedUserData
        );

        if (updatedUserData) {
          // updatedUserData is the user object itself
          authStorage.setUser(updatedUserData);
          if (updatedUserData.clientProfile) {
            authStorage.setProfile(updatedUserData.clientProfile);
          }
        }

        return updateResponse.data;
      }
    } catch (error) {
      console.error("Error updating client profile:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error config:", error.config);

      const errorMessage = getErrorMessage(error);
      console.error("Error message:", errorMessage);

      // More specific error messages
      if (error.response?.status === 404) {
        throw new Error(
          "Không tìm thấy thông tin profile. Vui lòng thử lại sau."
        );
      }
      if (error.response?.status === 401) {
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }
      if (
        errorMessage.includes("Route not found") ||
        errorMessage.includes("404")
      ) {
        throw new Error(
          "Không tìm thấy thông tin profile. Vui lòng thử lại sau."
        );
      }
      throw new Error(errorMessage || "Cập nhật thông tin công ty thất bại");
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
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Upload avatar failed");
    }
  },

  /**
   * Upload business license for company
   * @param {FormData} formData - Form data with business license file
   * @returns {Promise} Response from API
   */
  uploadBusinessLicense: async (formData) => {
    try {
      const response = await apiClient.post(
        "/auth/upload-business-license",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(
        getErrorMessage(error) || "Upload business license failed"
      );
    }
  },

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise} Response from API
   */
  forgotPassword: async (email) => {
    try {
      const response = await apiClient.post("/auth/forgot-password", { email });
      return response.data;
    } catch (error) {
      throw new Error(
        getErrorMessage(error) || "Failed to send password reset email"
      );
    }
  },

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise} Response from API
   */
  resetPassword: async (token, newPassword) => {
    try {
      const response = await apiClient.post("/auth/reset-password", {
        token,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Failed to reset password");
    }
  },
};

export default authService;
