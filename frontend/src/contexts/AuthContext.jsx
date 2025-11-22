import React, { createContext, useState, useContext, useEffect } from "react";
import authService from "../services/authService";
import { authStorage } from "../utils/storage";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = authService.getStoredUser();
        const token = authService.getToken();

        if (token && storedUser) {
          // Optimistically set user from localStorage first (for instant UI)
          console.log("Loading user from localStorage:", { 
            hasToken: !!token, 
            hasUser: !!storedUser,
            userRole: storedUser?.role,
            userFullName: storedUser?.fullName,
            hasClientProfile: !!storedUser?.clientProfile,
            hasInterpreterProfile: !!storedUser?.interpreterProfile,
            userKeys: storedUser ? Object.keys(storedUser) : []
          });
          
          // Ensure fullName is present (fallback to name if needed)
          if (storedUser && !storedUser.fullName && storedUser.name) {
            storedUser.fullName = storedUser.name;
          }
          
          setUser(storedUser);
          setProfile(authService.getStoredProfile());
          setLanguages(authService.getStoredLanguages());
          setCertifications(authService.getStoredCertifications());
          setIsAuthenticated(true);

          // Then verify token with backend and get fresh data
          try {
            console.log("Verifying token with backend...");
            const data = await authService.getCurrentUser();
            // Token is valid, update with fresh data from server
            console.log("Token verified successfully, updating user data", {
              userRole: data.user?.role,
              hasClientProfile: !!data.user?.clientProfile,
              hasInterpreterProfile: !!data.user?.interpreterProfile,
              profile: data.profile
            });
            setUser(data.user);
            setProfile(data.profile);
            setLanguages(data.languages || []);
            setCertifications(data.certifications || []);
            setIsAuthenticated(true);
          } catch (error) {
            // Check error type and status
            const status = error.response?.status;
            const isUnauthorized = status === 401 || status === 403;
            
            console.log("Token verification error:", {
              status,
              isUnauthorized,
              hasResponse: !!error.response,
              message: error.message || error.response?.data?.message,
            });

            // Only logout if it's a 401/403 (unauthorized) error
            // For other errors (network, 500, etc.), keep user logged in with cached data
            if (isUnauthorized) {
              // Token is invalid or expired, clear everything
              console.error("Token validation failed (401/403) - logging out");
              authStorage.clearAll();
              setUser(null);
              setProfile(null);
              setLanguages([]);
              setCertifications([]);
              setIsAuthenticated(false);
            } else {
              // Network error or other errors - keep user logged in with cached data
              console.warn("Failed to verify token (non-auth error), keeping user logged in with cached data:", {
                status,
                message: error.message,
              });
              // User remains authenticated with cached data (already set above)
            }
          }
        } else {
          // No token or user, set as not authenticated
          console.log("No token or user found in localStorage");
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error loading user:", error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      const data = await authService.register(userData);

      setUser(data.user);
      setProfile(data.profile);
      setLanguages(data.languages || []);
      setCertifications(data.certifications || []);
      setIsAuthenticated(true);

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Đăng ký thất bại",
      };
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      const data = await authService.login(email, password);

      setUser(data.user);
      setProfile(data.profile);
      setLanguages(data.languages || []);
      setCertifications(data.certifications || []);
      setIsAuthenticated(true);

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Đăng nhập thất bại",
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setUser(null);
    setProfile(null);
    setLanguages([]);
    setCertifications([]);
    setIsAuthenticated(false);
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      const data = await authService.getCurrentUser();
      setUser(data.user);
      setProfile(data.profile);
      setLanguages(data.languages || []);
      setCertifications(data.certifications || []);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Không thể cập nhật thông tin",
      };
    }
  };

  const value = {
    user,
    profile,
    languages,
    certifications,
    loading,
    isAuthenticated,
    register,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
