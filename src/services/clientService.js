import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

// Get auth token
const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

// Create axios instance with auth
const axiosInstance = axios.create({
  baseURL: `${API_URL}/clients`,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const clientService = {
  // Get client profile
  getProfile: async () => {
    const response = await axiosInstance.get("/profile");
    return response.data;
  },

  // Update client profile
  updateProfile: async (profileData) => {
    const response = await axiosInstance.put("/profile", profileData);
    return response.data;
  },

  // Upload business license
  uploadBusinessLicense: async (data) => {
    const response = await axiosInstance.post(
      "/profile/business-license",
      data
    );
    return response.data;
  },

  // Upload company logo
  uploadLogo: async (data) => {
    const response = await axiosInstance.post("/profile/logo", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Check profile completeness
  checkProfileCompleteness: async () => {
    const response = await axiosInstance.get("/profile/completeness");
    return response.data;
  },

  // Get verification badge for a company
  getVerificationBadge: async (companyId) => {
    const response = await axiosInstance.get(`/${companyId}/badge`);
    return response.data;
  },
};

export default clientService;
