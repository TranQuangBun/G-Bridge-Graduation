import React, { createContext, useState, useContext, useEffect } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = authService.getStoredUser();
        const token = authService.getToken();

        if (token && storedUser) {
          // Verify token with backend and get fresh data
          try {
            const data = await authService.getCurrentUser();
            // Token is valid, update with fresh data from server
            setUser(data.user);
            setProfile(data.profile);
            setLanguages(data.languages || []);
            setCertifications(data.certifications || []);
            setSubscription(data.subscription || null);
            setIsAuthenticated(true);
          } catch (error) {
            // Token is invalid or expired, clear everything
            console.error("Token validation failed:", error);
            authService.logout();
            setUser(null);
            setProfile(null);
            setLanguages([]);
            setCertifications([]);
            setSubscription(null);
            setIsAuthenticated(false);
          }
        } else {
          // No token or user, set as not authenticated
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
      setSubscription(data.subscription || null);
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
      setSubscription(data.subscription || null);
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
    setSubscription(null);
    setIsAuthenticated(false);
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      console.log("🔄 AuthContext - Fetching user data...");
      const data = await authService.getCurrentUser();
      console.log("📦 AuthContext - Received data:", data);
      console.log("📦 AuthContext - New subscription:", data.subscription);

      setUser(data.user);
      setProfile(data.profile);
      setLanguages(data.languages || []);
      setCertifications(data.certifications || []);
      setSubscription(data.subscription || null);

      console.log("✅ AuthContext - Subscription updated in state!");
      return { success: true, data };
    } catch (error) {
      console.error("❌ AuthContext - Refresh error:", error);
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
    subscription,
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
