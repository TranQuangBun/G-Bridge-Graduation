import axios from "axios";

// Base URL của backend API
// React app chạy trong browser (host), không phải trong container
// Browser không biết Docker service names, nên cần dùng localhost:4000
// Environment variable REACT_APP_API_URL được set trong docker-compose.yml
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:4000/api";

// Create axios instance với config mặc định
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 150000, // 150 seconds timeout (batch AI scoring can take ~100s)
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
    // Don't clear localStorage here - let AuthContext handle it
    // This allows AuthContext to decide whether to logout or keep cached data
    // Only log the error for debugging
    if (error.response?.status === 401) {
      console.warn("401 Unauthorized - AuthContext will handle logout if needed");
    }
    return Promise.reject(error);
  }
);

export default apiClient;

