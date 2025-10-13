import React, { createContext, useState, useContext, useEffect } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = authService.getStoredUser();
        const storedProfile = authService.getStoredProfile();
        const token = authService.getToken();

        if (token && storedUser) {
          setUser(storedUser);
          setProfile(storedProfile);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error loading user:", error);
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
    setIsAuthenticated(false);
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      const data = await authService.getCurrentUser();
      setUser(data.user);
      setProfile(data.profile);
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
