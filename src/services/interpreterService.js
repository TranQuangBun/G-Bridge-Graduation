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

const interpreterService = {
  // Get all interpreters with filters
  getInterpreters: async (filters = {}) => {
    try {
      const params = new URLSearchParams();

      Object.keys(filters).forEach((key) => {
        if (
          filters[key] !== undefined &&
          filters[key] !== null &&
          filters[key] !== ""
        ) {
          params.append(key, filters[key]);
        }
      });

      const response = await apiClient.get(
        `/interpreters?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching interpreters:", error);
      throw error.response?.data || error;
    }
  },

  // Get single interpreter by ID
  getInterpreterById: async (id) => {
    try {
      const response = await apiClient.get(`/interpreters/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching interpreter:", error);
      throw error.response?.data || error;
    }
  },

  // Get available languages for filter
  getAvailableLanguages: async () => {
    try {
      const response = await apiClient.get("/interpreters/languages");
      return response.data;
    } catch (error) {
      console.error("Error fetching languages:", error);
      throw error.response?.data || error;
    }
  },

  // Get available specializations for filter
  getAvailableSpecializations: async () => {
    try {
      const response = await apiClient.get("/interpreters/specializations");
      return response.data;
    } catch (error) {
      console.error("Error fetching specializations:", error);
      throw error.response?.data || error;
    }
  },
};

export default interpreterService;
