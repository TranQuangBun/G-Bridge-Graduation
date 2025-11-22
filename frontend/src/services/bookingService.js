import apiClient from "../api/client.js";
import { getErrorMessage } from "../utils/errors.js";

const bookingService = {
  // Create booking request
  createBookingRequest: async (bookingData) => {
    try {
      const response = await apiClient.post("/bookings", bookingData);
      return response.data;
    } catch (error) {
      console.error("Error creating booking request:", error);
      throw { message: getErrorMessage(error) };
    }
  },

  // Get bookings for interpreter
  getInterpreterBookings: async () => {
    try {
      const response = await apiClient.get("/bookings/interpreter");
      return response.data;
    } catch (error) {
      console.error("Error fetching interpreter bookings:", error);
      throw { message: getErrorMessage(error) };
    }
  },

  // Get bookings sent by client
  getClientBookings: async () => {
    try {
      const response = await apiClient.get("/bookings/client");
      return response.data;
    } catch (error) {
      console.error("Error fetching client bookings:", error);
      throw { message: getErrorMessage(error) };
    }
  },

  // Get single booking detail
  getBookingDetail: async (id) => {
    try {
      const response = await apiClient.get(`/bookings/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching booking detail:", error);
      throw { message: getErrorMessage(error) };
    }
  },

  // Update booking status
  updateBookingStatus: async (id, status) => {
    try {
      const response = await apiClient.patch(`/bookings/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error("Error updating booking status:", error);
      throw { message: getErrorMessage(error) };
    }
  },
};

export default bookingService;

