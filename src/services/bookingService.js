import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:4000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to request headers
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

const bookingService = {
  // Create a booking request
  createBooking: async (bookingData) => {
    try {
      const response = await apiClient.post("/bookings", bookingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get bookings for interpreter (received requests)
  getInterpreterBookings: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach((key) => {
        if (
          params[key] !== undefined &&
          params[key] !== null &&
          params[key] !== ""
        ) {
          queryParams.append(key, params[key]);
        }
      });

      const response = await apiClient.get(
        `/bookings/interpreter?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get bookings sent by client
  getClientBookings: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach((key) => {
        if (
          params[key] !== undefined &&
          params[key] !== null &&
          params[key] !== ""
        ) {
          queryParams.append(key, params[key]);
        }
      });

      const response = await apiClient.get(
        `/bookings/client?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get booking detail
  getBookingDetail: async (id) => {
    try {
      const response = await apiClient.get(`/bookings/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update booking status (for interpreter)
  updateBookingStatus: async (id, status, notes = null) => {
    try {
      const response = await apiClient.patch(`/bookings/${id}/status`, {
        status,
        interpreterNotes: notes,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default bookingService;
