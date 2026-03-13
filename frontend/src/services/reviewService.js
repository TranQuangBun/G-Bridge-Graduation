import apiClient from "../api/client.js";
import { getErrorMessage } from "../utils/errors.js";

const reviewService = {
  // Create a review
  createReview: async (reviewData) => {
    try {
      const response = await apiClient.post("/reviews", reviewData);
      return response.data;
    } catch (error) {
      console.error("Error creating review:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Get reviews by reviewee ID
  getReviewsByRevieweeId: async (revieweeId, page = 1, limit = 10) => {
    try {
      const response = await apiClient.get(
        `/reviews/reviewee/${revieweeId}?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching reviews:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Get reviews by reviewer ID
  getReviewsByReviewerId: async (reviewerId, page = 1, limit = 10) => {
    try {
      const response = await apiClient.get(
        `/reviews/reviewer/${reviewerId}?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching reviews:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Get reviews by job application ID
  getReviewsByJobApplicationId: async (jobApplicationId) => {
    try {
      const response = await apiClient.get(
        `/reviews/job-application/${jobApplicationId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching reviews:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Get review by ID
  getReviewById: async (id) => {
    try {
      const response = await apiClient.get(`/reviews/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching review:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Update review
  updateReview: async (id, reviewData) => {
    try {
      const response = await apiClient.put(`/reviews/${id}`, reviewData);
      return response.data;
    } catch (error) {
      console.error("Error updating review:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Delete review
  deleteReview: async (id) => {
    try {
      const response = await apiClient.delete(`/reviews/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting review:", error);
      throw new Error(getErrorMessage(error));
    }
  },
};

export default reviewService;

